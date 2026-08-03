use serde::{Deserialize, Serialize};

/// The Ingenuity Lens — 35,700+ product visual intelligence database
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NormalizedProduct {
    pub unified_id: String,
    pub retailer: String,
    pub retailer_product_id: String,
    pub product_url: String,
    pub title: String,
    pub price: Option<f64>,
    pub category: String,
    pub dimensions: Option<String>,
    pub weight: Option<f64>,
    pub color: Option<String>,
    pub features: Vec<String>,
    pub primary_image_url: String,
    pub primary_image_embedding: Vec<f32>,
    pub model_3d_url: Option<String>,
    pub specifications: serde_json::Value,
    pub difficulty: String,
    pub assembly_time: i32,
    pub two_person: bool,
    pub tools_required: Vec<String>,
    pub wall_mount: bool,
    pub search_text: String,
    pub last_synced_at: i64,
    pub live_score: LiveScore,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LiveScore {
    pub static_score: f32,
    pub social_velocity: f32,
    pub sentiment_score: f32,
    pub trend_trajectory: f32,
    pub competitive_gap: f32,
    pub composite: f32,
}
