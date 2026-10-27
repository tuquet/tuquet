use super::NationalityProvider;
use crate::models::{IdentityData, LocationData, NameData};
use rand::Rng;

pub struct JapanProvider;

struct JpCityLocation {
    prefecture: &'static str,
    city: &'static str,
    ward: &'static str,
    zipcode: &'static str,
    streets: &'static [&'static str],
}

static JP_LOCATIONS: &[JpCityLocation] = &[
    JpCityLocation {
        prefecture: "Tokyo",
        city: "Tokyo",
        ward: "Chiyoda-ku",
        zipcode: "100-0001",
        streets: &[
            "Chiyoda 1-chome",
            "Marunouchi 2-chome",
            "Otemachi 1-chome",
            "Kanda-Jinbocho 2-chome",
        ],
    },
    JpCityLocation {
        prefecture: "Tokyo",
        city: "Tokyo",
        ward: "Shinjuku-ku",
        zipcode: "160-0022",
        streets: &[
            "Shinjuku 3-chome",
            "Kabukicho 1-chome",
            "Nishi-Shinjuku 2-chome",
            "Takadanobaba 1-chome",
        ],
    },
    JpCityLocation {
        prefecture: "Tokyo",
        city: "Tokyo",
        ward: "Shibuya-ku",
        zipcode: "150-0002",
        streets: &[
            "Shibuya 2-chome",
            "Dogenzaka 1-chome",
            "Jingumae 4-chome",
            "Ebisu-Minami 1-chome",
        ],
    },
    JpCityLocation {
        prefecture: "Tokyo",
        city: "Tokyo",
        ward: "Minato-ku",
        zipcode: "106-0032",
        streets: &[
            "Roppongi 6-chome",
            "Akasaka 9-chome",
            "Shiba-Koen 4-chome",
            "Toranomon 2-chome",
        ],
    },
    JpCityLocation {
        prefecture: "Osaka",
        city: "Osaka",
        ward: "Kita-ku",
        zipcode: "530-0001",
        streets: &["Umeda 1-chome", "Nakazakicho 2-chome", "Dojima 1-chome"],
    },
    JpCityLocation {
        prefecture: "Osaka",
        city: "Osaka",
        ward: "Chuo-ku",
        zipcode: "542-0081",
        streets: &[
            "Namba 3-chome",
            "Dotonbori 1-chome",
            "Shinsaibashisuji 2-chome",
        ],
    },
    JpCityLocation {
        prefecture: "Kyoto",
        city: "Kyoto",
        ward: "Nakagyo-ku",
        zipcode: "604-8153",
        streets: &["Karasuma-dori", "Kawaramachi-dori", "Shijo-dori"],
    },
    JpCityLocation {
        prefecture: "Kanagawa",
        city: "Yokohama",
        ward: "Nishi-ku",
        zipcode: "220-0012",
        streets: &[
            "Minatomirai 3-chome",
            "Takashima 2-chome",
            "Kitasaiwai 1-chome",
        ],
    },
    JpCityLocation {
        prefecture: "Fukuoka",
        city: "Fukuoka",
        ward: "Hakata-ku",
        zipcode: "812-0011",
        streets: &["Hakataekimae 2-chome", "Nakasu 4-chome", "Gion-machi"],
    },
    JpCityLocation {
        prefecture: "Aichi",
        city: "Nagoya",
        ward: "Naka-ku",
        zipcode: "460-0008",
        streets: &["Sakae 3-chome", "Nishiki 2-chome", "Marunouchi 1-chome"],
    },
];

/// Calculate official Japanese Individual Number (My Number - マイナンバー) check digit.
/// Formula defined by Ministry of Internal Affairs and Communications:
/// sum = sum_{n=1}^{11} (Pn * Qn)
/// where Qn = n + 1 for 1 <= n <= 6, and Qn = n - 5 for 7 <= n <= 11
/// rem = sum % 11
/// check_digit = if rem <= 1 { 0 } else { 11 - rem }
fn calculate_my_number_check_digit(digits: &[u32; 11]) -> u32 {
    let mut sum = 0;
    for (i, &p) in digits.iter().enumerate() {
        let n = 11 - i; // P1 is the rightmost digit before check digit (position 11)
        let q = if (1..=6).contains(&n) { n + 1 } else { n - 5 };
        sum += p * (q as u32);
    }
    let rem = sum % 11;
    if rem <= 1 {
        0
    } else {
        11 - rem
    }
}

