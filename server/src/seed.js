const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

// Import models
const User = require("./models/User");
const Product = require("./models/Product");
const Order = require("./models/Order");
const Chat = require("./models/Chat");
const Message = require("./models/Message");

// Sample data
const users = [
  {
    name: "John Admin",
    email: "admin@example.com",
    password: "admin123",
    role: "admin",
    isAdmin: true,
    phone: "+1234567890",
    address: {
      street: "123 Admin St",
      city: "Admin City",
      state: "AS",
      zipCode: "12345",
      country: "USA",
    },
  },
  {
    name: "Sarah Smith",
    email: "sarah@farm.com",
    password: "seller123",
    role: "seller",
    isSeller: true,
    phone: "+1987654321",
    address: {
      street: "456 Farm Ave",
      city: "Farm City",
      state: "FC",
      zipCode: "67890",
      country: "USA",
    },
    sellerProfile: {
      businessName: "Sarah's Premium Poultry",
      description: "Premium quality poultry from our family farm since 1995",
      website: "https://sarahspremium.com",
      address: {
        street: "456 Farm Road",
        city: "Farm City",
        state: "FC",
        zipCode: "54321",
        country: "USA",
      },
      phone: "+1987654321",
      rating: 4.8,
      totalSales: 1240,
      responseRate: 98,
      responseTime: "Within 2 hours",
    },
  },
  {
    name: "Mike Johnson",
    email: "mike@ranch.com",
    password: "seller123",
    role: "seller",
    isSeller: true,
    phone: "+1122334455",
    address: {
      street: "789 Ranch Rd",
      city: "Ranch City",
      state: "RC",
      zipCode: "13579",
      country: "USA",
    },
    sellerProfile: {
      businessName: "Johnson's Heritage Breeds",
      description: "Specializing in heritage breed poultry and rare varieties",
      website: "https://johnsonsheritage.com",
      address: {
        street: "789 Ranch Road",
        city: "Ranch City",
        state: "RC",
        zipCode: "13579",
        country: "USA",
      },
      phone: "+1122334455",
      rating: 4.6,
      totalSales: 876,
      responseRate: 95,
      responseTime: "Within 3 hours",
    },
  },
  {
    name: "Emma Davis",
    email: "emma@poultry.com",
    password: "seller123",
    role: "seller",
    isSeller: true,
    phone: "+1567891234",
    address: {
      street: "321 Poultry Lane",
      city: "Poultry City",
      state: "PC",
      zipCode: "24680",
      country: "USA",
    },
    sellerProfile: {
      businessName: "Emma's Organic Poultry",
      description: "Certified organic poultry raised with love and care",
      website: "https://emmasorganic.com",
      address: {
        street: "321 Poultry Lane",
        city: "Poultry City",
        state: "PC",
        zipCode: "24680",
        country: "USA",
      },
      phone: "+1567891234",
      rating: 4.9,
      totalSales: 1520,
      responseRate: 99,
      responseTime: "Within 1 hour",
    },
  },
  {
    name: "Daniel Garcia",
    email: "daniel@freerange.com",
    password: "seller123",
    role: "seller",
    isSeller: true,
    phone: "+1765432109",
    address: {
      street: "456 Free Range Ave",
      city: "Freedom City",
      state: "FR",
      zipCode: "87654",
      country: "USA",
    },
    sellerProfile: {
      businessName: "Garcia Free Range",
      description: "Pasture-raised poultry with ethical farming practices",
      website: "https://garciafreerange.com",
      address: {
        street: "456 Free Range Ave",
        city: "Freedom City",
        state: "FR",
        zipCode: "87654",
        country: "USA",
      },
      phone: "+1765432109",
      rating: 4.7,
      totalSales: 960,
      responseRate: 96,
      responseTime: "Within 4 hours",
    },
  },
  {
    name: "Bob Wilson",
    email: "bob@example.com",
    password: "buyer123",
    role: "user",
    phone: "+1246813579",
    address: {
      street: "159 Buyer St",
      city: "Buyer City",
      state: "BC",
      zipCode: "97531",
      country: "USA",
    },
  },
  {
    name: "Alice Brown",
    email: "alice@example.com",
    password: "buyer123",
    role: "user",
    phone: "+1369258147",
    address: {
      street: "753 Customer Ave",
      city: "Customer City",
      state: "CC",
      zipCode: "15935",
      country: "USA",
    },
  },
  {
    name: "David Lee",
    email: "david@example.com",
    password: "buyer123",
    role: "user",
    phone: "+1147258369",
    address: {
      street: "951 Market St",
      city: "Market City",
      state: "MC",
      zipCode: "35791",
      country: "USA",
    },
  },
  {
    name: "Jennifer Williams",
    email: "jennifer@example.com",
    password: "buyer123",
    role: "user",
    phone: "+1852963741",
    address: {
      street: "357 Maple Dr",
      city: "Maple City",
      state: "MP",
      zipCode: "74185",
      country: "USA",
    },
  },
  {
    name: "Michael Chen",
    email: "michael@example.com",
    password: "buyer123",
    role: "user",
    phone: "+1963852741",
    address: {
      street: "159 Oak St",
      city: "Oak City",
      state: "OC",
      zipCode: "85296",
      country: "USA",
    },
  },
];

