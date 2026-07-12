mod config;
mod db;
mod ai;
mod vector;
mod ingest;
mod query;
mod tools;
mod payment;

use axum::{
    routing::post,
    Router,
    extract::FromRef,
};
use tower_http::cors::{Any, CorsLayer};
use std::net::SocketAddr;
use tokio::net::TcpListener;

use config::Config;
use db::DbClient;
use ai::GeminiClient;
use vector::PineconeClient;

// Global Shared App State
#[derive(Clone)]
pub struct AppState {
    pub db: DbClient,
    pub ai: GeminiClient,
    pub vector: PineconeClient,
    pub config: Config,
}

// Implement FromRef for decoupled route states
impl FromRef<AppState> for ingest::IngestState {
    fn from_ref(state: &AppState) -> Self {
        ingest::IngestState {
            db: state.db.clone(),
            ai: state.ai.clone(),
            vector: state.vector.clone(),
        }
    }
}

impl FromRef<AppState> for query::QueryState {
    fn from_ref(state: &AppState) -> Self {
        query::QueryState {
            db: state.db.clone(),
            ai: state.ai.clone(),
            vector: state.vector.clone(),
        }
    }
}

impl FromRef<AppState> for tools::ToolsState {
    fn from_ref(state: &AppState) -> Self {
        tools::ToolsState {
            ai: state.ai.clone(),
            vector: state.vector.clone(),
        }
    }
}

impl FromRef<AppState> for payment::PaymentState {
    fn from_ref(state: &AppState) -> Self {
        payment::PaymentState {
            db: state.db.clone(),
            config: state.config.clone(),
        }
    }
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // 1. Load configuration
    let config = Config::from_env();
    println!("Configuration loaded. Starting StudyTrace Backend on port {}...", config.port);

    // 2. Connect to Database (will also initialize tables if missing)
    println!("Connecting to database...");
    let db = DbClient::new(&config.database_url).await?;
    println!("Database connected and schemas verified successfully.");

    // 3. Initialize API Clients
    let ai = GeminiClient::new(config.gemini_api_key.clone());
    let vector = PineconeClient::new(config.pinecone_api_key.clone(), config.pinecone_host.clone());

    let state = AppState {
        db,
        ai,
        vector,
        config: config.clone(),
    };

    // 4. Configure CORS layer to support local frontend development
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    // 5. Build Router & bind endpoints
    let app = Router::new()
        .route("/api/ingest", post(ingest::ingest_handler))
        .route("/api/query", post(query::query_handler))
        .route("/api/quiz", post(tools::quiz_handler))
        .route("/api/flashcards", post(tools::flashcards_handler))
        .route("/api/webhook/razorpay", post(payment::razorpay_webhook_handler))
        .layer(cors)
        .with_state(state);

    // 6. Bind Listener and Start HTTP Server
    let addr = SocketAddr::from(([0, 0, 0, 0], config.port));
    println!("Listening on {}", addr);
    let listener = TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}
