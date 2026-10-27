use super::NationalityProvider;
use crate::models::{IdentityData, LocationData, NameData};
use rand::Rng;

pub struct VietnamProvider;

struct DistrictLocation {
    name: &'static str,
    wards: &'static [&'static str],
    streets: &'static [&'static str],
}

struct ProvinceLocation {
    code: &'static str,
    city: &'static str,
    zipcode: &'static str,
    districts: &'static [DistrictLocation],
}

static PROVINCES_VN: &[ProvinceLocation] = &[
    ProvinceLocation {
        code: "001",
        city: "Hà Nội",
        zipcode: "100000",
        districts: &[
            DistrictLocation {
                name: "Quận Hoàn Kiếm",
                wards: &[
                    "Phường Tràng Tiền",
                    "Phường Hàng Bạc",
                    "Phường Hàng Bài",
                    "Phường Lý Thái Tổ",
                ],
                streets: &[
                    "Phố Tràng Tiền",
                    "Phố Đinh Tiên Hoàng",
                    "Phố Hàng Khay",
                    "Phố Bà Triệu",
                    "Phố Lý Thường Kiệt",
                ],
            },
            DistrictLocation {
                name: "Quận Ba Đình",
                wards: &[
                    "Phường Điện Biên",
                    "Phường Kim Mã",
                    "Phường Liễu Giai",
                    "Phường Đội Cấn",
                ],
                streets: &[
                    "Đường Kim Mã",
                    "Đường Liễu Giai",
                    "Đường Đội Cấn",
                    "Đường Quán Thánh",
                    "Đường Phan Đình Phùng",
                ],
            },
            DistrictLocation {
                name: "Quận Cầu Giấy",
                wards: &[
                    "Phường Dịch Vọng Hậu",
                    "Phường Nghĩa Tân",
                    "Phường Mai Dịch",
                    "Phường Yên Hòa",
                ],
                streets: &[
                    "Đường Duy Tân",
                    "Đường Xuân Thủy",
                    "Đường Cầu Giấy",
                    "Đường Trần Thái Tông",
                    "Đường Hoàng Quốc Việt",
                ],
            },
            DistrictLocation {
                name: "Quận Đống Đa",
                wards: &[
                    "Phường Láng Hạ",
                    "Phường Ô Chợ Dừa",
                    "Phường Văn Miếu",
                    "Phường Khâm Thiên",
                ],
                streets: &[
                    "Đường Thái Hà",
                    "Đường Huỳnh Thúc Kháng",
                    "Đường Xã Đàn",
                    "Đường Chùa Bộc",
                    "Đường Tôn Đức Thắng",
                ],
            },
            DistrictLocation {
                name: "Quận Hai Bà Trưng",
                wards: &[
                    "Phường Bạch Mai",
                    "Phường Bách Khoa",
                    "Phường Minh Khai",
                    "Phường Lê Đại Hành",
                ],
                streets: &[
                    "Đường Phố Huế",
                    "Đường Đại Cồ Việt",
                    "Đường Bạch Mai",
                    "Đường Minh Khai",
                    "Đường Trần Khát Chân",
                ],
            },
        ],
    },
    ProvinceLocation {
        code: "079",
        city: "TP Hồ Chí Minh",
        zipcode: "700000",
        districts: &[
            DistrictLocation {
                name: "Quận 1",
                wards: &[
                    "Phường Bến Nghé",
                    "Phường Bến Thành",
                    "Phường Đa Kao",
                    "Phường Tân Định",
                ],
                streets: &[
                    "Đường Nguyễn Huệ",
                    "Đường Lê Lợi",
                    "Đường Đồng Khởi",
                    "Đường Pasteur",
                    "Đường Nam Kỳ Khởi Nghĩa",
                    "Đường Hai Bà Trưng",
                ],
            },
            DistrictLocation {
                name: "Quận 3",
                wards: &["Phường Võ Thị Sáu", "Phường 1", "Phường 4", "Phường 9"],
                streets: &[
                    "Đường Nguyễn Thị Minh Khai",
                    "Đường Điện Biên Phủ",
                    "Đường Cách Mạng Tháng 8",
                    "Đường Lý Chính Thắng",
                    "Đường Trương Định",
                ],
            },
            DistrictLocation {
                name: "Quận Bình Thạnh",
                wards: &["Phường 25", "Phường 26", "Phường 19", "Phường 15"],
                streets: &[
                    "Đường Điện Biên Phủ",
                    "Đường Xô Viết Nghệ Tĩnh",
                    "Đường Bạch Đằng",
                    "Đường Đinh Bộ Lĩnh",
                    "Đường Nơ Trang Long",
                ],
            },
            DistrictLocation {
                name: "Quận Tân Bình",
                wards: &["Phường 2", "Phường 12", "Phường 15", "Phường 4"],
                streets: &[
                    "Đường Cộng Hòa",
                    "Đường Trường Chinh",
                    "Đường Hoàng Văn Thụ",
                    "Đường Phổ Quang",
                    "Đường Lê Văn Sỹ",
                ],
            },
            DistrictLocation {
                name: "TP Thủ Đức",
                wards: &[
                    "Phường Thảo Điền",
                    "Phường An Phú",
                    "Phường Linh Trung",
                    "Phường Hiệp Phú",
                ],
                streets: &[
                    "Đường Võ Văn Ngân",
                    "Đường Đỗ Xuân Hợp",
                    "Đại lộ Mai Chí Thọ",
                    "Đường Song Hành",
                    "Đường Nguyễn Duy Trinh",
                ],
            },
        ],
    },
    ProvinceLocation {
        code: "048",
        city: "Đà Nẵng",
        zipcode: "550000",
        districts: &[
            DistrictLocation {
                name: "Quận Hải Châu",
                wards: &[
                    "Phường Hải Châu 1",
                    "Phường Thạch Thang",
                    "Phường Bình Hiên",
                    "Phường Hòa Cường Bắc",
                ],
                streets: &[
                    "Đường Bạch Đằng",
                    "Đường Trần Phú",
                    "Đường Nguyễn Văn Linh",
                    "Đường Lê Duẩn",
                ],
            },
            DistrictLocation {
                name: "Quận Sơn Trà",
                wards: &["Phường An Hải Bắc", "Phường Phước Mỹ", "Phường Mân Thái"],
                streets: &[
                    "Đường Võ Nguyên Giáp",
                    "Đường Phạm Văn Đồng",
                    "Đường Hoàng Sa",
                ],
            },
        ],
    },
    ProvinceLocation {
        code: "031",
        city: "Hải Phòng",
        zipcode: "180000",
        districts: &[DistrictLocation {
            name: "Quận Hồng Bàng",
            wards: &[
                "Phường Hoàng Văn Thụ",
                "Phường Minh Khai",
                "Phường Phan Bội Châu",
            ],
            streets: &[
                "Đường Đinh Tiên Hoàng",
                "Đường Quang Trung",
                "Đường Trần Phú",
            ],
        }],
    },
    ProvinceLocation {
        code: "092",
        city: "Cần Thơ",
        zipcode: "900000",
        districts: &[DistrictLocation {
            name: "Quận Ninh Kiều",
            wards: &["Phường Tân An", "Phường An Cư", "Phường Xuân Khánh"],
            streets: &[
                "Đường 30 Tháng 4",
                "Đường Đại lộ Hòa Bình",
                "Đường Nguyễn Trãi",
            ],
        }],
    },
    ProvinceLocation {
        code: "074",
        city: "Bình Dương",
        zipcode: "820000",
        districts: &[DistrictLocation {
            name: "TP Thủ Dầu Một",
            wards: &[
                "Phường Phú Cường",
                "Phường Hiệp Thành",
                "Phường Chánh Nghĩa",
            ],
            streets: &[
                "Đường Yersin",
                "Đường Cách Mạng Tháng 8",
                "Đường Thích Quảng Đức",
            ],
        }],
    },
    ProvinceLocation {
        code: "075",
        city: "Đồng Nai",
        zipcode: "810000",
        districts: &[DistrictLocation {
            name: "TP Biên Hòa",
            wards: &["Phường Tân Phong", "Phường Trảng Dài", "Phường Thống Nhất"],
            streets: &[
                "Đường Đồng Khởi",
                "Đường Phạm Văn Thuận",
                "Đường Nguyễn Ái Quốc",
            ],
        }],
    },
];

