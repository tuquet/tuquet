use crate::models::{IdentityData, LocationData, NameData};

pub mod japan;
pub mod usa;
pub mod vietnam;

pub trait NationalityProvider: Send + Sync {
    /// Two-letter ISO / Alpha-2 nationality code (e.g. "VN", "US", "JP")
    fn nat_code(&self) -> &'static str;

    /// Official country name in English
    fn country_name(&self) -> &'static str;

    /// Generate authentic full name and parts
    fn generate_name(&self, is_male: bool, rng: &mut dyn rand::RngCore) -> NameData;

    /// Generate authentic hierarchical address
    fn generate_location(&self, rng: &mut dyn rand::RngCore) -> LocationData;

    /// Generate government-compliant National ID (CCCD, SSN, My Number, etc.)
    fn generate_id(
        &self,
        birth_year: u32,
        is_male: bool,
        rng: &mut dyn rand::RngCore,
    ) -> IdentityData;

    /// Generate realistic telecom phone number
    fn generate_phone(&self, rng: &mut dyn rand::RngCore) -> String;

    /// Generate typical professional job title
    fn generate_job(&self, rng: &mut dyn rand::RngCore) -> &'static str;

    /// Return timezone offset and description (e.g. ("+07:00", "Bangkok, Hanoi, Jakarta"))
    fn timezone(&self) -> (&'static str, &'static str);
}

pub fn get_provider(nat_code: &str) -> Box<dyn NationalityProvider> {
    let clean = nat_code.trim().to_uppercase();
    match clean.as_str() {
        "JP" | "JAPAN" => Box::new(japan::JapanProvider),
        "US" | "USA" | "EN" => Box::new(usa::UsaProvider),
        _ => Box::new(vietnam::VietnamProvider),
    }
}

pub fn supported_nationalities() -> &'static [&'static str] {
    &["VN", "US", "JP"]
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct NationalityMetadata {
    pub code: &'static str,
    pub country: &'static str,
    pub id_type: &'static str,
    pub phone_prefix: &'static str,
    pub timezone: &'static str,
    pub address_hierarchy: &'static str,
}

pub fn list_nationality_metadata() -> Vec<NationalityMetadata> {
    vec![
        NationalityMetadata {
            code: "US",
            country: "United States",
            id_type: "SSN",
            phone_prefix: "+1",
            timezone: "-05:00",
            address_hierarchy: "Street, City, State, ZIP",
        },
        NationalityMetadata {
            code: "VN",
            country: "Vietnam",
            id_type: "CCCD",
            phone_prefix: "+84",
            timezone: "+07:00",
            address_hierarchy: "Street, Ward, District, City",
        },
        NationalityMetadata {
            code: "JP",
            country: "Japan",
            id_type: "My Number",
            phone_prefix: "+81",
            timezone: "+09:00",
            address_hierarchy: "Block, Ward, City, Prefecture, Postal Code",
        },
    ]
}
