use axum::{
    extract::{Multipart, State},
    http::StatusCode,
    response::IntoResponse,
    Json,
};
use serde_json::json;
use std::fs::File;
use std::io::Write;
use uuid::Uuid;

use crate::ai::GeminiClient;
use crate::db::DbClient;
use crate::vector::PineconeClient;

#[derive(Clone)]
pub struct IngestState {
    pub db: DbClient,
    pub ai: GeminiClient,
    pub vector: PineconeClient,
}

pub async fn ingest_handler(
    State(state): State<IngestState>,
    mut multipart: Multipart,
) -> impl IntoResponse {
    let mut user_id_str = None;
    let mut file_data = None;
    let mut file_name = "document.pdf".to_string();

    // Parse multipart fields
    while let Ok(Some(field)) = multipart.next_field().await {
        let name = field.name().unwrap_or("").to_string();
        if name == "user_id" {
            if let Ok(value) = field.text().await {
                user_id_str = Some(value);
            }
        } else if name == "file" {
            file_name = field.file_name().unwrap_or("document.pdf").to_string();
            if let Ok(bytes) = field.bytes().await {
                file_data = Some(bytes.to_vec());
            }
        }
    }

    // Validate inputs
    let user_id_str = match user_id_str {
        Some(uid) => uid,
        None => return (StatusCode::BAD_REQUEST, Json(json!({ "error": "Missing user_id field" }))).into_response(),
    };

    let user_id = match Uuid::parse_str(&user_id_str) {
        Ok(uuid) => uuid,
        Err(_) => return (StatusCode::BAD_REQUEST, Json(json!({ "error": "Invalid user_id UUID format" }))).into_response(),
    };

    let file_bytes = match file_data {
        Some(bytes) => bytes,
        None => return (StatusCode::BAD_REQUEST, Json(json!({ "error": "Missing file field" }))).into_response(),
    };

    let file_size = file_bytes.len() as i32;

    // 1. Check upload limit
    match state.db.check_upload_limit(user_id).await {
        Ok(allowed) => {
            if !allowed {
                return (StatusCode::FORBIDDEN, Json(json!({ "error": "Upload limit reached on Free Tier (max 3 files)" }))).into_response();
            }
        }
        Err(e) => {
            return (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "error": format!("Database check failed: {}", e) }))).into_response();
        }
    }

    // 2. Save file temporarily in workspace CWD
    let temp_filename = format!("./temp_upload_{}.pdf", Uuid::new_v4());
    let mut temp_file = match File::create(&temp_filename) {
        Ok(f) => f,
        Err(e) => return (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "error": format!("Failed to create temporary file: {}", e) }))).into_response(),
    };

    if let Err(e) = temp_file.write_all(&file_bytes) {
        let _ = std::fs::remove_file(&temp_filename);
        return (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "error": format!("Failed to write temporary file: {}", e) }))).into_response();
    }

    // 3. Extract text from PDF
    let extracted_text = match pdf_extract::extract_text(&temp_filename) {
        Ok(text) => text,
        Err(e) => {
            let _ = std::fs::remove_file(&temp_filename);
            return (StatusCode::BAD_REQUEST, Json(json!({ "error": format!("Failed to parse PDF text: {}", e) }))).into_response();
        }
    };

    // Clean up temporary file
    let _ = std::fs::remove_file(&temp_filename);

    // 4. Split text into chunks page-by-page (using Form-Feed '\x0c' as page break)
    let pages: Vec<&str> = extracted_text.split('\x0c').collect();
    let mut vectors_to_upsert = Vec::new();

    let chunk_size = 1000;
    let overlap = 200;

    for (page_idx, page_text) in pages.iter().enumerate() {
        let page_num = (page_idx + 1) as i32;
        let chunks = chunk_text(page_text, chunk_size, overlap);

        for (chunk_idx, chunk) in chunks.into_iter().enumerate() {
            if chunk.trim().is_empty() {
                continue;
            }

            // Generate unique chunk ID
            let chunk_id = format!("{}_p{}_c{}", user_id, page_num, chunk_idx);

            // Generate Embedding using Gemini
            let embedding = match state.ai.generate_embedding(&chunk).await {
                Ok(vec) => vec,
                Err(e) => {
                    return (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "error": format!("Gemini Embedding generation failed: {}", e) }))).into_response();
                }
            };

            vectors_to_upsert.push((chunk_id, embedding, chunk, file_name.clone(), page_num));
        }
    }

    if vectors_to_upsert.is_empty() {
        return (StatusCode::BAD_REQUEST, Json(json!({ "error": "No indexable text found in PDF" }))).into_response();
    }

    // 5. Upsert vectors to Pinecone under user-specific namespace
    let namespace = format!("user_{}", user_id);
    if let Err(e) = state.vector.upsert_chunks(&namespace, vectors_to_upsert).await {
        return (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "error": format!("Pinecone indexing failed: {}", e) }))).into_response();
    }

    // 6. Record document in database
    if let Err(e) = state.db.record_document_upload(user_id, &file_name, file_size, &namespace).await {
        return (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "error": format!("Failed to save upload log in database: {}", e) }))).into_response();
    }

    // Return success
    (StatusCode::OK, Json(json!({
        "message": "File indexed successfully",
        "file_name": file_name,
        "file_size_bytes": file_size,
        "pinecone_namespace": namespace
    }))).into_response()
}

// Character-based sliding window chunker
fn chunk_text(text: &str, chunk_size: usize, overlap: usize) -> Vec<String> {
    let mut chunks = Vec::new();
    let chars: Vec<char> = text.chars().collect();
    let mut start = 0;

    if chars.len() <= chunk_size {
        return vec![text.to_string()];
    }

    while start < chars.len() {
        let end = std::cmp::min(start + chunk_size, chars.len());
        let chunk: String = chars[start..end].iter().collect();
        chunks.push(chunk);

        if end == chars.len() {
            break;
        }

        // Shift start forward by (chunk_size - overlap)
        if chunk_size > overlap {
            start = start + chunk_size - overlap;
        } else {
            start = end; // Fallback to avoid infinite loops
        }
    }
    chunks
}
