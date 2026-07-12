use std::env;

#[derive(Clone, Debug)]
pub struct Config {
    pub database_url: String,
    pub gemini_api_key: String,
    pub pinecone_api_key: String,
    pub pinecone_host: String,
    pub razorpay_webhook_secret: Option<String>,
    pub port: u16,
}

impl Config {
    pub fn from_env() -> Self {
        // Load .env file if it exists
        let _ = dotenvy::dotenv();

        let database_url = env::var("DATABASE_URL")
            .unwrap_or_else(|_| "postgresql://postgres:password@localhost:5432/postgres".to_string());
        let gemini_api_key = env::var("GEMINI_API_KEY")
            .unwrap_or_else(|_| "dummy_gemini_key_for_testing".to_string());
        let pinecone_api_key = env::var("PINECONE_API_KEY")
            .unwrap_or_else(|_| "dummy_pinecone_key_for_testing".to_string());
        let pinecone_host = env::var("PINECONE_HOST")
            .unwrap_or_else(|_| "https://dummy-index.svc.us-east-1.pinecone.io".to_string());
        let razorpay_webhook_secret = env::var("RAZORPAY_WEBHOOK_SECRET").ok();
        
        let port = env::var("PORT")
            .ok()
            .and_then(|p| p.parse::<u16>().ok())
            .unwrap_or(8080);

        Config {
            database_url,
            gemini_api_key,
            pinecone_api_key,
            pinecone_host: pinecone_host.trim_end_matches('/').to_string(),
            razorpay_webhook_secret,
            port,
        }
    }
}
