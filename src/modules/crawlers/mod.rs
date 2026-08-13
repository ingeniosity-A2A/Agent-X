pub mod ikea;
pub mod amazon;
pub mod walmart;
pub mod wayfair;
pub mod target;

use serde::{Deserialize, Serialize};

/// Standard crawler output format
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CrawledProduct {
    pub retailer: String,
    pub product_id: String,
    pub url: String,
    pub title: String,
    pub price: Option<f64>,
    pub currency: String,
    pub image_url: String,
    pub dimensions: Option<ProductDimensions>,
    pub weight: Option<ProductWeight>,
    pub color: Option<String>,
    pub features: Vec<String>,
    pub specifications: serde_json::Value,
    pub assembly_data: Option<AssemblyData>,
    pub model_3d_url: Option<String>,
    pub scraped_at: String,
    pub schema_version: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProductDimensions {
    pub width: f64,
    pub height: f64,
    pub depth: f64,
    pub unit: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProductWeight {
    pub value: f64,
    pub unit: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AssemblyData {
    pub has_instructions: bool,
    pub estimated_time_min: Option<u32>,
    pub difficulty: String,
    pub tools_required: Vec<String>,
    pub parts_count: Option<u32>,
    pub two_person: bool,
    pub wall_mount: bool,
}
