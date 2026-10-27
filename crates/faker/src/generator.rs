use crate::providers::{get_provider, NationalityProvider};
use rand::Rng;
use serde_json::{json, Value};
use uuid::Uuid;

pub fn to_ascii_slug(s: &str) -> String {
    let mut out = String::with_capacity(s.len());
    for c in s.chars() {
        for lc in c.to_lowercase() {
            let r = match lc {
                'a' | 'à' | 'á' | 'ả' | 'ã' | 'ạ' | 'ă' | 'ằ' | 'ắ' | 'ẳ' | 'ẵ' | 'ặ' | 'â'
                | 'ầ' | 'ấ' | 'ẩ' | 'ẫ' | 'ậ' => 'a',
                'd' | 'đ' => 'd',
                'e' | 'è' | 'é' | 'ẻ' | 'ẽ' | 'ẹ' | 'ê' | 'ề' | 'ế' | 'ể' | 'ễ' | 'ệ' => {
                    'e'
                }
                'i' | 'ì' | 'í' | 'ỉ' | 'ĩ' | 'ị' => 'i',
                'o' | 'ò' | 'ó' | 'ỏ' | 'õ' | 'ọ' | 'ô' | 'ồ' | 'ố' | 'ổ' | 'ỗ' | 'ộ' | 'ơ'
                | 'ờ' | 'ớ' | 'ở' | 'ỡ' | 'ợ' => 'o',
                'u' | 'ù' | 'ú' | 'ủ' | 'ũ' | 'ụ' | 'ư' | 'ừ' | 'ứ' | 'ử' | 'ữ' | 'ự' => {
                    'u'
                }
                'y' | 'ỳ' | 'ý' | 'ỷ' | 'ỹ' | 'ỵ' => 'y',
                o if o.is_ascii_alphanumeric() => o,
                _ => '_',
            };
            if r != '_' || (!out.is_empty() && !out.ends_with('_')) {
                out.push(r);
            }
        }
    }
    out.trim_matches('_').to_string()
}

pub fn generate_secure_password(rng: &mut impl rand::Rng) -> String {
    let prefixes = [
        "VnPro", "Shield", "Secure", "Titan", "Falcon", "Nova", "Prime", "Turbo", "Apex", "Matrix",
        "Cyber",
    ];
    let specials = ['@', '#', '$', '!', '&', '*'];
    let suffixes = ["acc", "pro", "app", "hub", "net", "top", "run", "key"];

    let prefix = prefixes[rng.gen_range(0..prefixes.len())];
    let s1 = specials[rng.gen_range(0..specials.len())];
    let s2 = specials[rng.gen_range(0..specials.len())];
    let num: u32 = rng.gen_range(1000..9999);
    let suffix = suffixes[rng.gen_range(0..suffixes.len())];

    format!("{}{}{}{}{}", prefix, s1, num, s2, suffix)
}

