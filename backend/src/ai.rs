use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::error::Error;

#[derive(Clone)]
pub struct GeminiClient {
    client: Client,
    api_key: String,
}

#[derive(Serialize)]
struct EmbeddingRequest {
    model: String,
    content: EmbeddingContent,
    #[serde(rename = "outputDimensionality")]
    output_dimensionality: i32,
}

#[derive(Serialize)]
struct EmbeddingContent {
    parts: Vec<EmbeddingPart>,
}

#[derive(Serialize)]
struct EmbeddingPart {
    text: String,
}

#[derive(Deserialize)]
struct EmbeddingResponse {
    embedding: EmbeddingValues,
}

#[derive(Deserialize)]
struct EmbeddingValues {
    values: Vec<f32>,
}

// Generate Content structs
#[derive(Serialize)]
struct GenerateRequest {
    contents: Vec<GenerateContent>,
    #[serde(rename = "generationConfig", skip_serializing_if = "Option::is_none")]
    generation_config: Option<GenerationConfig>,
}

#[derive(Serialize)]
struct GenerateContent {
    parts: Vec<GeneratePart>,
}

#[derive(Serialize)]
struct GeneratePart {
    text: String,
}

#[derive(Serialize)]
struct GenerationConfig {
    #[serde(rename = "responseMimeType", skip_serializing_if = "Option::is_none")]
    response_mime_type: Option<String>,
}

#[derive(Deserialize)]
struct GenerateResponse {
    candidates: Option<Vec<Candidate>>,
}

#[derive(Deserialize)]
struct Candidate {
    content: Option<CandidateContent>,
}

#[derive(Deserialize)]
struct CandidateContent {
    parts: Option<Vec<CandidatePart>>,
}

#[derive(Deserialize)]
struct CandidatePart {
    text: Option<String>,
}

impl GeminiClient {
    pub fn new(api_key: String) -> Self {
        GeminiClient {
            client: Client::new(),
            api_key,
        }
    }

    pub async fn generate_embedding(&self, text: &str) -> Result<Vec<f32>, Box<dyn Error + Send + Sync>> {
        let url = format!(
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-2:embedContent?key={}",
            self.api_key
        );

        let req_body = EmbeddingRequest {
            model: "models/gemini-embedding-2".to_string(),
            content: EmbeddingContent {
                parts: vec![EmbeddingPart {
                    text: text.to_string(),
                }],
            },
            output_dimensionality: 768,
        };

        let response = self.client.post(&url)
            .json(&req_body)
            .send()
            .await?;

        if !response.status().is_success() {
            let err_text = response.text().await?;
            return Err(format!("Gemini Embedding API error: {}", err_text).into());
        }

        let resp_body: EmbeddingResponse = response.json().await?;
        Ok(resp_body.embedding.values)
    }

    pub async fn generate_content(
        &self,
        prompt: &str,
        json_output: bool,
    ) -> Result<String, Box<dyn Error + Send + Sync>> {
        let url = format!(
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key={}",
            self.api_key
        );

        let generation_config = if json_output {
            Some(GenerationConfig {
                response_mime_type: Some("application/json".to_string()),
            })
        } else {
            None
        };

        let req_body = GenerateRequest {
            contents: vec![GenerateContent {
                parts: vec![GeneratePart {
                    text: prompt.to_string(),
                }],
            }],
            generation_config,
        };

        let response = self.client.post(&url)
            .json(&req_body)
            .send()
            .await?;

        if !response.status().is_success() {
            let err_text = response.text().await?;
            return Err(format!("Gemini Generate API error: {}", err_text).into());
        }

        let resp_body: GenerateResponse = response.json().await?;
        let text = resp_body
            .candidates
            .and_then(|c| c.into_iter().next())
            .and_then(|c| c.content)
            .and_then(|c| c.parts)
            .and_then(|p| p.into_iter().next())
            .and_then(|p| p.text)
            .ok_or_else(|| "Failed to extract text from Gemini response")?;

        Ok(text)
    }
}
