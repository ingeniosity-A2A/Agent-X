//! Wayfair Crawler
//! Scrapes product data from Wayfair.

use crate::modules::crawlers::CrawledProduct;

/// Builds a CrawledProduct with Wayfair-specific defaults.
pub fn build_wayfair_product(
    product_id: &str,
    title: &str,
    url: &str,
    price: Option<f64>,
) -> CrawledProduct {
    CrawledProduct {
        retailer: "wayfair".to_string(),
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
        assembly_data: None,
        model_3d_url: None,
        scraped_at: chrono::Utc::now().to_rfc3339(),
        schema_version: 1,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_build_wayfair_product() {
        let p = build_wayfair_product("WF-999", "Wayfair Sofa", "https://wayfair.com/WF-999", Some(499.0));
        assert_eq!(p.retailer, "wayfair");
    }
}
