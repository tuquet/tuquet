use super::NationalityProvider;
use crate::models::{IdentityData, LocationData, NameData};
use rand::Rng;

pub struct UsaProvider;

struct UsStateLocation {
    state: &'static str,
    city: &'static str,
    zipcode: &'static str,
    streets: &'static [&'static str],
}

static US_LOCATIONS: &[UsStateLocation] = &[
    UsStateLocation {
        state: "California",
        city: "Los Angeles",
        zipcode: "90001",
        streets: &[
            "Sunset Boulevard",
            "Hollywood Boulevard",
            "Wilshire Boulevard",
            "Rodeo Drive",
        ],
    },
    UsStateLocation {
        state: "New York",
        city: "New York City",
        zipcode: "10001",
        streets: &[
            "Broadway",
            "Fifth Avenue",
            "Wall Street",
            "Madison Avenue",
            "Park Avenue",
        ],
    },
    UsStateLocation {
        state: "Texas",
        city: "Houston",
        zipcode: "77001",
        streets: &[
            "Main Street",
            "Texas Avenue",
            "Post Oak Boulevard",
            "Westheimer Road",
        ],
    },
    UsStateLocation {
        state: "Florida",
        city: "Miami",
        zipcode: "33101",
        streets: &[
            "Ocean Drive",
            "Biscayne Boulevard",
            "Collins Avenue",
            "Brickell Avenue",
        ],
    },
    UsStateLocation {
        state: "Washington",
        city: "Seattle",
        zipcode: "98101",
        streets: &[
            "Pike Street",
            "Pine Street",
            "Second Avenue",
            "University Street",
        ],
    },
    UsStateLocation {
        state: "Illinois",
        city: "Chicago",
        zipcode: "60601",
        streets: &[
            "Michigan Avenue",
            "State Street",
            "Wacker Drive",
            "Lake Shore Drive",
        ],
    },
];

impl NationalityProvider for UsaProvider {
    fn nat_code(&self) -> &'static str {
        "US"
    }

    fn country_name(&self) -> &'static str {
        "United States"
    }

    fn generate_name(&self, is_male: bool, rng: &mut dyn rand::RngCore) -> NameData {
        let first_names_male = [
            "James", "John", "Robert", "Michael", "William", "David", "Richard", "Joseph",
            "Thomas", "Charles", "Daniel", "Matthew", "Anthony", "Mark", "Donald", "Steven",
        ];
        let first_names_female = [
            "Mary",
            "Patricia",
            "Jennifer",
            "Linda",
            "Elizabeth",
            "Barbara",
            "Susan",
            "Jessica",
            "Sarah",
            "Karen",
            "Lisa",
            "Nancy",
            "Betty",
            "Margaret",
            "Sandra",
            "Ashley",
        ];
        let last_names = [
            "Smith",
            "Johnson",
            "Williams",
            "Brown",
            "Jones",
            "Garcia",
            "Miller",
            "Davis",
            "Rodriguez",
            "Martinez",
            "Hernandez",
            "Lopez",
            "Gonzalez",
            "Wilson",
            "Anderson",
            "Thomas",
        ];

        let first = if is_male {
            first_names_male[rng.gen_range(0..first_names_male.len())]
        } else {
            first_names_female[rng.gen_range(0..first_names_female.len())]
        };
        let last = last_names[rng.gen_range(0..last_names.len())];
        let display = format!("{} {}", first, last);

        NameData {
            first: first.to_string(),
            last,
            display_name: display,
        }
    }

    fn generate_location(&self, rng: &mut dyn rand::RngCore) -> LocationData {
        let us_loc = &US_LOCATIONS[rng.gen_range(0..US_LOCATIONS.len())];
        let street = us_loc.streets[rng.gen_range(0..us_loc.streets.len())];
        let st_num = rng.gen_range(10..999);

        LocationData {
            street_number: st_num,
            street_name: street.to_string(),
            ward: "".to_string(),
            district: "".to_string(),
            city: format!("{}, {}", us_loc.city, us_loc.state),
            state: us_loc.state.to_string(),
            country: "United States",
            postcode: us_loc.zipcode.to_string(),
            latitude_range: (25.0, 48.0),
            longitude_range: (-122.0, -71.0),
        }
    }

    fn generate_id(
        &self,
        _birth_year: u32,
        _is_male: bool,
        rng: &mut dyn rand::RngCore,
    ) -> IdentityData {
        let ssn = format!(
            "{:03}-{:02}-{:04}",
            rng.gen_range(100..900),
            rng.gen_range(10..99),
            rng.gen_range(1000..9999)
        );
        IdentityData {
            name: "SSN",
            value: ssn,
        }
    }

    fn generate_phone(&self, rng: &mut dyn rand::RngCore) -> String {
        format!(
            "+1 ({:03}) {:03}-{:04}",
            rng.gen_range(201..999),
            rng.gen_range(200..999),
            rng.gen_range(1000..9999)
        )
    }

    fn generate_job(&self, rng: &mut dyn rand::RngCore) -> &'static str {
        let jobs = [
            "Staff Software Engineer",
            "Product Manager",
            "Lead Data Scientist",
            "Cloud Solutions Architect",
            "UI/UX Principal",
            "Engineering Director",
            "Cybersecurity Specialist",
            "Technical Program Manager",
        ];
        jobs[rng.gen_range(0..jobs.len())]
    }

    fn timezone(&self) -> (&'static str, &'static str) {
        ("-05:00", "Eastern Time (US & Canada)")
    }
}
