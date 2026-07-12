use sqlx::{PgPool, Row};
use uuid::Uuid;
use chrono::{DateTime, Utc};

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
        let pool = PgPool::connect(database_url).await?;
        
        // Ensure tables exist
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

        // Pro users have unlimited queries. Free users are limited to 10.
        if stats.tier == "free" && current_count >= 10 {
            return Ok(false); // Gated!
        }

        // Increment count and update DB
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
        // Start transaction
        let mut tx = self.pool.begin().await?;

        // 1. Insert file record
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

        // 2. Increment total_uploaded_files count
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
