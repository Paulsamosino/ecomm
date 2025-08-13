const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

// Import models
const User = require("./models/User");
const Product = require("./models/Product");
const Order = require("./models/Order");
const Report = require("./models/Report");

// Import delivery locations
const { DELIVERY_LOCATIONS, getCityCoordinates } = require("../../shared/constants/deliveryLocations");

// Helper Functions for Philippine Data
function getRandomPhilippineCity() {
  const provinces = Object.keys(DELIVERY_LOCATIONS);
  const randomProvince = provinces[Math.floor(Math.random() * provinces.length)];
  const cities = DELIVERY_LOCATIONS[randomProvince];
  const randomCity = cities[Math.floor(Math.random() * cities.length)];
  return { city: randomCity.label, province: randomProvince };
}

function getRandomPhilippinePhone() {
  // Valid Philippine mobile numbers: +63 9xx xxx xxxx
  const prefixes = ['917', '918', '919', '920', '921', '922', '923', '924', '925', '926', '927', '928', '929', '939', '947', '948', '949', '950', '951', '952', '953', '954', '955', '956', '975', '977', '978', '979', '994', '995', '996', '997', '998', '999'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const number = Math.floor(Math.random() * 9000000 + 1000000); // 7-digit number
  return `+63${prefix}${number}`;
}

function getRandomPhilippineName() {
  const firstNames = [
    // Male names
    "Juan", "Jose", "Antonio", "Pedro", "Miguel", "Carlos", "Eduardo", "Fernando", "Rafael", "Ricardo",
    "Roberto", "Daniel", "Manuel", "Francisco", "Gabriel", "Angelo", "Christian", "Mark", "John", "Ryan",
    "Joshua", "Michael", "David", "James", "Christopher", "Paolo", "Marco", "Vincent", "Francis", "Alexander",
    // Female names
    "Maria", "Ana", "Carmen", "Josefa", "Luz", "Teresa", "Elena", "Rosa", "Patricia", "Cristina",
    "Jennifer", "Michelle", "Angela", "Sarah", "Karen", "Nicole", "Stephanie", "Catherine", "Mary", "Grace",
    "Joy", "Faith", "Hope", "Angel", "Princess", "Divine", "Precious", "Lovely", "Cherry", "Rose"
  ];
  
  const lastNames = [
    "Santos", "Reyes", "Cruz", "Bautista", "Ocampo", "Garcia", "Mendoza", "Torres", "Tomas", "Andres",
    "Marquez", "Robles", "Castillo", "Iglesias", "Herrera", "Morales", "Ramos", "Romero", "Gutierrez", "Gonzales",
    "Rivera", "Flores", "Gomez", "Pascual", "Valdez", "Soriano", "Aquino", "Fernandez", "Aguilar", "Villareal",
    "Cabrera", "Santiago", "Mercado", "Dela Cruz", "Villanueva", "Navarro", "Perez", "Manalo", "Luna", "Diaz",
    "Lopez", "Rodriguez", "Evangelista", "Francisco", "Salazar", "Espinosa", "Domingo", "Castro", "Tolentino", "Lim"
  ];
  
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  return `${firstName} ${lastName}`;
}

function getRandomPhilippineStreet() {
  const streetNames = [
    "Rizal Street", "Bonifacio Avenue", "Aguinaldo Road", "Mabini Street", "Del Pilar Avenue",
    "Luna Street", "Quezon Boulevard", "Roxas Avenue", "Magsaysay Street", "Burgos Road",
    "Gomez Street", "Zamora Avenue", "Escolta Street", "Taft Avenue", "EDSA", "Katipunan Avenue",
    "Commonwealth Avenue", "España Boulevard", "Ortigas Avenue", "Shaw Boulevard", "Pioneer Street",
    "Industrial Road", "Commercial Street", "Market Avenue", "Church Street", "School Road",
    "Barangay Road", "Sitio Street", "Purok Avenue", "Main Street", "Central Avenue",
    "National Highway", "Provincial Road", "Maharlika Highway", "Pan-Philippine Highway"
  ];
  
  const houseNumber = Math.floor(Math.random() * 999) + 1;
  const streetName = streetNames[Math.floor(Math.random() * streetNames.length)];
  return `${houseNumber} ${streetName}`;
}

function standardAddress(cityName, provinceName) {
  return {
    street: getRandomPhilippineStreet(),
    city: cityName,
    state: provinceName,
    zipCode: Math.floor(Math.random() * 8999 + 1000).toString(), // Philippine postal codes: 1000-9999
    country: "Philippines",
  };
}

// Create 5 admin accounts, 30 seller accounts, and 50 buyer accounts
const users = [
  // Admin accounts
  ...Array(5)
    .fill()
    .map((_, i) => {
      const location = getRandomPhilippineCity();
      return {
        name: getRandomPhilippineName(),
        email: `admin${i + 1}@gmail.com`,
        password: "password",
        role: "admin",
        isAdmin: true,
        phone: getRandomPhilippinePhone(),
        address: standardAddress(location.city, location.province),
      };
    }),

  // Seller accounts - 30 sellers
  ...Array(30)
    .fill()
    .map((_, i) => {
      const location = getRandomPhilippineCity();
      const name = getRandomPhilippineName();
      const businessTypes = [
        "Poultry Farm", "Livestock Farm", "Egg Production", "Broiler Farm", "Layer Farm",
        "Duck Farm", "Quail Farm", "Turkey Farm", "Organic Farm", "Free Range Farm"
      ];
      const businessType = businessTypes[Math.floor(Math.random() * businessTypes.length)];
      
      return {
        name: name,
        email: `seller${i + 1}@gmail.com`,
        password: "password",
        role: "seller",
        isSeller: true,
        phone: getRandomPhilippinePhone(),
        address: standardAddress(location.city, location.province),
        sellerProfile: {
          businessName: `${name.split(' ')[1]} ${businessType}`,
          description: `Established ${businessType.toLowerCase()} specializing in ${
            ["free-range", "organic", "heritage breed", "premium quality"][
              Math.floor(Math.random() * 4)
            ]
          } poultry products. Serving customers in ${location.province} since ${
            2010 + Math.floor(Math.random() * 13)
          }.`,
          website: `https://seller${i + 1}.example.com`,
          location: standardAddress(location.city, location.province),
          phone: getRandomPhilippinePhone(),
          rating: (4 + Math.random()).toFixed(1),
          totalSales: Math.floor(Math.random() * 5000) + 1000,
          responseRate: Math.floor(Math.random() * 20) + 80,
          responseTime: ["Within 1 hour", "Within 3 hours", "Within 24 hours"][
            Math.floor(Math.random() * 3)
          ],
          verified: Math.random() > 0.2,
          memberSince: new Date(
            Date.now() - Math.floor(Math.random() * 365 * 24 * 60 * 60 * 1000)
          ),
        },
      };
    }),

  // Buyer accounts - 50 buyers
  ...Array(50)
    .fill()
    .map((_, i) => {
      const location = getRandomPhilippineCity();
      return {
        name: getRandomPhilippineName(),
        email: `buyer${i + 1}@gmail.com`,
        password: "password",
        role: "buyer",
        phone: getRandomPhilippinePhone(),
        address: standardAddress(location.city, location.province),
        wishlist: [],
        orderHistory: [],
        createdAt: new Date(
          Date.now() - Math.floor(Math.random() * 365 * 24 * 60 * 60 * 1000)
        ),
      };
    }),
];

const productTemplates = [
  {
    category: "chicken",
    breeds: [
      "Rhode Island Red",
      "Plymouth Rock",
      "Leghorn",
      "Orpington",
      "Wyandotte",
      "Australorp",
      "Sussex",
      "Brahma",
      "Silkie",
      "Cornish Cross",
      "Black Star",
      "Red Star",
      "Ameraucana",
      "Marans",
      "Jersey Giant",
      "Cochin",
      "Hamburg",
      "Dominique",
      "New Hampshire Red",
      "Light Brahma",
    ],
    priceRange: [25, 85],
    images: ["/1f425.png"],
    qualities: [
      "Free Range",
      "Organic Fed",
      "Heritage Breed",
      "Show Quality",
      "Egg Layer",
      "Meat Bird",
    ],
  },
  {
    category: "duck",
    breeds: [
      "Pekin",
      "Muscovy",
      "Runner",
      "Khaki Campbell",
      "Welsh Harlequin",
      "Cayuga",
      "Rouen",
      "Blue Swedish",
      "Buff",
      "Magpie",
      "Silver Appleyard",
      "Call Duck",
      "Saxony",
      "Ancona",
      "Black East Indian",
    ],
    priceRange: [35, 95],
    images: ["/1f425.png"],
    qualities: [
      "Water Fowl",
      "Show Bird",
      "Egg Producer",
      "Meat Bird",
      "Pet Quality",
    ],
  },
  {
    category: "turkey",
    breeds: [
      "Bourbon Red",
      "Bronze",
      "White Holland",
      "Narragansett",
      "Royal Palm",
      "Blue Slate",
      "Black Spanish",
      "Beltsville Small White",
      "Midget White",
      "Standard Bronze",
      "Broad Breasted White",
      "Heritage Bronze",
    ],
    priceRange: [75, 195],
    images: ["/1f425.png"],
    qualities: [
      "Heritage Breed",
      "Show Quality",
      "Meat Production",
      "Free Range",
    ],
  },
  {
    category: "other",
    types: [
      // Feed
      "Layer Feed",
      "Starter Feed",
      "Grower Feed",
      "Scratch Grains",
      "Organic Feed",
      "Medicated Feed",
      "Game Bird Feed",
      "Duck Feed",
      "Turkey Feed",
      // Equipment
      "Automatic Feeder",
      "Waterer System",
      "Nesting Boxes",
      "Incubator",
      "Brooder",
      "Heat Lamp",
      "Coops",
      "Fencing",
      "Egg Collection Baskets",
      // Supplies
      "Vitamins",
      "Minerals",
      "Grit",
      "Oyster Shell",
      "Probiotics",
      "First Aid Kit",
      "Cleaning Supplies",
      "Bedding Material",
      // Medications
      "Antibiotics",
      "Dewormers",
      "Vaccines",
      "Health Supplements",
      // Treats
      "Dried Mealworms",
      "Scratch Mix",
      "Dried Insects",
      "Fresh Greens",
    ],
    priceRange: [15, 500],
    images: ["/1f425.png"],
    categories: ["Feed", "Equipment", "Supplies", "Medications", "Treats"],
  },
];

function generateWeight(category, age) {
  const weights = {
    chicken: {
      young: "0.5-1",
      adult: "2-4",
      mature: "3-5",
    },
    duck: {
      young: "0.8-1.5",
      adult: "2.5-4",
      mature: "3-6",
    },
    turkey: {
      young: "2-4",
      adult: "7-13",
      mature: "10-18",
    },
    other: "0.5-25",
  };

  if (category === "other") return weights.other;

  const ageGroup = age <= 3 ? "young" : age <= 8 ? "adult" : "mature";
  return weights[category][ageGroup];
}

function generateDescription(category, breed, qualities = []) {
  const descriptions = {
    chicken: `Premium quality ${breed} chickens. ${
      qualities.includes("Egg Layer")
        ? "Known for excellent egg production. "
        : qualities.includes("Meat Bird")
        ? "Ideal for meat production. "
        : "Versatile dual-purpose breed. "
    }${
      qualities.includes("Free Range")
        ? "Raised in spacious free-range conditions. "
        : ""
    }${
      qualities.includes("Organic Fed")
        ? "Fed with certified organic feed. "
        : ""
    }${
      qualities.includes("Show Quality")
        ? "Exhibition quality with excellent conformation. "
        : ""
    }Ages ${Math.floor(Math.random() * 12) + 1} months available.`,

    duck: `High-quality ${breed} ducks. ${
      qualities.includes("Egg Producer")
        ? "Excellent egg laying ability. "
        : qualities.includes("Meat Bird")
        ? "Ideal for meat production. "
        : "Great all-purpose breed. "
    }${
      qualities.includes("Water Fowl")
        ? "Thrives in aquatic environments. "
        : ""
    }${
      qualities.includes("Show Bird")
        ? "Show-quality specimens available. "
        : ""
    }${
      qualities.includes("Pet Quality")
        ? "Makes an excellent pet with proper care. "
        : ""
    }`,

    turkey: `Heritage ${breed} turkeys. ${
      qualities.includes("Heritage Breed") ? "Pure heritage bloodlines. " : ""
    }${
      qualities.includes("Show Quality")
        ? "Show-quality birds with excellent conformation. "
        : ""
    }${
      qualities.includes("Meat Production")
        ? "Superior meat quality and yield. "
        : ""
    }${
      qualities.includes("Free Range")
        ? "Raised in natural, free-range conditions. "
        : ""
    }`,

    other: (type) => {
      const categories = {
        Feed: "Premium quality feed formulated for optimal nutrition and growth.",
        Equipment:
          "Professional-grade equipment designed for durability and efficiency.",
        Supplies: "Essential supplies for maintaining healthy poultry.",
        Medications: "Veterinary-approved medications for poultry health.",
        Treats:
          "Nutritious treats to supplement regular feed and encourage natural behaviors.",
      };

      const category = Object.keys(categories).find((cat) =>
        type.toLowerCase().includes(cat.toLowerCase())
      );
      return categories[category] || "Quality poultry products and supplies.";
    },
  };

  return category === "other"
    ? descriptions.other(breed)
    : descriptions[category];
}

function generateSpecifications(category, breed, qualities = []) {
  const specs = [];

  if (category === "other") {
    // For equipment, feed, and supplies
    specs.push(
      { name: "Category", value: category },
      { name: "Type", value: breed }
    );
  } else {
    // For livestock (chicken, duck, turkey, etc.)
    specs.push(
      { name: "Category", value: category },
      { name: "Breed", value: breed },
      { name: "Purpose", value: qualities.join(", ") },
      {
        name: "Temperament",
        value: ["Calm", "Friendly", "Active", "Docile"][
          Math.floor(Math.random() * 4)
        ],
      },
      {
        name: "Egg Production",
        value: ["High", "Medium", "Low"][Math.floor(Math.random() * 3)],
      },
      { name: "Cold Hardy", value: Math.random() > 0.5 ? "Yes" : "No" },
      { name: "Heat Tolerant", value: Math.random() > 0.5 ? "Yes" : "No" }
    );
  }

  return specs;
}

// Generate 200+ products
const products = [];
productTemplates.forEach((template) => {
  const count = template.category === "other" ? 50 : 50; // 50 of each category
  for (let i = 0; i < count; i++) {
    const breed = template.breeds
      ? template.breeds[Math.floor(Math.random() * template.breeds.length)]
      : template.types[Math.floor(Math.random() * template.types.length)];

    const age =
      template.category === "other" ? 0 : Math.floor(Math.random() * 12) + 1;
    const qualities = template.qualities
      ? template.qualities
          .sort(() => Math.random() - 0.5)
          .slice(0, Math.floor(Math.random() * 3) + 1)
      : [];

    products.push({
      name: `${breed} ${
        template.category === "other" ? "" : template.category
      }`,
      description: generateDescription(template.category, breed, qualities),
      price: generatePrice(template.priceRange[0], template.priceRange[1]),
      discount: Math.random() < 0.3 ? Math.floor(Math.random() * 20) + 5 : 0,
      category: template.category,
      breed: breed,
      age: age,
      weight: generateWeight(template.category, age),
      quantity: Math.floor(Math.random() * 50) + 10,
      images: template.images,
      location: (() => {
        const loc = getRandomPhilippineCity();
        return `${loc.city}, ${loc.province}`;
      })(),
      status: Math.random() < 0.1 ? "out_of_stock" : "active",
      rating: (4 + Math.random()).toFixed(1),
      reviewCount: Math.floor(Math.random() * 200) + 50,
      isNew: Math.random() < 0.2,
      isFeatured: Math.random() < 0.1,
      specifications: generateSpecifications(
        template.category,
        breed,
        qualities
      ),
      qualities: qualities,
      reviews: [],
      createdAt: new Date(
        Date.now() - Math.floor(Math.random() * 90 * 24 * 60 * 60 * 1000)
      ), // Random date in last 90 days
    });
  }
});


// Helper function for generating prices
function generatePrice(min, max) {
  return Number((Math.random() * (max - min) + min).toFixed(2));
}

// Generate sample reports
const reportReasons = [
  "Inappropriate content",
  "Misleading information",
  "Spam",
  "Harassment",
  "Fake listing",
  "Poor quality product",
  "Scam attempt",
  "False advertising",
];

const reportDescriptions = [
  "This listing contains inappropriate content that violates community guidelines.",
  "The product description is misleading and doesn't match the actual item.",
  "User is spamming multiple identical listings across the platform.",
  "Seller has been harassing buyers through messages.",
  "This appears to be a fake listing with stolen images.",
  "Received product was of much lower quality than advertised.",
  "Potential scam attempt with requests for off-platform payments.",
  "Images and description don't match the actual product being sold.",
];

const generateReports = (users, products) => {
  const reports = [];
  const numReports = 20; // Generate 20 sample reports

  const categories = [
    "fraud",
    "harassment",
    "product_quality",
    "shipping",
    "payment",
    "communication",
    "other",
  ];

  for (let i = 0; i < numReports; i++) {
    const isUserReport = Math.random() > 0.7; // 30% chance of being a user report
    const reporter = users[Math.floor(Math.random() * users.length)];
    const reportedUser = users[Math.floor(Math.random() * users.length)];

    // Make sure reporter and reported user are different
    if (reporter._id === reportedUser._id) {
      continue;
    }

    const reasonIndex = Math.floor(Math.random() * reportReasons.length);
    const status = ["pending", "investigating", "resolved", "dismissed"][
      Math.floor(Math.random() * 4)
    ];

    reports.push({
      type: isUserReport ? "user" : "product",
      reportedUser: reportedUser._id,
      reporter: reporter._id,
      reporterRole: reporter.isSeller ? "seller" : "buyer",
      reason: reportReasons[reasonIndex],
      description: reportDescriptions[reasonIndex],
      category: categories[Math.floor(Math.random() * categories.length)],
      status: status,
      priority: ["low", "medium", "high", "urgent"][
        Math.floor(Math.random() * 4)
      ],
      resolution:
        status === "resolved" ? "Issue has been addressed and resolved." : "",
      resolvedBy:
        status === "resolved" ? users.find((u) => u.isAdmin)?._id : null,
      resolvedAt: status === "resolved" ? new Date() : null,
      evidence: [
        {
          type: "other",
          reference: "Sample evidence",
          description: "Sample evidence description",
        },
      ],
      createdAt: new Date(
        Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000)
      ), // Random date in last 30 days
    });
  }

  return reports;
};