pub fn generate_local_users(
    count: u32,
    gender_filter: Option<&str>,
    nat_filter: Option<&str>,
    avatar_style: Option<&str>,
    domain_override: Option<&str>,
) -> Value {
    let mut rng = rand::thread_rng();
    let config = crate::config::FakerConfig::load();
    let nat_choice = nat_filter.unwrap_or(&config.default_nat);
    let avatar_choice = avatar_style.unwrap_or(&config.default_avatar);
    let is_svg = avatar_choice == "svg";

    let mut results = Vec::with_capacity(count as usize);

    for _ in 0..count {
        // Resolve provider per iteration if nat_choice == "ALL", otherwise use requested nationality
        let provider: Box<dyn NationalityProvider> = if nat_choice.eq_ignore_ascii_case("all") {
            let options = crate::constants::ALL_NATIONALITIES;
            get_provider(options[rng.gen_range(0..options.len())])
        } else {
            get_provider(nat_choice)
        };

        let is_male = match gender_filter {
            Some("male") => true,
            Some("female") => false,
            _ => rng.gen_bool(0.5),
        };

        let gender_str = if is_male { "male" } else { "female" };
        let title_str = if is_male {
            "Mr"
        } else {
            if rng.gen_bool(0.6) {
                "Ms"
            } else {
                "Mrs"
            }
        };

        // Realistic working age bracket
        let age =
            rng.gen_range(crate::constants::PERSONA_MIN_AGE..=crate::constants::PERSONA_MAX_AGE);
        let birth_year = 2026 - age;
        let birth_month = rng.gen_range(1..=12);
        let birth_day = rng.gen_range(1..=28);
        let dob_str = format!(
            "{:04}-{:02}-{:02}T08:00:00.000Z",
            birth_year, birth_month, birth_day
        );

        let rng_core = &mut rng as &mut dyn rand::RngCore;
        let name_data = provider.generate_name(is_male, rng_core);
        let loc_data = provider.generate_location(rng_core);
        let id_data = provider.generate_id(birth_year, is_male, rng_core);
        let phone = provider.generate_phone(rng_core);
        let job = provider.generate_job(rng_core);
        let (tz_offset, tz_desc) = provider.timezone();

        // Strict RFC 5322 ASCII Email & Username sanitization
        let clean_first = to_ascii_slug(&name_data.first).replace('_', "");
        let clean_last = to_ascii_slug(name_data.last).replace('_', "");
        let random_suffix = rng.gen_range(10..999);
        let username = format!("{}_{}{}", clean_last, clean_first, random_suffix);

        let chosen_domain = config.pick_domain(&mut rng, domain_override);
        let email = match config.email_pattern.as_str() {
            "last.first" => format!(
                "{}.{}{}@{}",
                clean_last, clean_first, random_suffix, chosen_domain
            ),
            "first" => format!(
                "{}{}{}@{}",
                clean_first,
                clean_last.chars().next().unwrap_or('n'),
                random_suffix,
                chosen_domain
            ),
            "username" => format!("{}@{}", username, chosen_domain),
            _ => format!(
                "{}.{}{}@{}",
                clean_first, clean_last, random_suffix, chosen_domain
            ),
        };

        // Strong password
        let password = generate_secure_password(&mut rng);
        let user_uuid = Uuid::new_v4().to_string();

        // Avatar URLs
        let (avatar_large, avatar_medium, avatar_thumb) = if is_svg {
            let avatar_seed = format!("{}-{}", username, user_uuid);
            let url = format!(
                "{}?seed={}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf",
                crate::constants::URL_DICEBEAR_AVATAR,
                avatar_seed
            );
            (url.clone(), url.clone(), url)
        } else {
            let photo_id = rng.gen_range(0..100);
            let gender_dir = if is_male { "men" } else { "women" };
            (
                format!(
                    "{}/{}/{}.jpg",
                    crate::constants::URL_RANDOMUSER_PORTRAITS,
                    gender_dir,
                    photo_id
                ),
                format!(
                    "{}/med/{}/{}.jpg",
                    crate::constants::URL_RANDOMUSER_PORTRAITS,
                    gender_dir,
                    photo_id
                ),
                format!(
                    "{}/thumb/{}/{}.jpg",
                    crate::constants::URL_RANDOMUSER_PORTRAITS,
                    gender_dir,
                    photo_id
                ),
            )
        };

        // Embedded Inline SVG Data URI (Works 100% offline)
        let initials = format!(
            "{}{}",
            name_data.last.chars().next().unwrap_or('T'),
            name_data
                .first
                .split_whitespace()
                .last()
                .and_then(|s| s.chars().next())
                .unwrap_or('U')
        );
        let bg_color = match rng.gen_range(0..6) {
            0 => "#0284c7", // Sky
            1 => "#4f46e5", // Indigo
            2 => "#059669", // Emerald
            3 => "#d97706", // Amber
            4 => "#7c3aed", // Violet
            _ => "#e11d48", // Rose
        };
        let inline_svg = format!(
            "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120'><rect width='120' height='120' rx='28' fill='{}'/><text x='60' y='72' font-family='Arial, sans-serif' font-size='42' font-weight='bold' fill='#ffffff' text-anchor='middle' dominant-baseline='middle'>{}</text></svg>",
            bg_color, initials
        );
        let inline_svg_data_uri = format!("data:image/svg+xml;utf8,{}", inline_svg);

        let user = json!({
            "gender": gender_str,
            "name": {
                "title": title_str,
                "first": name_data.first,
                "last": name_data.last
            },
            "job": job,
            "location": {
                "street": {
                    "number": loc_data.street_number,
                    "name": loc_data.street_name
                },
                "ward": loc_data.ward,
                "district": loc_data.district,
                "city": loc_data.city,
                "state": loc_data.state,
                "country": loc_data.country,
                "postcode": loc_data.postcode,
                "coordinates": {
                    "latitude": format!("{:.4}", rng.gen_range(loc_data.latitude_range.0..loc_data.latitude_range.1)),
                    "longitude": format!("{:.4}", rng.gen_range(loc_data.longitude_range.0..loc_data.longitude_range.1))
                },
                "timezone": {
                    "offset": tz_offset,
                    "description": tz_desc
                }
            },
            "email": email,
            "login": {
                "uuid": user_uuid,
                "username": username,
                "password": password,
                "salt": format!("{:08x}", rng.gen::<u32>()),
                "md5": format!("{:032x}", rng.gen::<u128>()),
                "sha1": format!("{:040x}", rng.gen::<u128>()),
                "sha256": format!("{:064x}", rng.gen::<u128>())
            },
            "dob": {
                "date": dob_str,
                "age": age
            },
            "registered": {
                "date": "2023-01-15T00:00:00.000Z",
                "age": 3
            },
            "phone": phone.clone(),
            "cell": phone,
            "id": {
                "name": id_data.name,
                "value": id_data.value
            },
            "picture": {
                "large": avatar_large,
                "medium": avatar_medium,
                "thumbnail": avatar_thumb,
                "data_uri": inline_svg_data_uri
            },
            "nat": provider.nat_code()
        });

        results.push(user);
    }

    json!({
        "results": results,
        "info": {
            "seed": "rust-deterministic-suite",
            "results": count,
            "page": 1,
            "version": "2.0.0"
        }
    })
}

