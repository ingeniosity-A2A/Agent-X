//! IKEA Crawler
//! Scrapes product data from IKEA's catalog.

use crate::modules::crawlers::CrawledProduct;

/// Builds a CrawledProduct with IKEA-specific defaults.
pub fn build_ikea_product(
    product_id: &str,
    title: &str,
    url: &str,
    price: Option<f64>,
) -> CrawledProduct {
    CrawledProduct {
        retailer: "ikea".to_string(),
        product_id: product_id.to_string(),
        url: url.to_string(),
        title: title.to_string(),
        price,
        currency: "USD".to_string(),
        image_url: String::new(),
        dimensions: None,
        weight: None,
        color: None,
        features: Vec::new(),
        specifications: serde_json::json!({}),
        assembly_data: Some(crate::modules::crawlers::AssemblyData {
            has_instructions: true,
            estimated_time_min: Some(30),
            difficulty: "moderate".to_string(),
            tools_required: vec!["screwdriver".to_string(), "allen_key".to_string()],
            parts_count: None,
            two_person: false,
            wall_mount: false,
        }),
        model_3d_url: None,
        scraped_at: chrono::Utc::now().to_rfc3339(),
        schema_version: 1,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_build_ikea_product() {
        let p = build_ikea_product("12345", "Billy Bookcase", "https://ikea.com/billy", Some(59.99));
        assert_eq!(p.retailer, "ikea");
        assert_eq!(p.product_id, "12345");
        assert!(p.assembly_data.is_some());
    }
}