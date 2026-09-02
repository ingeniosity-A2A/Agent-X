//! Agent-X public mesh/capability boundary.
//! No cognitive state or reasoning trace is transported here.

use serde::{Deserialize, Serialize};

pub const INTERFACE_VERSION: &str = "0.1.0";

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct CapabilityCall {
    pub interface_version: String,
    pub intent_id: String,
    pub capability: String,
    pub skill_id: Option<String>,
    pub skill_version: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Observation {
    pub interface_version: String,
    pub intent_id: String,
    pub capability: String,
    pub status: String,
    pub result_ref: Option<String>,
    pub artifact_ref: Option<String>,
}
