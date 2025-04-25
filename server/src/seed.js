const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

// Import models
const User = require("./models/User");
const Product = require("./models/Product");
const Order = require("./models/Order");
const Chat = require("./models/Chat");
const Message = require("./models/Message");
const Report = require("./models/Report");

// Helper Functions
function standardAddress(city) {
  const streets = [
    "Main St",
    "Oak Avenue",
    "Maple Lane",
    "Cedar Road",
    "Pine Street",
    "Farm Road",
    "Valley View",
    "Hill Street",
  ];
  const states = ["CA", "NY", "TX", "FL", "IL", "PA", "OH", "GA", "NC", "MI"];

  return {
    street: `${Math.floor(Math.random() * 9999) + 1} ${
      streets[Math.floor(Math.random() * streets.length)]
    }`,
    city: city,
    state: states[Math.floor(Math.random() * states.length)],
    zipCode: Math.floor(Math.random() * 89999 + 10000).toString(),
    country: "USA",
  };
}

// Create 5 admin accounts, 30 seller accounts, and 50 buyer accounts
const users = [
  // Admin accounts
  ...Array(5)
    .fill()
    .map((_, i) => ({
      name: `Admin ${i + 1}`,
      email: `admin${i + 1}@gmail.com`,
      password: "password",
      role: "admin",
      isAdmin: true,
      phone: `+1${Math.floor(Math.random() * 900 + 100)}${Math.floor(
        Math.random() * 9000000 + 1000000
      )}`,
      address: standardAddress("Admin City"),
    })),

  // Seller accounts - 30 sellers
  ...Array(30)
    .fill()
    .map((_, i) => ({
      name: `Seller ${i + 1}`,
      email: `seller${i + 1}@gmail.com`,
      password: "password",
      role: "seller",
      isSeller: true,
      phone: `+1${Math.floor(Math.random() * 900 + 100)}${Math.floor(
        Math.random() * 9000000 + 1000000
      )}`,
      address: standardAddress(`Seller City ${i + 1}`),
      sellerProfile: {
        businessName: `${
          ["Premium", "Quality", "Family", "Heritage", "Organic"][
            Math.floor(Math.random() * 5)
          ]
        } Poultry Farm ${i + 1}`,
        description: `Established poultry farm specializing in ${
          ["free-range", "organic", "heritage breed", "premium quality"][
            Math.floor(Math.random() * 4)
          ]
        } poultry products. Serving customers since ${
          2010 + Math.floor(Math.random() * 13)
        }.`,
        website: `https://seller${i + 1}.example.com`,
        address: standardAddress(`Seller City ${i + 1}`),
        phone: `+1${Math.floor(Math.random() * 900 + 100)}${Math.floor(
          Math.random() * 9000000 + 1000000
        )}`,
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
    })),

  // Buyer accounts - 50 buyers
  ...Array(50)
    .fill()
    .map((_, i) => ({
      name: `Buyer ${i + 1}`,
      email: `buyer${i + 1}@gmail.com`,
      password: "password",
      role: "user",
      phone: `+1${Math.floor(Math.random() * 900 + 100)}${Math.floor(
        Math.random() * 9000000 + 1000000
      )}`,
      address: standardAddress(`Buyer City ${i + 1}`),
      wishlist: [],
      orderHistory: [],
      createdAt: new Date(
        Date.now() - Math.floor(Math.random() * 365 * 24 * 60 * 60 * 1000)
      ),
    })),
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
  const specs = [
    { name: "Category", value: category },
    { name: "Breed/Type", value: breed },
  ];

  if (category !== "other") {
    specs.push(
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
      location: `City ${Math.floor(Math.random() * 10) + 1}`,
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

// Sample chat messages for more realistic conversations
const chatMessages = [
  // Inquiry about chicken availability
  {
    sender: "buyer",
    content:
      "Hi, I'm interested in your Rhode Island Reds. Do you have any currently available?",
    status: "READ",
  },
  {
    sender: "seller",
    content:
      "Yes, we have several Rhode Island Reds available! They're 4 months old and already laying. Would you like more information?",
    status: "READ",
  },
  {
    sender: "buyer",
    content:
      "Great! What's the price per bird and do you offer vaccination records?",
    status: "READ",
  },
  {
    sender: "seller",
    content:
      "They're $45 each, and yes, all our birds come with complete vaccination records. We can also provide health certificates if needed.",
    status: "READ",
  },
  {
    sender: "buyer",
    content: "Perfect, I'd like to purchase 3 birds. What's the next step?",
    status: "READ",
  },

  // Duck breeding inquiry
  {
    sender: "buyer",
    content:
      "Hello, do you have any experience with breeding Khaki Campbell ducks?",
    status: "READ",
  },
  {
    sender: "seller",
    content:
      "Yes, we've been breeding Khaki Campbells for 5 years. They're excellent egg layers!",
    status: "READ",
  },
  {
    sender: "buyer",
    content: "What's the typical egg production I can expect?",
    status: "READ",
  },
  {
    sender: "seller",
    content:
      "Our Khaki Campbells typically lay 250-300 eggs per year when properly cared for.",
    status: "READ",
  },

  // Equipment purchase
  {
    sender: "buyer",
    content:
      "I'm looking for an automatic chicken feeder for 20 birds. Any recommendations?",
    status: "READ",
  },
  {
    sender: "seller",
    content:
      "We have a 20lb capacity automatic feeder that would be perfect for your flock. It's weather-resistant and has anti-waste features.",
    status: "READ",
  },
  {
    sender: "buyer",
    content: "Sounds good. What's the price and is installation included?",
    status: "READ",
  },
  {
    sender: "seller",
    content:
      "It's $89.99 and comes with detailed installation instructions. We can also provide setup assistance via video call if needed.",
    status: "READ",
  },
  {
    sender: "buyer",
    content: "Great, I'll take it. Can you ship to California?",
    status: "READ",
  },

  // Turkey inquiry
  {
    sender: "buyer",
    content:
      "Hi, I'm interested in heritage turkeys for breeding. What breeds do you have?",
    status: "READ",
  },
  {
    sender: "seller",
    content:
      "We currently have Bourbon Red and Narragansett turkeys available for breeding.",
    status: "READ",
  },
  {
    sender: "buyer",
    content: "Can you tell me more about the Bourbon Reds?",
    status: "READ",
  },
  {
    sender: "seller",
    content:
      "Our Bourbon Reds are from champion bloodlines, excellent foragers, and typically reach 23-25 lbs for toms.",
    status: "READ",
  },
];

// Helper function to generate review templates
const reviewTemplates = [
  {
    comment: "Excellent quality birds, very healthy and exactly as described.",
    rating: 5,
  },
  { comment: "Great seller, fast shipping and good communication.", rating: 5 },
  { comment: "Birds arrived in perfect condition. Very satisfied!", rating: 5 },
  {
    comment: "Healthy birds but shipping took longer than expected.",
    rating: 4,
  },
  { comment: "Good quality but prices are a bit high.", rating: 4 },
  { comment: "Nice birds but would have liked more variety.", rating: 4 },
  { comment: "Decent experience overall.", rating: 3 },
  { comment: "Communication could have been better.", rating: 3 },
  { comment: "Product was okay but not what I expected.", rating: 3 },
  { comment: "Had some issues but seller resolved them.", rating: 3 },
];

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
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    // Clear existing data
    await User.deleteMany({});
    await Product.deleteMany({});
    await Order.deleteMany({});
    await Chat.deleteMany({});
    await Message.deleteMany({});
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
    const sellers = createdUsers.filter((user) => user.isSeller);
    const buyers = createdUsers.filter((user) => user.role === "user");

    // Create products with sellers and reviews
    const createdProducts = await Promise.all(
      products.map(async (product, index) => {
        const seller = sellers[index % sellers.length];

        // Assign 2-3 random reviews to each product
        const numReviews = Math.floor(Math.random() * 2) + 2; // 2-3 reviews
        const productReviews = [];

        for (let i = 0; i < numReviews; i++) {
          const reviewTemplate =
            reviewTemplates[Math.floor(Math.random() * reviewTemplates.length)];
          const buyer = buyers[Math.floor(Math.random() * buyers.length)];

          productReviews.push({
            rating: reviewTemplate.rating,
            comment: reviewTemplate.comment,
            user: buyer._id,
            userName: buyer.name,
            date: new Date(
              Date.now() - Math.floor(Math.random() * 90 * 24 * 60 * 60 * 1000)
            ), // Random date in last 90 days
          });
        }

        return await Product.create({
          ...product,
          seller: seller._id,
          reviews: productReviews,
        });
      })
    );
    console.log("Products created with reviews");

    // Create reports
    const reports = generateReports(createdUsers, createdProducts);
    await Report.insertMany(reports);
    console.log("Reports created");

    // Create orders
    const orders = [];
    for (let i = 0; i < 15; i++) {
      const buyer = buyers[i % buyers.length];
      const product = createdProducts[i % createdProducts.length];
      const seller = await User.findById(product.seller);

      // Random order date within the last 3 months
      const orderDate = new Date();
      orderDate.setMonth(orderDate.getMonth() - Math.floor(Math.random() * 3));
      orderDate.setDate(orderDate.getDate() - Math.floor(Math.random() * 30));

      // Create more realistic orders with multiple items sometimes
      const numItems =
        Math.random() > 0.7 ? Math.floor(Math.random() * 2) + 2 : 1; // 70% single item, 30% 2-3 items
      const items = [];
      let totalAmount = 0;

      for (let j = 0; j < numItems; j++) {
        const orderProduct = createdProducts[(i + j) % createdProducts.length];
        const orderProductSeller = await User.findById(orderProduct.seller);
        const quantity = Math.floor(Math.random() * 3) + 1;
        const price =
          orderProduct.discount > 0
            ? orderProduct.price -
              (orderProduct.price * orderProduct.discount) / 100
            : orderProduct.price;

        items.push({
          product: orderProduct._id,
          name: orderProduct.name,
          seller: orderProductSeller._id,
          quantity: quantity,
          price: price,
        });

        totalAmount += price * quantity;
      }

      // Create order with calculated total and include phone in shipping address
      const paymentMethods = ["credit_card", "debit_card", "bank_transfer"];
      const orderStatuses = ["pending", "processing", "shipped", "delivered"];
      const weightedStatuses = [
        ...Array(1).fill("pending"),
        ...Array(2).fill("processing"),
        ...Array(3).fill("shipped"),
        ...Array(5).fill("delivered"),
      ]; // More orders in delivered status

      orders.push({
        buyer: buyer._id,
        seller: seller._id,
        items: items,
        shippingAddress: {
          ...buyer.address,
          phone:
            buyer.phone ||
            `+1${Math.floor(Math.random() * 900 + 100)}${Math.floor(
              Math.random() * 9000000 + 1000000
            )}`,
        },
        paymentInfo: {
          method:
            paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
          status: "completed",
          transactionId: `mock_transaction_${Math.random()
            .toString(36)
            .substring(2, 9)}`,
        },
        status:
          weightedStatuses[Math.floor(Math.random() * weightedStatuses.length)],
        totalAmount: totalAmount,
        createdAt: orderDate,
        updatedAt: orderDate,
      });
    }
    await Order.insertMany(orders);
    console.log("Orders created");

    // Create chats with more realistic conversation flows
    const chats = [];

    // Group chat messages into conversations
    const conversations = [
      chatMessages.slice(0, 5), // Conversation 1
      chatMessages.slice(5, 9), // Conversation 2
      chatMessages.slice(9, 14), // Conversation 3
      chatMessages.slice(14, 18), // Conversation 4
    ];

    for (let i = 0; i < 6; i++) {
      const buyer = buyers[i % buyers.length];
      const product = createdProducts[i % createdProducts.length];
      const seller = await User.findById(product.seller);

      // Select a random conversation template
      const conversation = conversations[i % conversations.length];

      // Create message array from conversation template
      const messages = conversation.map((msg) => ({
        content: msg.content,
        senderId: msg.sender === "buyer" ? buyer._id : seller._id,
        read: msg.read,
        createdAt: new Date(
          Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)
        ), // Random time in last week
      }));

      // Sort messages by created date
      messages.sort((a, b) => a.createdAt - b.createdAt);

      const chat = {
        buyer: buyer._id,
        seller: seller._id,
        product: product._id,
        messages: messages,
        lastMessage: messages[messages.length - 1], // Use the entire message object instead of just the content
        updatedAt: messages[messages.length - 1].createdAt,
      };

      chats.push(chat);
    }
    await Chat.insertMany(chats);
    console.log("Chats created with conversations");

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