// Seed function
async function seedDatabase() {
  try {
    // Safety check: prevent running on production
    if (
      process.env.NODE_ENV === "production" ||
      (process.env.MONGODB_URI &&
        /prod|production/i.test(process.env.MONGODB_URI))
    ) {
      throw new Error("Seeding is disabled on production environments.");
    }
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    // Clear existing data
    await User.deleteMany({});
    await Product.deleteMany({});
    await Order.deleteMany({});
  // Chat/messages feature removed – nothing to clear for Chat/Message
    await Report.deleteMany({});
    console.log("Cleared existing data");

    // Create users using the User model
    const createdUsers = await Promise.all(
      users.map(async (userData) => {
        // Create a new User instance which will handle password hashing
        const user = new User(userData);
        return await user.save();
      })
    );
    console.log("Users created");

    // Get sellers and buyers
    const sellers = createdUsers.filter((user) => user.role === "seller");
    const buyers = createdUsers.filter((user) => user.role === "buyer");

    // Create products with sellers (no fake reviews)
    if (!sellers.length || !buyers.length) {
      throw new Error(
        "No sellers or buyers available for product creation."
      );
    }
    const createdProducts = await Promise.all(
      products.map(async (product, index) => {
        const seller = sellers[index % sellers.length];

        return await Product.create({
          ...product,
          seller: seller._id,
          reviews: [], // Start with empty reviews - only real reviews from actual purchases
        });
      })
    );
    console.log("Products created without fake reviews");

    // Create reports
    const reports = generateReports(createdUsers, createdProducts);
    await Report.insertMany(reports);
    console.log("Reports created");

    // Orders are not seeded by default.

  // Chat/messages feature removed – skipping chat seeding

    console.log("Database seeded successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
}

// Run the seed function if this file is executed directly
if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;
