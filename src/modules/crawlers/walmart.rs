//! Walmart Crawler
//! Scrapes product data from Walmart.

use crate::modules::crawlers::CrawledProduct;

/// Builds a CrawledProduct with Walmart-specific defaults.
pub fn build_walmart_product(
    product_id: &str,
    title: &str,
    url: &str,
    price: Option<f64>,
) -> CrawledProduct {
    CrawledProduct {
        retailer: "walmart".to_string(),
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
    fn test_build_walmart_product() {
        let p = build_walmart_product("WM-123", "Walmart Item", "https://walmart.com/ip/WM-123", Some(15.99));
        assert_eq!(p.retailer, "walmart");
    }
}