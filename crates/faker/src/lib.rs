pub mod config;
pub mod constants;
pub mod generator;
pub mod models;
pub mod providers;

pub use config::FakerConfig;
pub use generator::{
    generate_id_only, generate_local_users, generate_local_users as generate_users, to_ascii_slug,
};
pub use providers::{
    get_provider, list_nationality_metadata, supported_nationalities, NationalityMetadata,
    NationalityProvider,
};
use serde_json::Value;

/// Convert a slice of JSON user values into formatted RFC-compliant CSV content.
pub fn to_csv(users: &[Value]) -> String {
    let mut csv_rows = vec![
        "STT,Full Name,First Name,Last Name,Gender,Date of Birth,Age,CCCD / ID,Email,Username,Password,Phone,Street Address,Ward,District,City,Postcode,Country,Job,Avatar File,Avatar URL".to_string()
    ];

    let escape = |s: &str| format!("\"{}\"", s.replace('"', "\"\""));

    for (i, u) in users.iter().enumerate() {
        let username = u["login"]["username"].as_str().unwrap_or("user");
        let img_url = u["picture"]["large"].as_str().unwrap_or("");
        let is_svg = img_url.contains(".svg") || img_url.contains("dicebear");
        let ext = if is_svg { "svg" } else { "jpg" };
        let filename = format!("{}.{}", username, ext);

        let first_name = u["name"]["first"].as_str().unwrap_or("");
        let last_name = u["name"]["last"].as_str().unwrap_or("");
        let full_name = format!("{} {}", first_name, last_name);
        let gender = u["gender"].as_str().unwrap_or("");
        let dob_raw = u["dob"]["date"].as_str().unwrap_or("");
        let dob = if dob_raw.len() >= 10 {
            &dob_raw[..10]
        } else {
            dob_raw
        };
        let age = u["dob"]["age"].to_string();
        let id_val = u["id"]["value"].as_str().unwrap_or("");
        let email = u["email"].as_str().unwrap_or("");
        let password = u["login"]["password"].as_str().unwrap_or("");
        let phone = u["phone"].as_str().unwrap_or("");
        let street_num = u["location"]["street"]["number"].to_string();
        let street_name = u["location"]["street"]["name"].as_str().unwrap_or("");
        let street_addr = format!("{} {}", street_num, street_name).trim().to_string();
        let ward = u["location"]["ward"].as_str().unwrap_or("");
        let district = u["location"]["district"].as_str().unwrap_or("");
        let city = u["location"]["city"].as_str().unwrap_or("");
        let postcode = u["location"]["postcode"].as_str().unwrap_or("");
        let country = u["location"]["country"].as_str().unwrap_or("");
        let job = u["job"].as_str().unwrap_or("");
        let avatar_file = format!("./avatars/{}", filename);
        let avatar_url = img_url;

        csv_rows.push(format!(
            "{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{}",
            i + 1,
            escape(&full_name),
            escape(first_name),
            escape(last_name),
            escape(gender),
            escape(dob),
            escape(&age),
            escape(id_val),
            escape(email),
            escape(username),
            escape(password),
            escape(phone),
            escape(&street_addr),
            escape(ward),
            escape(district),
            escape(city),
            escape(postcode),
            escape(country),
            escape(job),
            escape(&avatar_file),
            escape(avatar_url)
        ));
    }

    csv_rows.join("\r\n")
}

/// Convert a slice of JSON user values into formatted JSON string.
pub fn to_json(users: &[Value], pretty: bool) -> Result<String, serde_json::Error> {
    if pretty {
        serde_json::to_string_pretty(users)
    } else {
        serde_json::to_string(users)
    }
}

/// Convert any serializable value into formatted JSON string.
pub fn to_json_value<T: serde::Serialize>(
    value: &T,
    pretty: bool,
) -> Result<String, serde_json::Error> {
    if pretty {
        serde_json::to_string_pretty(value)
    } else {
        serde_json::to_string(value)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_generate_users() {
        let res = generate_users(5, Some("male"), Some("VN"), None, None);
        let results = res["results"].as_array().expect("results is array");
        assert_eq!(results.len(), 5);
        let csv = to_csv(results);
        assert!(csv.contains("Full Name"));
    }

    #[test]
    fn test_list_nationalities() {
        let nats = list_nationality_metadata();
        assert_eq!(nats.len(), 3);
        assert!(nats.iter().any(|n| n.code == "US" && n.id_type == "SSN"));
        assert!(nats.iter().any(|n| n.code == "VN" && n.id_type == "CCCD"));
        assert!(nats
            .iter()
            .any(|n| n.code == "JP" && n.id_type == "My Number"));
    }
}