static WEIGHTED_SURNAMES_VN: &[(&str, u32)] = &[
    ("Nguyễn", 384),
    ("Trần", 110),
    ("Lê", 95),
    ("Phạm", 71),
    ("Hoàng", 30),
    ("Huỳnh", 21),
    ("Phan", 45),
    ("Vũ", 20),
    ("Võ", 19),
    ("Đặng", 21),
    ("Bùi", 20),
    ("Đỗ", 14),
    ("Hồ", 13),
    ("Ngô", 13),
    ("Dương", 10),
    ("Lý", 7),
    ("Đinh", 8),
    ("Đoàn", 7),
    ("Lâm", 7),
    ("Mai", 6),
    ("Trịnh", 6),
    ("Đào", 5),
    ("Cao", 5),
    ("Hà", 5),
    ("Lương", 5),
];

fn pick_weighted<'a>(rng: &mut dyn rand::RngCore, items: &'a [(&'a str, u32)]) -> &'a str {
    let total: u32 = items.iter().map(|(_, w)| *w).sum();
    let mut choice = rng.gen_range(0..total);
    for &(item, weight) in items {
        if choice < weight {
            return item;
        }
        choice -= weight;
    }
    items[0].0
}

impl NationalityProvider for VietnamProvider {
    fn nat_code(&self) -> &'static str {
        "VN"
    }

    fn country_name(&self) -> &'static str {
        "Vietnam"
    }

    fn generate_name(&self, is_male: bool, rng: &mut dyn rand::RngCore) -> NameData {
        let middle_names_male = [
            "Văn", "Hữu", "Đức", "Quang", "Minh", "Thanh", "Đình", "Ngọc", "Tuấn", "Hoàng", "Bảo",
            "Gia", "Thành", "Xuân", "Trọng", "Công", "Duy", "Anh", "Quốc", "Hải",
        ];
        let first_names_male = [
            "Minh", "Hoàng", "Duy", "Tuấn", "Nam", "Quân", "Long", "Đức", "Anh", "Hùng", "Bảo",
            "Huy", "Thắng", "Phong", "Khoa", "Kiên", "Dũng", "Khánh", "Trí", "Phúc", "Thịnh",
            "Bình", "Cường", "Tùng", "Sơn", "Lâm", "Hiếu", "Vinh", "Khôi", "Nhật",
        ];
        let middle_names_female = [
            "Thị", "Thu", "Phương", "Mai", "Ngọc", "Thanh", "Hồng", "Khánh", "Kim", "Bảo", "Ánh",
            "Quỳnh", "Thùy", "Mỹ", "Diệu", "Tuyết", "Hương", "Trúc", "Hoàng", "Như",
        ];
        let first_names_female = [
            "Linh", "Trang", "Hương", "Mai", "Lan", "Ngọc", "Hà", "Phương", "Thu", "Thảo", "Huyền",
            "Yến", "Anh", "Nhi", "Vy", "Hân", "Châu", "Trâm", "Ngân", "Dung", "Uyên", "Chi",
            "Quỳnh", "Mi", "Thư", "Tâm", "Loan", "Bích", "Ly", "Vân",
        ];

        let last = pick_weighted(rng, WEIGHTED_SURNAMES_VN);
        let (middle, first) = if is_male {
            (
                middle_names_male[rng.gen_range(0..middle_names_male.len())],
                first_names_male[rng.gen_range(0..first_names_male.len())],
            )
        } else {
            (
                middle_names_female[rng.gen_range(0..middle_names_female.len())],
                first_names_female[rng.gen_range(0..first_names_female.len())],
            )
        };

        let combined_first = format!("{} {}", middle, first);
        let display = format!("{} {}", last, combined_first);

        NameData {
            first: combined_first,
            last,
            display_name: display,
        }
    }

    fn generate_location(&self, rng: &mut dyn rand::RngCore) -> LocationData {
        let prov = &PROVINCES_VN[rng.gen_range(0..PROVINCES_VN.len())];
        let dist = &prov.districts[rng.gen_range(0..prov.districts.len())];
        let ward = dist.wards[rng.gen_range(0..dist.wards.len())];
        let street = dist.streets[rng.gen_range(0..dist.streets.len())];
        let st_num = rng.gen_range(1..999);

        LocationData {
            street_number: st_num,
            street_name: street.to_string(),
            ward: ward.to_string(),
            district: dist.name.to_string(),
            city: prov.city.to_string(),
            state: dist.name.to_string(),
            country: "Vietnam",
            postcode: prov.zipcode.to_string(),
            latitude_range: (10.0, 21.0),
            longitude_range: (105.0, 108.0),
        }
    }

    fn generate_id(
        &self,
        birth_year: u32,
        is_male: bool,
        rng: &mut dyn rand::RngCore,
    ) -> IdentityData {
        let prov = &PROVINCES_VN[rng.gen_range(0..PROVINCES_VN.len())];
        let century_gender_digit = match (birth_year, is_male) {
            (1900..=1999, true) => '0',
            (1900..=1999, false) => '1',
            (2000..=2099, true) => '2',
            (2000..=2099, false) => '3',
            (2100..=2199, true) => '4',
            (2100..=2199, false) => '5',
            _ => '0',
        };
        let year_suffix = format!("{:02}", birth_year % 100);
        let random_seq = format!("{:06}", rng.gen_range(100000..=999999));
        let cccd = format!(
            "{}{}{}{}",
            prov.code, century_gender_digit, year_suffix, random_seq
        );

        IdentityData {
            name: "CCCD",
            value: cccd,
        }
    }

    fn generate_phone(&self, rng: &mut dyn rand::RngCore) -> String {
        let telco_prefixes = [
            "098", "097", "096", "086", "032", "033", "034", "035", "036", "037", "038", "039",
            "091", "094", "088", "083", "084", "085", "081", "082", "090", "093", "089", "070",
            "079", "077", "076", "078",
        ];
        let p = telco_prefixes[rng.gen_range(0..telco_prefixes.len())];
        format!("{}{:07}", p, rng.gen_range(1000000..9999999))
    }

    fn generate_job(&self, rng: &mut dyn rand::RngCore) -> &'static str {
        let jobs = [
            "Kỹ sư Phần mềm (Senior)",
            "Lập trình viên Frontend",
            "Lập trình viên Backend",
            "Quản lý Dự án (PM)",
            "Chuyên viên Phân tích Nghiệp vụ (BA)",
            "Kỹ sư DevOps / Cloud",
            "Trưởng nhóm Kiểm thử (QA Lead)",
            "Thiết kế Giao diện (UI/UX Designer)",
            "Chuyên viên Dữ liệu (Data Analyst)",
            "Kế toán trưởng",
            "Chuyên viên Nhân sự (HR)",
            "Trưởng phòng Kinh doanh",
            "Kiến trúc sư Giải pháp (Solution Architect)",
            "Giám đốc Vận hành (COO)",
        ];
        jobs[rng.gen_range(0..jobs.len())]
    }

    fn timezone(&self) -> (&'static str, &'static str) {
        ("+07:00", "Bangkok, Hanoi, Jakarta")
    }
}