const products = [
  // Sarah's Products
  {
    name: "Premium Rhode Island Red Chickens",
    description:
      "Award-winning Rhode Island Red chickens, perfect for both meat and egg production. Known for their friendly temperament and consistent laying. These birds come from our award-winning bloodline with excellent health records.",
    price: 35.99,
    discount: 0,
    category: "chicken",
    breed: "Rhode Island Red",
    age: 6,
    weight: "2.1 kg",
    quantity: 50,
    images: ["/chicken.svg", "/chicken.svg", "/chicken.svg"],
    location: "Farm City, FC",
    shippingInfo: "Local pickup available, shipping within 100 miles",
    status: "active",
    rating: 4.8,
    reviewCount: 124,
    isNew: false,
    isFeatured: true,
    specifications: [
      { name: "Gender", value: "Female" },
      { name: "Color", value: "Reddish Brown" },
      { name: "Temperament", value: "Friendly" },
      { name: "Egg Production", value: "280-300 eggs/year" },
      { name: "Egg Color", value: "Brown" },
      { name: "Egg Size", value: "Large" },
      { name: "Heat Tolerance", value: "Good" },
      { name: "Cold Tolerance", value: "Excellent" },
    ],
    reviews: [],
  },
  {
    name: "Buff Orpington Chickens",
    description:
      "Gentle giants of the chicken world. Excellent mothers and steady layers of brown eggs. Perfect for families with children due to their docile temperament.",
    price: 42.99,
    discount: 10,
    category: "chicken",
    breed: "Buff Orpington",
    age: 4,
    weight: "3.2 kg",
    quantity: 30,
    images: ["/chicken.svg", "/chicken.svg", "/chicken.svg"],
    location: "Farm City, FC",
    shippingInfo: "Local pickup preferred, limited shipping available",
    status: "active",
    rating: 4.7,
    reviewCount: 86,
    isNew: false,
    isFeatured: true,
    specifications: [
      { name: "Gender", value: "Female" },
      { name: "Color", value: "Golden Buff" },
      { name: "Temperament", value: "Very Gentle" },
      { name: "Egg Production", value: "200-250 eggs/year" },
      { name: "Egg Color", value: "Light Brown" },
      { name: "Egg Size", value: "Large" },
      { name: "Heat Tolerance", value: "Moderate" },
      { name: "Cold Tolerance", value: "Excellent" },
    ],
    reviews: [],
  },
  {
    name: "Organic Layer Feed - 20kg",
    description:
      "Premium organic layer feed specially formulated for optimal egg production. Non-GMO ingredients with added calcium for strong eggshells.",
    price: 45.99,
    discount: 0,
    category: "other",
    breed: "Feed Supplements",
    age: 1,
    weight: "20 kg",
    quantity: 200,
    images: ["/chicken.svg", "/chicken.svg"],
    location: "Farm City, FC",
    shippingInfo: "Shipping available nationwide, bulk discounts available",
    status: "active",
    rating: 4.9,
    reviewCount: 312,
    isNew: false,
    isFeatured: false,
    specifications: [
      { name: "Type", value: "Layer Feed" },
      { name: "Protein Content", value: "16%" },
      { name: "Calcium Content", value: "4.2%" },
      { name: "Non-GMO", value: "Yes" },
      { name: "Organic", value: "USDA Certified" },
      { name: "Medication", value: "None" },
    ],
    reviews: [],
  },

  // Mike's Products
  {
    name: "Heritage Pekin Ducks",
    description:
      "Pure breed Pekin ducks from champion bloodlines. Excellent for both meat and egg production. These ducks mature quickly and are known for their clean white feathers.",
    price: 45.99,
    discount: 0,
    category: "duck",
    breed: "Pekin",
    age: 3,
    weight: "2.5 kg",
    quantity: 25,
    images: ["/chicken.svg", "/chicken.svg"],
    location: "Ranch City, RC",
    shippingInfo: "Nationwide shipping available with specialized packaging",
    status: "active",
    rating: 4.9,
    reviewCount: 78,
    isNew: true,
    isFeatured: true,
    specifications: [
      { name: "Gender", value: "Mixed" },
      { name: "Color", value: "White" },
      { name: "Temperament", value: "Calm" },
      { name: "Egg Production", value: "200-250 eggs/year" },
      { name: "Egg Color", value: "White" },
      { name: "Egg Size", value: "Large" },
      { name: "Heat Tolerance", value: "Moderate" },
      { name: "Cold Tolerance", value: "Good" },
    ],
    reviews: [],
  },
  {
    name: "Bourbon Red Turkeys",
    description:
      "Heritage breed turkeys known for their rich, flavorful meat. Perfect for small farms and seasonal production. These birds have a striking appearance with rich red plumage.",
    price: 89.99,
    discount: 0,
    category: "turkey",
    breed: "Bourbon Red",
    age: 5,
    weight: "7.2 kg",
    quantity: 15,
    images: ["/chicken.svg", "/chicken.svg"],
    location: "Ranch City, RC",
    shippingInfo: "Local pickup only, special arrangements for long-distance",
    status: "active",
    rating: 4.8,
    reviewCount: 42,
    isNew: false,
    isFeatured: false,
    specifications: [
      { name: "Gender", value: "Mixed" },
      { name: "Color", value: "Reddish Brown" },
      { name: "Temperament", value: "Alert, Docile" },
      { name: "Weight at Maturity", value: "7-8 kg (Female), 11-12 kg (Male)" },
      { name: "Heat Tolerance", value: "Good" },
      { name: "Cold Tolerance", value: "Excellent" },
      {
        name: "Heritage Status",
        value: "American Livestock Breeds Conservancy Listed",
      },
    ],
    reviews: [],
  },
  {
    name: "Poultry Waterer System - 5 Gallon",
    description:
      "Heavy-duty automatic waterer system with nipple dispensers. Reduces waste and keeps water clean. Easy to refill and maintain.",
    price: 39.99,
    discount: 15,
    category: "other",
    breed: "Poultry Equipment",
    age: 1,
    weight: "2.3 kg",
    quantity: 45,
    images: ["/chicken.svg", "/chicken.svg"],
    location: "Ranch City, RC",
    shippingInfo: "Free shipping on orders over $50",
    status: "active",
    rating: 4.6,
    reviewCount: 156,
    isNew: false,
    isFeatured: true,
    specifications: [
      { name: "Capacity", value: "5 Gallons (19 Liters)" },
      { name: "Material", value: "Food-grade Plastic" },
      { name: "Color", value: "Blue/White" },
      { name: "Dispenser Type", value: "Nipple (6 count)" },
      { name: "Suitable For", value: "Up to 30 birds" },
      { name: "Easy Clean", value: "Yes" },
    ],
    reviews: [],
  },

  // Emma's Products
  {
    name: "Organic Japanese Quail",
    description:
      "Certified organic Japanese quail, raised on non-GMO feed. Perfect for eggs and meat. These birds begin laying at just 6-7 weeks of age!",
    price: 18.99,
    discount: 0,
    category: "quail",
    breed: "Japanese",
    age: 2,
    weight: "0.2 kg",
    quantity: 100,
    images: ["/chicken.svg", "/chicken.svg"],
    location: "Poultry City, PC",
    shippingInfo:
      "Shipping available nationwide in temperature-controlled packaging",
    status: "active",
    rating: 4.9,
    reviewCount: 95,
    isNew: false,
    isFeatured: false,
    specifications: [
      { name: "Gender", value: "Female" },
      { name: "Color", value: "Brown Speckled" },
      { name: "Temperament", value: "Alert" },
      { name: "Egg Production", value: "290-320 eggs/year" },
      { name: "Egg Color", value: "Speckled" },
      { name: "Egg Size", value: "Small" },
      { name: "Heat Tolerance", value: "Good" },
      { name: "Cold Tolerance", value: "Moderate" },
    ],
    reviews: [],
  },
  {
    name: "Plymouth Rock Chickens",
    description:
      "Classic American breed known for their docile nature and consistent egg laying. Their distinctive barred pattern makes them easy to identify.",
    price: 32.99,
    discount: 0,
    category: "chicken",
    breed: "Plymouth Rock",
    age: 4,
    weight: "2.5 kg",
    quantity: 40,
    images: ["/chicken.svg", "/chicken.svg", "/chicken.svg"],
    location: "Poultry City, PC",
    shippingInfo: "Local delivery available within 50 miles",
    status: "active",
    rating: 4.7,
    reviewCount: 73,
    isNew: false,
    isFeatured: true,
    specifications: [
      { name: "Gender", value: "Female" },
      { name: "Color", value: "Barred (Black & White)" },
      { name: "Temperament", value: "Friendly" },
      { name: "Egg Production", value: "250-300 eggs/year" },
      { name: "Egg Color", value: "Light Brown" },
      { name: "Egg Size", value: "Large to Extra Large" },
      { name: "Heat Tolerance", value: "Good" },
      { name: "Cold Tolerance", value: "Excellent" },
    ],
    reviews: [],
  },
  {
    name: "Organic Chicken Treats - Berry Blend",
    description:
      "Healthy organic treats for chickens with a mix of dried berries and seeds. Great for encouraging natural foraging behavior.",
    price: 12.99,
    discount: 0,
    category: "other",
    breed: "Poultry Feed",
    age: 1,
    weight: "1 kg",
    quantity: 150,
    images: ["/chicken.svg", "/chicken.svg"],
    location: "Poultry City, PC",
    shippingInfo: "Free shipping on orders over $25",
    status: "active",
    rating: 4.8,
    reviewCount: 218,
    isNew: true,
    isFeatured: false,
    specifications: [
      { name: "Type", value: "Treats" },
      {
        name: "Ingredients",
        value: "Dried Cranberries, Blueberries, Sunflower Seeds, Pumpkin Seeds",
      },
      { name: "Organic", value: "Yes" },
      { name: "Preservatives", value: "None" },
      { name: "Package", value: "Resealable Bag" },
    ],
    reviews: [],
  },

  // Daniel's Products
  {
    name: "Wyandotte Chickens",
    description:
      "Beautiful Wyandotte chickens with distinctive laced feather patterns. Excellent dual-purpose birds and cold-hardy.",
    price: 38.99,
    discount: 5,
    category: "chicken",
    breed: "Wyandotte",
    age: 5,
    weight: "2.7 kg",
    quantity: 35,
    images: ["/chicken.svg", "/chicken.svg", "/chicken.svg"],
    location: "Freedom City, FR",
    shippingInfo:
      "Shipping available to most regions, specialized packaging included",
    status: "active",
    rating: 4.7,
    reviewCount: 89,
    isNew: false,
    isFeatured: true,
    specifications: [
      { name: "Gender", value: "Female" },
      { name: "Color", value: "Silver Laced" },
      { name: "Temperament", value: "Friendly but Alert" },
      { name: "Egg Production", value: "200-240 eggs/year" },
      { name: "Egg Color", value: "Brown" },
      { name: "Egg Size", value: "Large" },
      { name: "Heat Tolerance", value: "Moderate" },
      { name: "Cold Tolerance", value: "Excellent" },
    ],
    reviews: [],
  },
  {
    name: "Muscovy Ducks",
    description:
      "Free-range Muscovy ducks known for their lean meat and pest control abilities. These hardy birds have distinctive red caruncles on their face.",
    price: 42.99,
    discount: 0,
    category: "duck",
    breed: "Muscovy",
    age: 4,
    weight: "3.5 kg",
    quantity: 20,
    images: ["/chicken.svg", "/chicken.svg"],
    location: "Freedom City, FR",
    shippingInfo: "Local pickup preferred, limited shipping options",
    status: "active",
    rating: 4.6,
    reviewCount: 52,
    isNew: false,
    isFeatured: false,
    specifications: [
      { name: "Gender", value: "Mixed" },
      { name: "Color", value: "Black and White" },
      { name: "Temperament", value: "Independent" },
      { name: "Egg Production", value: "120-180 eggs/year" },
      { name: "Egg Color", value: "White" },
      { name: "Flight Ability", value: "Strong Flyers" },
      { name: "Heat Tolerance", value: "Excellent" },
      { name: "Cold Tolerance", value: "Good" },
    ],
    reviews: [],
  },
  {
    name: "Automatic Chicken Coop Door",
    description:
      "Solar-powered automatic chicken coop door with timer and light sensor. Keep your flock safe from predators with automated opening and closing.",
    price: 149.99,
    discount: 10,
    category: "other",
    breed: "Coop Equipment",
    age: 1,
    weight: "3.2 kg",
    quantity: 25,
    images: ["/chicken.svg", "/chicken.svg"],
    location: "Freedom City, FR",
    shippingInfo: "Free shipping nationwide, installation guide included",
    status: "active",
    rating: 4.8,
    reviewCount: 134,
    isNew: true,
    isFeatured: true,
    specifications: [
      { name: "Power Source", value: "Solar with Battery Backup" },
      { name: "Opening", value: '12" x 15"' },
      { name: "Timer", value: "Programmable" },
      { name: "Light Sensor", value: "Yes, Adjustable Sensitivity" },
      { name: "Material", value: "Aluminum and Weather-resistant Plastic" },
      { name: "Installation", value: "DIY with Included Hardware" },
      { name: "Warranty", value: "2 Years" },
    ],
    reviews: [],
  },
];

