use axum::{
    extract::State,
    http::StatusCode,
    response::IntoResponse,
    Json,
};
use serde::{Deserialize, Serialize};
use serde_json::json;
use uuid::Uuid;

use crate::ai::GeminiClient;
use crate::vector::PineconeClient;

#[derive(Clone)]
pub struct ToolsState {
    pub ai: GeminiClient,
    pub vector: PineconeClient,
}

#[derive(Deserialize)]
pub struct ToolRequestPayload {
    pub user_id: String,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct QuizPayload {
    pub question: String,
    pub options: Vec<String>,
    pub correct: usize, // 0-indexed correct option
}

#[derive(Serialize, Deserialize, Debug)]
pub struct FlashcardPayload {
    pub front: String,
    pub back: String,
}

pub async fn quiz_handler(
    State(state): State<ToolsState>,
    Json(payload): Json<ToolRequestPayload>,
) -> impl IntoResponse {
    let user_id = match Uuid::parse_str(&payload.user_id) {
        Ok(uuid) => uuid,
        Err(_) => return (StatusCode::BAD_REQUEST, Json(json!({ "error": "Invalid user_id UUID format" }))).into_response(),
    };

    // 1. Generate a seed embedding for "core concepts, definitions, formulas, and main topics"
    let seed_text = "core concepts, definitions, formulas, and sessional exam questions";
    let query_vector = match state.ai.generate_embedding(seed_text).await {
        Ok(vec) => vec,
        Err(e) => return (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "error": format!("Failed to generate seed embedding: {}", e) }))).into_response(),
    };

    // 2. Retrieve representative chunks from Pinecone
    let namespace = format!("user_{}", user_id);
    let pinecone_res = match state.vector.query(&namespace, query_vector, 8).await {
        Ok(res) => res,
        Err(e) => return (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "error": format!("Pinecone vector query failed: {}", e) }))).into_response(),
    };

    let mut context_chunks = Vec::new();
    for m in pinecone_res.matches {
        if let Some(metadata) = m.metadata {
            if let Some(text) = metadata.get("text").and_then(|v| v.as_str()) {
                context_chunks.push(text.to_string());
            }
        }
    }

    if context_chunks.is_empty() {
        return (StatusCode::NOT_FOUND, Json(json!({ "error": "No notes found. Please upload notes before generating a quiz." }))).into_response();
    }

    let context_str = context_chunks.join("\n---\n");

    // 3. Prompt Gemini to output JSON Quiz
    let prompt = format!(
        "You are an engineering professor. Based ONLY on the following lecture notes context, create one multiple-choice sessional exam question.\n\
         Generate exactly 4 options. Make the questions testing and realistic.\n\
         Output MUST be a valid JSON object matching this schema:\n\
         {{\n\
           \"question\": \"Question text here\",\n\
           \"options\": [\"Option A\", \"Option B\", \"Option C\", \"Option D\"],\n\
           \"correct\": 0\n\
         }}\n\
         The \"correct\" field must be a 0-indexed integer referencing the correct index in \"options\" array.\n\n\
         Context:\n{}\n",
        context_str
    );

    match state.ai.generate_content(&prompt, true).await {
        Ok(json_str) => {
            // Validate JSON
            match serde_json::from_str::<QuizPayload>(&json_str) {
                Ok(quiz) => (StatusCode::OK, Json(quiz)).into_response(),
                Err(err) => (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "error": format!("AI generated invalid quiz JSON: {}", err), "raw": json_str }))).into_response(),
            }
        }
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "error": format!("Failed to generate quiz content: {}", e) }))).into_response(),
    }
}

pub async fn flashcards_handler(
    State(state): State<ToolsState>,
    Json(payload): Json<ToolRequestPayload>,
) -> impl IntoResponse {
    let user_id = match Uuid::parse_str(&payload.user_id) {
        Ok(uuid) => uuid,
        Err(_) => return (StatusCode::BAD_REQUEST, Json(json!({ "error": "Invalid user_id UUID format" }))).into_response(),
    };

    // 1. Generate seed embedding
    let seed_text = "important terms, key formulas, core theorems, definitions";
    let query_vector = match state.ai.generate_embedding(seed_text).await {
        Ok(vec) => vec,
        Err(e) => return (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "error": format!("Failed to generate seed embedding: {}", e) }))).into_response(),
    };

    // 2. Query Pinecone
    let namespace = format!("user_{}", user_id);
    let pinecone_res = match state.vector.query(&namespace, query_vector, 8).await {
        Ok(res) => res,
        Err(e) => return (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "error": format!("Pinecone vector query failed: {}", e) }))).into_response(),
    };

    let mut context_chunks = Vec::new();
    for m in pinecone_res.matches {
        if let Some(metadata) = m.metadata {
            if let Some(text) = metadata.get("text").and_then(|v| v.as_str()) {
                context_chunks.push(text.to_string());
            }
        }
    }

    if context_chunks.is_empty() {
        return (StatusCode::NOT_FOUND, Json(json!({ "error": "No notes found. Please upload notes before generating flashcards." }))).into_response();
    }

    let context_str = context_chunks.join("\n---\n");

    // 3. Prompt Gemini to output JSON list of flashcards
    let prompt = format!(
        "You are an academic study assistant. Extract key definitions and core concepts from the notes context below to create a set of exactly 5 flashcards.\n\
         Keep fronts concise (terms/questions) and backs clear and informative (definitions/explanations).\n\
         Output MUST be a valid JSON array of objects matching this schema:\n\
         [\n\
           {{ \"front\": \"Term or Equation\", \"back\": \"Definition or derivation step\" }}\n\
         ]\n\n\
         Context:\n{}\n",
        context_str
    );

    match state.ai.generate_content(&prompt, true).await {
        Ok(json_str) => {
            // Validate JSON
            match serde_json::from_str::<Vec<FlashcardPayload>>(&json_str) {
                Ok(cards) => (StatusCode::OK, Json(cards)).into_response(),
                Err(err) => (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "error": format!("AI generated invalid flashcards JSON: {}", err), "raw": json_str }))).into_response(),
            }
        }
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "error": format!("Failed to generate flashcard content: {}", e) }))).into_response(),
    }
}
