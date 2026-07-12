use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::error::Error;

#[derive(Clone)]
pub struct PineconeClient {
    client: Client,
    api_key: String,
    host: String,
}

#[derive(Serialize)]
struct UpsertRequest {
    vectors: Vec<PineconeVector>,
    namespace: String,
}

#[derive(Serialize)]
struct PineconeVector {
    id: String,
    values: Vec<f32>,
    metadata: HashMap<String, serde_json::Value>,
}

#[derive(Serialize)]
struct QueryRequest {
    vector: Vec<f32>,
    #[serde(rename = "topK")]
    top_k: u32,
    #[serde(rename = "includeMetadata")]
    include_metadata: bool,
    namespace: String,
}

#[derive(Deserialize, Debug)]
pub struct QueryResponse {
    pub matches: Vec<PineconeMatch>,
}

#[derive(Deserialize, Debug, Clone)]
pub struct PineconeMatch {
    pub id: String,
    pub score: f32,
    pub metadata: Option<HashMap<String, serde_json::Value>>,
}

impl PineconeClient {
    pub fn new(api_key: String, host: String) -> Self {
        PineconeClient {
            client: Client::new(),
            api_key,
            host,
        }
    }

    pub async fn upsert_chunks(
        &self,
        namespace: &str,
        vectors_data: Vec<(String, Vec<f32>, String, String, i32)>, // (chunk_id, values, text, file_name, page_num)
    ) -> Result<(), Box<dyn Error + Send + Sync>> {
        let url = format!("{}/vectors/upsert", self.host);

        let vectors = vectors_data
            .into_iter()
            .map(|(id, values, text, file_name, page_num)| {
                let mut metadata = HashMap::new();
                metadata.insert("text".to_string(), serde_json::Value::String(text));
                metadata.insert("file_name".to_string(), serde_json::Value::String(file_name));
                metadata.insert("page_num".to_string(), serde_json::Value::Number(page_num.into()));

                PineconeVector { id, values, metadata }
            })
            .collect();

        let req_body = UpsertRequest {
            vectors,
            namespace: namespace.to_string(),
        };

        let response = self.client.post(&url)
            .header("Api-Key", &self.api_key)
            .json(&req_body)
            .send()
            .await?;

        if !response.status().is_success() {
            let err_text = response.text().await?;
            return Err(format!("Pinecone Upsert API error: {}", err_text).into());
        }

        Ok(())
    }

    pub async fn query(
        &self,
        namespace: &str,
        vector: Vec<f32>,
        top_k: u32,
    ) -> Result<QueryResponse, Box<dyn Error + Send + Sync>> {
        let url = format!("{}/query", self.host);

        let req_body = QueryRequest {
            vector,
            top_k,
            include_metadata: true,
            namespace: namespace.to_string(),
        };

        let response = self.client.post(&url)
            .header("Api-Key", &self.api_key)
            .json(&req_body)
            .send()
            .await?;

        if !response.status().is_success() {
            let err_text = response.text().await?;
            return Err(format!("Pinecone Query API error: {}", err_text).into());
        }

        let resp_body: QueryResponse = response.json().await?;
        Ok(resp_body)
    }
}