pub fn generate_id_only(nat_filter: Option<&str>) -> Value {
    let mut rng = rand::thread_rng();
    let config = crate::config::FakerConfig::load();
    let nat_choice = nat_filter.unwrap_or(&config.default_nat);

    let provider: Box<dyn NationalityProvider> = if nat_choice.eq_ignore_ascii_case("all") {
        let options = crate::constants::ALL_NATIONALITIES;
        get_provider(options[rng.gen_range(0..options.len())])
    } else {
        get_provider(nat_choice)
    };

    let age = rng.gen_range(crate::constants::PERSONA_MIN_AGE..=crate::constants::PERSONA_MAX_AGE);
    let birth_year = 2026 - age;
    let is_male = rng.gen_bool(0.5);

    let rng_core = &mut rng as &mut dyn rand::RngCore;
    let id_data = provider.generate_id(birth_year, is_male, rng_core);

    json!({
        "nat": provider.nat_code(),
        "type": id_data.name,
        "value": id_data.value,
        "valid": true
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_generate_id_only() {
        let id_us = generate_id_only(Some("US"));
        assert_eq!(id_us["nat"], "US");
        assert_eq!(id_us["type"], "SSN");
        assert!(id_us["value"].as_str().unwrap().contains('-'));

        let id_vn = generate_id_only(Some("VN"));
        assert_eq!(id_vn["nat"], "VN");
        assert_eq!(id_vn["type"], "CCCD");
        assert_eq!(id_vn["value"].as_str().unwrap().len(), 12);

        let id_jp = generate_id_only(Some("JP"));
        assert_eq!(id_jp["nat"], "JP");
        assert_eq!(id_jp["type"], "My Number");
        assert_eq!(id_jp["value"].as_str().unwrap().len(), 12);
    }

    #[test]
    fn test_generate_default_count() {
        let data = generate_local_users(10, None, None, None, None);
        let list = data["results"].as_array().unwrap();
        assert_eq!(list.len(), 10);
        for u in list {
            let email = u["email"].as_str().unwrap();
            assert!(email.is_ascii(), "Email must be strictly ASCII: {}", email);
            assert!(
                !email.contains(' '),
                "Email must not have spaces: {}",
                email
            );
            let img = u["picture"]["large"].as_str().unwrap();
            assert!(img.contains("portraits"));
        }
    }

    #[test]
    fn test_generate_female_us() {
        let data = generate_local_users(5, Some("female"), Some("US"), Some("svg"), None);
        let list = data["results"].as_array().unwrap();
        assert_eq!(list.len(), 5);
        for u in list {
            assert_eq!(u["gender"], "female");
            assert_eq!(u["nat"], "US");
            assert_eq!(u["id"]["name"], "SSN");
            assert!(u["email"].as_str().unwrap().is_ascii());
            assert!(u["picture"]["large"]
                .as_str()
                .unwrap()
                .contains("dicebear.com"));
        }
    }

    #[test]
    fn test_generate_japan() {
        let data = generate_local_users(5, Some("male"), Some("JP"), None, None);
        let list = data["results"].as_array().unwrap();
        assert_eq!(list.len(), 5);
        for u in list {
            assert_eq!(u["gender"], "male");
            assert_eq!(u["nat"], "JP");
            assert_eq!(u["id"]["name"], "My Number");
            let my_number = u["id"]["value"].as_str().unwrap();
            assert_eq!(my_number.len(), 12);
            assert!(u["phone"].as_str().unwrap().starts_with("+81"));
            assert!(u["email"].as_str().unwrap().is_ascii());
        }
    }

    #[test]
    fn test_generate_custom_domain() {
        let data = generate_local_users(3, None, None, None, Some("@flowup.io.vn"));
        let list = data["results"].as_array().unwrap();
        assert_eq!(list.len(), 3);
        for u in list {
            let email = u["email"].as_str().unwrap();
            assert!(
                email.ends_with("@flowup.io.vn"),
                "Email should end with @flowup.io.vn: {}",
                email
            );
        }
    }

    #[test]
    fn test_to_ascii_slug_vietnamese_full_accents() {
        assert_eq!(to_ascii_slug("Đặng Văn Lâm"), "dang_van_lam");
        assert_eq!(to_ascii_slug("Hoàng Đức Trần"), "hoang_duc_tran");
        assert_eq!(to_ascii_slug("Nguyễn Thị Bình"), "nguyen_thi_binh");
        assert_eq!(to_ascii_slug("LÊ ĐẠI HÀNH"), "le_dai_hanh");
        assert_eq!(
            to_ascii_slug("đường Cách Mạng Tháng 8"),
            "duong_cach_mang_thang_8"
        );
    }

    #[test]
    fn test_generate_vietnamese_users_compliance() {
        let data = generate_local_users(20, Some("male"), Some("VN"), Some("real"), None);
        let list = data["results"].as_array().unwrap();
        assert_eq!(list.len(), 20);
        for u in list {
            assert_eq!(u["gender"], "male");
            assert_eq!(u["nat"], "VN");
            assert!(u["job"].is_string());
            assert_eq!(u["id"]["name"], "CCCD");

            let cccd = u["id"]["value"].as_str().unwrap();
            assert_eq!(cccd.len(), 12, "CCCD must be exactly 12 digits");
            assert!(
                cccd.chars().all(|c| c.is_ascii_digit()),
                "CCCD must be numeric"
            );

            // Verify century and gender digit in CCCD
            let age = u["dob"]["age"].as_u64().unwrap() as u32;
            let birth_year = 2026 - age;
            let expected_gender_digit = if birth_year < 2000 { '0' } else { '2' };
            assert_eq!(cccd.chars().nth(3).unwrap(), expected_gender_digit);

            // Verify 2-digit birth year matches CCCD
            let expected_year_suffix = format!("{:02}", birth_year % 100);
            assert_eq!(&cccd[4..6], &expected_year_suffix);

            // Verify Email is strictly ASCII
            let email = u["email"].as_str().unwrap();
            assert!(
                email.is_ascii(),
                "Vietnamese email must be strictly ASCII: {}",
                email
            );

            // Verify Password has strong complexity
            let password = u["login"]["password"].as_str().unwrap();
            assert!(password.len() >= 10, "Secure password must be >= 10 chars");
            assert!(
                password.chars().any(|c| c.is_ascii_uppercase()),
                "Password must have uppercase"
            );
            assert!(
                password.chars().any(|c| c.is_ascii_lowercase()),
                "Password must have lowercase"
            );
            assert!(
                password.chars().any(|c| c.is_ascii_digit()),
                "Password must have digits"
            );
            assert!(
                password.chars().any(|c| "@#$!&*".contains(c)),
                "Password must have special symbol"
            );

            // Verify Phone has 10 digits
            let phone = u["phone"].as_str().unwrap();
            assert_eq!(phone.len(), 10, "VN phone must have 10 digits");

            // Verify Ward and District are populated
            let ward = u["location"]["ward"].as_str().unwrap();
            let district = u["location"]["district"].as_str().unwrap();
            assert!(!ward.is_empty(), "Ward must not be empty");
            assert!(!district.is_empty(), "District must not be empty");
        }
    }
}