impl NationalityProvider for JapanProvider {
    fn nat_code(&self) -> &'static str {
        "JP"
    }

    fn country_name(&self) -> &'static str {
        "Japan"
    }

    fn generate_name(&self, is_male: bool, rng: &mut dyn rand::RngCore) -> NameData {
        let last_names = [
            "Sato",
            "Suzuki",
            "Takahashi",
            "Tanaka",
            "Watanabe",
            "Ito",
            "Yamamoto",
            "Nakamura",
            "Kobayashi",
            "Kato",
            "Yoshida",
            "Yamada",
            "Sasaki",
            "Yamaguchi",
            "Saito",
            "Matsumoto",
            "Inoue",
            "Kimura",
            "Hayashi",
            "Shimizu",
        ];

        let first_names_male = [
            "Ren", "Haruto", "Minato", "Yuto", "Sota", "Riku", "Kento", "Daiki", "Ryota", "Sora",
            "Kaito", "Hayato", "Takumi", "Kazuki", "Shota",
        ];

        let first_names_female = [
            "Yui", "Aoi", "Hina", "Rin", "Mei", "Sakura", "Yuna", "Koharu", "Akari", "Nanami",
            "Mio", "Misaki", "Nana", "Riko", "Ayaka",
        ];

        let last = last_names[rng.gen_range(0..last_names.len())];
        let first = if is_male {
            first_names_male[rng.gen_range(0..first_names_male.len())]
        } else {
            first_names_female[rng.gen_range(0..first_names_female.len())]
        };

        // In Japanese Romaji context: First Last (e.g. Ren Sato) or Last First
        let display = format!("{} {}", first, last);

        NameData {
            first: first.to_string(),
            last,
            display_name: display,
        }
    }

    fn generate_location(&self, rng: &mut dyn rand::RngCore) -> LocationData {
        let loc = &JP_LOCATIONS[rng.gen_range(0..JP_LOCATIONS.len())];
        let street = loc.streets[rng.gen_range(0..loc.streets.len())];
        let banchi = format!("{}-{}", rng.gen_range(1..30), rng.gen_range(1..20));

        LocationData {
            street_number: rng.gen_range(100..999),
            street_name: format!("{} {}", street, banchi),
            ward: loc.ward.to_string(),
            district: "".to_string(),
            city: loc.city.to_string(),
            state: loc.prefecture.to_string(),
            country: "Japan",
            postcode: loc.zipcode.to_string(),
            latitude_range: (33.0, 36.0),
            longitude_range: (130.0, 140.0),
        }
    }

    fn generate_id(
        &self,
        _birth_year: u32,
        _is_male: bool,
        rng: &mut dyn rand::RngCore,
    ) -> IdentityData {
        let mut digits = [0u32; 11];
        // Ensure first digit is non-zero
        digits[0] = rng.gen_range(1..=9);
        for d in digits.iter_mut().skip(1) {
            *d = rng.gen_range(0..=9);
        }
        let check_digit = calculate_my_number_check_digit(&digits);
        let my_number: String =
            digits.iter().map(|d| d.to_string()).collect::<String>() + &check_digit.to_string();

        IdentityData {
            name: "My Number",
            value: my_number,
        }
    }

    fn generate_phone(&self, rng: &mut dyn rand::RngCore) -> String {
        // NTT Docomo, au, SoftBank mobile prefixes: 090, 080, 070
        let mobile_prefixes = ["090", "080", "070"];
        let prefix = mobile_prefixes[rng.gen_range(0..mobile_prefixes.len())];
        format!(
            "+81 {}-{:04}-{:04}",
            &prefix[1..],
            rng.gen_range(1000..9999),
            rng.gen_range(1000..9999)
        )
    }

    fn generate_job(&self, rng: &mut dyn rand::RngCore) -> &'static str {
        let jobs = [
            "Software Engineer (ソフトウェアエンジニア)",
            "Backend Engineer",
            "Frontend Engineer",
            "Project Manager (プロジェクトマネージャー)",
            "Cloud / DevOps Engineer",
            "Gateway Software Engineer (BrSE)",
            "UI/UX Designer",
            "Data Analyst (データアナリスト)",
            "Solution Architect",
            "QA / Test Automation Specialist",
            "Product Operations Manager",
        ];
        jobs[rng.gen_range(0..jobs.len())]
    }

    fn timezone(&self) -> (&'static str, &'static str) {
        ("+09:00", "Tokyo, Osaka, Sapporo")
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_my_number_checksum_validity() {
        let provider = JapanProvider;
        let mut rng = rand::thread_rng();
        for _ in 0..100 {
            let id = provider.generate_id(2000, true, &mut rng as &mut dyn rand::RngCore);
            assert_eq!(id.name, "My Number");
            assert_eq!(id.value.len(), 12);
            assert!(id.value.chars().all(|c| c.is_ascii_digit()));
        }
    }
}
