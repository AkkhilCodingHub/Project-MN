use axum::{
    extract::State,
    http::StatusCode,
    response::IntoResponse,
    Json,
};
use serde::{Deserialize, Serialize};
use serde_json::json;
use std::collections::HashSet;
use uuid::Uuid;

use crate::ai::GeminiClient;
use crate::db::DbClient;
use crate::vector::PineconeClient;

#[derive(Clone)]
pub struct QueryState {
    pub db: DbClient,
    pub ai: GeminiClient,
    pub vector: PineconeClient,
}

#[derive(Deserialize)]
pub struct QueryRequestPayload {
    pub user_id: String,
    pub query: String,
}

#[derive(Serialize)]
pub struct QueryResponsePayload {
    pub text: String,
    pub grounded: bool,
    pub sources: Vec<SourceInfo>,
}

#[derive(Serialize, Clone, Debug, PartialEq, Eq, Hash)]
pub struct SourceInfo {
    pub doc: String,
    pub page: i32,
}

pub async fn query_handler(
    State(state): State<QueryState>,
    Json(payload): Json<QueryRequestPayload>,
) -> impl IntoResponse {
    let user_id = match Uuid::parse_str(&payload.user_id) {
        Ok(uuid) => uuid,
        Err(_) => return (StatusCode::BAD_REQUEST, Json(json!({ "error": "Invalid user_id UUID format" }))).into_response(),
    };

    if payload.query.trim().is_empty() {
        return (StatusCode::BAD_REQUEST, Json(json!({ "error": "Query cannot be empty" }))).into_response();
    }

    // 1. Check and increment daily query limit
    match state.db.check_and_increment_query_limit(user_id).await {
        Ok(allowed) => {
            if !allowed {
                return (StatusCode::FORBIDDEN, Json(json!({ "error": "Daily query limit reached (max 10 queries on Free Tier). Upgrade to Pro for unlimited access." }))).into_response();
            }
        }
        Err(e) => {
            return (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "error": format!("Database check failed: {}", e) }))).into_response();
        }
    }

    // 2. Embed user question
    let query_vector = match state.ai.generate_embedding(&payload.query).await {
        Ok(vec) => vec,
        Err(e) => {
            return (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "error": format!("Failed to embed query: {}", e) }))).into_response();
        }
    };

    // 3. Query Pinecone Vector Database
    let namespace = format!("user_{}", user_id);
    let pinecone_res = match state.vector.query(&namespace, query_vector, 5).await {
        Ok(res) => res,
        Err(e) => {
            return (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "error": format!("Pinecone vector query failed: {}", e) }))).into_response();
        }
    };

    // 4. Extract context excerpts and trace sources
    let mut context_chunks = Vec::new();
    let mut sources_set = HashSet::new();

    for match_item in pinecone_res.matches {
        if match_item.score < 0.35 {
            continue; // Filter out irrelevant vectors
        }
        if let Some(metadata) = match_item.metadata {
            let text = metadata.get("text").and_then(|v| v.as_str()).unwrap_or("");
            let file_name = metadata.get("file_name").and_then(|v| v.as_str()).unwrap_or("document.pdf");
            let page_num = metadata.get("page_num").and_then(|v| v.as_i64()).unwrap_or(1) as i32;

            if !text.is_empty() {
                context_chunks.push(format!(
                    "[Source Document: {}, Page {}]\nExcerpt:\n{}\n",
                    file_name, page_num, text
                ));
                sources_set.insert(SourceInfo {
                    doc: file_name.to_string(),
                    page: page_num,
                });
            }
        }
    }

    // 5. Construct context-augmented prompt
    let context_str = if context_chunks.is_empty() {
        "NO RELEVANT notes or context found.".to_string()
    } else {
        context_chunks.join("\n---\n")
    };

    let prompt = format!(
        "You are an engineering academic tutor. Solve the user's question using ONLY the provided notes and context.\n\
         If the answer requires math, show the step-by-step derivation.\n\
         Use markdown tables to present structured comparisons where appropriate.\n\
         If the context doesn't contain the answer, start your response with: \"I cannot find this in your uploaded notes. However, based on general engineering principles...\"\n\n\
         Context:\n{}\n\n\
         User Question:\n{}",
        context_str, payload.query
    );

    // 6. Generate Response from Gemini Flash
    let response_text = match state.ai.generate_content(&prompt, false).await {
        Ok(text) => text,
        Err(e) => {
            return (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "error": format!("Gemini Flash generation failed: {}", e) }))).into_response();
        }
    };

    // 7. Determine grounding status
    let grounded = !response_text.trim_start().starts_with("I cannot find this in your uploaded notes");
    let sources = if grounded {
        sources_set.into_iter().collect()
    } else {
        Vec::new() // No grounded sources if falling back
    };

    (StatusCode::OK, Json(QueryResponsePayload {
        text: response_text,
        grounded,
        sources,
    })).into_response()
}
