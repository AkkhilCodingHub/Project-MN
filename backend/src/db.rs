use sqlx::{PgPool, Row, postgres::PgPoolOptions};
use std::time::Duration;
use uuid::Uuid;
use chrono::{DateTime, Utc};
use axum::{http::StatusCode, response::IntoResponse, Json};

#[derive(Debug, Clone)]
pub struct UserStats {
    pub user_id: Uuid,
    pub tier: String,
    pub daily_queries_count: i32,
    pub total_uploaded_files: i32,
    pub last_reset_date: DateTime<Utc>,
}

#[derive(Clone)]
pub struct DbClient {
    pub pool: PgPool,
}

impl DbClient {
    pub async fn new(database_url: &str) -> Result<Self, sqlx::Error> {
        let max_connections = std::env::var("DATABASE_MAX_CONNECTIONS")
            .ok()
            .and_then(|val| val.parse::<u32>().ok())
            .unwrap_or(5);
        let min_connections = std::env::var("DATABASE_MIN_CONNECTIONS")
            .ok()
            .and_then(|val| val.parse::<u32>().ok())
            .unwrap_or(1);

        if min_connections > max_connections {
            return Err(sqlx::Error::Configuration(
                format!(
                    "DATABASE_MIN_CONNECTIONS ({}) cannot be greater than DATABASE_MAX_CONNECTIONS ({})",
                    min_connections, max_connections
                )
                .into(),
            ));
        }

        let pool = PgPoolOptions::new()
            .max_connections(max_connections)
            .min_connections(min_connections)
            .acquire_timeout(Duration::from_secs(3))
            .idle_timeout(Duration::from_secs(30))
            .connect(database_url)
            .await?;
        
        sqlx::query(
            "CREATE TABLE IF NOT EXISTS user_study_stats (
                user_id UUID PRIMARY KEY,
                tier TEXT NOT NULL DEFAULT 'free',
                daily_queries_count INT NOT NULL DEFAULT 0,
                total_uploaded_files INT NOT NULL DEFAULT 0,
                last_reset_date TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );"
        )
        .execute(&pool)
        .await?;

        sqlx::query(
            "CREATE TABLE IF NOT EXISTS uploaded_documents (
                id UUID PRIMARY KEY,
                user_id UUID NOT NULL,
                file_name TEXT NOT NULL,
                file_size INT NOT NULL,
                pinecone_namespace TEXT NOT NULL,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );"
        )
        .execute(&pool)
        .await?;

        Ok(DbClient { pool })
    }

    pub async fn get_or_create_user_stats(&self, user_id: Uuid) -> Result<UserStats, sqlx::Error> {
        let row = sqlx::query(
            "INSERT INTO user_study_stats (user_id, tier, daily_queries_count, total_uploaded_files, last_reset_date)
             VALUES ($1, 'free', 0, 0, NOW())
             ON CONFLICT (user_id) DO UPDATE SET user_id = EXCLUDED.user_id
             RETURNING user_id, tier, daily_queries_count, total_uploaded_files, last_reset_date"
        )
        .bind(user_id)
        .fetch_one(&self.pool)
        .await?;

        Ok(UserStats {
            user_id: row.try_get("user_id")?,
            tier: row.try_get("tier")?,
            daily_queries_count: row.try_get("daily_queries_count")?,
            total_uploaded_files: row.try_get("total_uploaded_files")?,
            last_reset_date: row.try_get("last_reset_date")?,
        })
    }

    pub async fn check_and_increment_query_limit(&self, user_id: Uuid) -> Result<bool, sqlx::Error> {
        let stats = self.get_or_create_user_stats(user_id).await?;
        let now = Utc::now();
        
        let should_reset = now.signed_duration_since(stats.last_reset_date).num_hours() >= 24;
        let current_count = if should_reset { 0 } else { stats.daily_queries_count };

        if stats.tier == "free" && current_count >= 10 {
            return Ok(false); // Gated!
        }

        let reset_sql = if should_reset {
            "UPDATE user_study_stats SET daily_queries_count = 1, last_reset_date = NOW() WHERE user_id = $1"
        } else {
            "UPDATE user_study_stats SET daily_queries_count = daily_queries_count + 1 WHERE user_id = $1"
        };

        sqlx::query(reset_sql)
            .bind(user_id)
            .execute(&self.pool)
            .await?;

        Ok(true)
    }

    pub async fn check_upload_limit(&self, user_id: Uuid) -> Result<bool, sqlx::Error> {
        let stats = self.get_or_create_user_stats(user_id).await?;
        if stats.tier == "free" && stats.total_uploaded_files >= 3 {
            return Ok(false); // Gated!
        }
        Ok(true)
    }

    pub async fn record_document_upload(
        &self,
        user_id: Uuid,
        file_name: &str,
        file_size: i32,
        namespace: &str,
    ) -> Result<(), sqlx::Error> {
        let mut tx = self.pool.begin().await?;

        // Check if this document has already been recorded (idempotency check)
        let existing = sqlx::query("SELECT 1 FROM uploaded_documents WHERE user_id = $1 AND file_name = $2")
            .bind(user_id)
            .bind(file_name)
            .fetch_optional(&mut *tx)
            .await?;

        if existing.is_some() {
            tx.commit().await?;
            return Ok(());
        }

        let doc_id = Uuid::new_v4();
        sqlx::query(
            "INSERT INTO uploaded_documents (id, user_id, file_name, file_size, pinecone_namespace, created_at)
             VALUES ($1, $2, $3, $4, $5, NOW())"
        )
        .bind(doc_id)
        .bind(user_id)
        .bind(file_name)
        .bind(file_size)
        .bind(namespace)
        .execute(&mut *tx)
        .await?;

        sqlx::query(
            "UPDATE user_study_stats SET total_uploaded_files = total_uploaded_files + 1 WHERE user_id = $1"
        )
        .bind(user_id)
        .execute(&mut *tx)
        .await?;

        tx.commit().await?;
        Ok(())
    }

    pub async fn upgrade_user_tier(&self, user_id: Uuid, tier: &str) -> Result<(), sqlx::Error> {
        sqlx::query(
            "UPDATE user_study_stats SET tier = $2 WHERE user_id = $1"
        )
        .bind(user_id)
        .bind(tier)
        .execute(&self.pool)
        .await?;
        Ok(())
    }
}

pub fn map_db_error(e: sqlx::Error) -> axum::response::Response {
    match e {
        sqlx::Error::PoolTimedOut => (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(serde_json::json!({ "error": "Database connection pool timeout. Service is temporarily overloaded. Please try again." })),
        )
            .into_response(),
        _ => {
            eprintln!("Database error: {:?}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(serde_json::json!({ "error": "Internal database error occurred. Please try again later." })),
            )
                .into_response()
        }
    }
}