const reviews = [
  {
    rating: 5,
    comment:
      "Excellent birds, very healthy and exactly as described! The seller was professional and made sure they arrived safely.",
    userName: "Alice Brown",
    date: new Date("2024-12-10"),
  },
  {
    rating: 4,
    comment:
      "Good quality chickens, laying well. Shipping was a bit delayed but the seller kept me informed.",
    userName: "Bob Wilson",
    date: new Date("2025-01-15"),
  },
  {
    rating: 5,
    comment:
      "Best quail I've ever purchased. Will buy again! They started laying within a week of arrival.",
    userName: "David Lee",
    date: new Date("2025-02-05"),
  },
  {
    rating: 4,
    comment:
      "Healthy birds, good customer service. Would have given 5 stars but one bird wasn't as robust as the others.",
    userName: "Jennifer Williams",
    date: new Date("2025-01-28"),
  },
  {
    rating: 5,
    comment:
      "Amazing turkeys, perfect for our small farm. They've adapted well and are growing nicely.",
    userName: "Michael Chen",
    date: new Date("2024-12-22"),
  },
  {
    rating: 5,
    comment:
      "The automatic coop door works perfectly! Easy to install and very reliable. Battery lasts as promised.",
    userName: "Alice Brown",
    date: new Date("2025-03-01"),
  },
  {
    rating: 3,
    comment:
      "Chickens are healthy, but two were smaller than expected. Seller was responsive to my concerns.",
    userName: "David Lee",
    date: new Date("2025-02-18"),
  },
  {
    rating: 5,
    comment:
      "Fantastic feed! My hens love it and egg production has increased noticeably in just two weeks.",
    userName: "Jennifer Williams",
    date: new Date("2025-01-05"),
  },
  {
    rating: 4,
    comment:
      "The waterer system is well-made and easy to clean. One star off because assembly instructions were confusing.",
    userName: "Bob Wilson",
    date: new Date("2025-02-10"),
  },
  {
    rating: 5,
    comment:
      "Wyandottes are beautiful and friendly. They settled in quickly and are already laying consistently.",
    userName: "Michael Chen",
    date: new Date("2025-03-15"),
  },
];

