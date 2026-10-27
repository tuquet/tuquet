#[derive(Debug, Clone)]
pub struct NameData {
    pub first: String,
    pub last: &'static str,
    pub display_name: String,
}

#[derive(Debug, Clone)]
pub struct LocationData {
    pub street_number: u32,
    pub street_name: String,
    pub ward: String,
    pub district: String,
    pub city: String,
    pub state: String,
    pub country: &'static str,
    pub postcode: String,
    pub latitude_range: (f64, f64),
    pub longitude_range: (f64, f64),
}

#[derive(Debug, Clone)]
pub struct IdentityData {
    pub name: &'static str,
    pub value: String,
}
