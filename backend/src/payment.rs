use axum::{
    body::Bytes,
    extract::State,
    http::{HeaderMap, StatusCode},
    response::IntoResponse,
};
use hmac::{Hmac, Mac};
use sha2::Sha256;
use serde_json::Value;
use uuid::Uuid;

use crate::db::DbClient;
use crate::config::Config;

type HmacSha256 = Hmac<Sha256>;

#[derive(Clone)]
pub struct PaymentState {
    pub db: DbClient,
    pub config: Config,
}

pub async fn razorpay_webhook_handler(
    State(state): State<PaymentState>,
    headers: HeaderMap,
    body_bytes: Bytes,
) -> impl IntoResponse {
    // 1. Get X-Razorpay-Signature header
    let signature = match headers.get("X-Razorpay-Signature").and_then(|v| v.to_str().ok()) {
        Some(sig) => sig,
        None => return StatusCode::BAD_REQUEST.into_response(),
    };

    // 2. Verify signature if webhook secret is configured
    if let Some(secret) = &state.config.razorpay_webhook_secret {
        let mut mac = match HmacSha256::new_from_slice(secret.as_bytes()) {
            Ok(m) => m,
            Err(_) => return StatusCode::INTERNAL_SERVER_ERROR.into_response(),
        };
        mac.update(&body_bytes);
        let result = mac.finalize();
        let computed_sig = hex::encode(result.into_bytes());

        if computed_sig != signature {
            return StatusCode::UNAUTHORIZED.into_response();
        }
    }

    // 3. Parse body as JSON
    let json_body: Value = match serde_json::from_slice(&body_bytes) {
        Ok(json) => json,
        Err(_) => return StatusCode::BAD_REQUEST.into_response(),
    };

    // 4. Extract event type and user_id from notes
    let event = json_body.get("event").and_then(|v| v.as_str()).unwrap_or("");
    
    // We look for user_id inside payload.payment.entity.notes.user_id 
    // or payload.subscription.entity.notes.user_id
    let user_id_opt = json_body
        .pointer("/payload/payment/entity/notes/user_id")
        .or_else(|| json_body.pointer("/payload/subscription/entity/notes/user_id"))
        .and_then(|v| v.as_str());

    if let Some(uid_str) = user_id_opt {
        if let Ok(user_id) = Uuid::parse_str(uid_str) {
            match event {
                "payment.captured" | "subscription.charged" | "order.paid" => {
                    if let Err(e) = state.db.upgrade_user_tier(user_id, "pro").await {
                        eprintln!("Failed to upgrade user {} to pro: {}", user_id, e);
                        return StatusCode::INTERNAL_SERVER_ERROR.into_response();
                    }
                    println!("Successfully upgraded user {} to Pro tier.", user_id);
                }
                _ => {
                    println!("Unhandled Razorpay webhook event: {}", event);
                }
            }
        }
    }

    StatusCode::OK.into_response()
}