const chatMessages = [
  // Conversation 1
  {
    content:
      "Hi, I'm interested in your Rhode Island Reds. Are they still available?",
    status: "READ",
    sender: "buyer",
  },
  {
    content:
      "Yes, they are! We have several 6-month-old hens ready to go. Would you like more information?",
    status: "READ",
    sender: "seller",
  },
  {
    content:
      "Great! What's their current egg production rate? And do you ship to Texas?",
    status: "READ",
    sender: "buyer",
  },
  {
    content:
      "They're laying about 5-6 eggs per week currently. Yes, we do ship to Texas! Shipping would be $45 with our specialized containers.",
    status: "READ",
    sender: "seller",
  },
  {
    content:
      "Perfect. I'm interested in 3 hens. Do you have a discount for multiple birds?",
    status: "READ",
    sender: "buyer",
  },

  // Conversation 2
  {
    content: "What's the current availability of the Bourbon Red Turkeys?",
    status: "READ",
    sender: "buyer",
  },
  {
    content:
      "We have 8 birds available right now. They're 5 months old and in excellent health.",
    status: "READ",
    sender: "seller",
  },
  {
    content:
      "I'm looking to start a small breeding flock. What's the gender ratio of the available birds?",
    status: "READ",
    sender: "buyer",
  },
  {
    content:
      "We have 5 females and 3 males available. For breeding, I'd recommend 1 tom with 3-4 hens for best results.",
    status: "READ",
    sender: "seller",
  },

  // Conversation 3
  {
    content:
      "Hello, I'm interested in the automatic chicken coop door. Does it work in very cold weather?",
    status: "READ",
    sender: "buyer",
  },
  {
    content:
      "Yes, it's been tested in temperatures down to -20°F. The solar panel charges even on cloudy days, and the battery backup lasts up to 7 days.",
    status: "READ",
    sender: "seller",
  },
  {
    content:
      "That's good to know. How difficult is the installation? I'm not very handy.",
    status: "READ",
    sender: "buyer",
  },
  {
    content:
      "Installation is straightforward - we include a step-by-step guide and all necessary hardware. Most customers complete it in 30-45 minutes. We also have installation videos on our website!",
    status: "READ",
    sender: "seller",
  },
  {
    content: "Sounds perfect. One more question - is there a warranty?",
    status: "READ",
    sender: "buyer",
  },

  // Conversation 4
  {
    content:
      "Hi there! Do the Wyandotte chickens do well in hot climates? I'm in Arizona.",
    status: "READ",
    sender: "buyer",
  },
  {
    content:
      "They can adapt to heat, but they'll need shade and plenty of fresh water. Their thick plumage makes them better suited for cooler climates, but many customers in warm areas have success with proper management.",
    status: "READ",
    sender: "seller",
  },
  {
    content:
      "Thanks for the honest answer. Would you recommend a more heat-tolerant breed for my area?",
    status: "READ",
    sender: "buyer",
  },
  {
    content:
      "For Arizona, I'd suggest Leghorns, Rhode Island Reds, or Australorps - they handle heat better. We have some excellent Rhode Island Reds available if you're interested!",
    status: "SENT",
    sender: "seller",
  },
];

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
    console.log("Cleared existing data");

    // Create users
    const createdUsers = await Promise.all(
      users.map(async (user) => {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(user.password, salt);
        return await User.create({ ...user, password: hashedPassword });
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
            reviews[Math.floor(Math.random() * reviews.length)];
          const buyer = buyers[Math.floor(Math.random() * buyers.length)];

          productReviews.push({
            rating: reviewTemplate.rating,
            comment: reviewTemplate.comment,
            user: buyer._id,
            userName: buyer.name,
            date: reviewTemplate.date,
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

      // Create order with calculated total
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
        shippingAddress: buyer.address,
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
        status: msg.status,
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
