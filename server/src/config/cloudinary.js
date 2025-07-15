const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");

// Enhanced error handling for Cloudinary configuration
const validateCloudinaryConfig = () => {
  const missingVars = [];

  if (!process.env.CLOUDINARY_CLOUD_NAME)
    missingVars.push("CLOUDINARY_CLOUD_NAME");
  if (!process.env.CLOUDINARY_API_KEY) missingVars.push("CLOUDINARY_API_KEY");
  if (!process.env.CLOUDINARY_API_SECRET)
    missingVars.push("CLOUDINARY_API_SECRET");

  if (missingVars.length > 0) {
    console.error(
      `Missing Cloudinary configuration: ${missingVars.join(", ")}`
    );
    console.error(
      "Please set these environment variables in your Render.com dashboard"
    );

    // In production, don't exit the process as it will cause the deployment to fail
    // Instead, we'll log errors but continue - this allows the API to start even if uploads won't work
    if (process.env.NODE_ENV !== "production") {
      process.exit(1);
    }
    return false;
  }
  return true;
};

const isConfigValid = validateCloudinaryConfig();

// Only configure Cloudinary if config is valid
if (isConfigValid) {
  console.log("Initializing Cloudinary with config:", {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: "***", // Don't log the actual secret
  });

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

// Create storage even if config isn't valid - it will just fail gracefully later
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "poultrymart/products",
    allowed_formats: ["jpg", "jpeg", "png", "gif"],
    transformation: [{ width: 1000, height: 1000, crop: "limit" }],
  },
});

// Ads storage configuration
const adsStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "poultrymart/ads",
    allowed_formats: ["jpg", "jpeg", "png", "gif", "webp"],
    transformation: [{ width: 1200, height: 800, crop: "limit", quality: "auto" }],
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    try {
      console.log("Processing file:", file.originalname);
      if (file.mimetype.startsWith("image/")) {
        cb(null, true);
      } else {
        console.error("Invalid file type:", file.mimetype);
        cb(new Error("Not an image! Please upload only images."), false);
      }
    } catch (error) {
      console.error("Error in file upload filter:", error);
      cb(new Error("Error processing upload"), false);
    }
  },
});

// Ads upload configuration
const uploadAds = multer({
  storage: adsStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit for ads
  },
  fileFilter: (req, file, cb) => {
    try {
      console.log("Processing ad image:", file.originalname);
      if (file.mimetype.startsWith("image/")) {
        cb(null, true);
      } else {
        console.error("Invalid file type for ad:", file.mimetype);
        cb(new Error("Not an image! Please upload only images."), false);
      }
    } catch (error) {
      console.error("Error in ad file upload filter:", error);
      cb(new Error("Error processing ad upload"), false);
    }
  },
});

// Function to upload buffer to Cloudinary
const uploadToCloudinary = (buffer, options = {}) => {
  return new Promise((resolve, reject) => {
    if (!isConfigValid) {
      reject(new Error("Cloudinary not configured"));
      return;
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: "image",
        ...options,
      },
      (error, result) => {
        if (error) {
          console.error("Cloudinary upload error:", error);
          reject(error);
        } else {
          resolve(result);
        }
      }
    );

    uploadStream.end(buffer);
  });
};

module.exports = {
  cloudinary,
  upload,
  uploadAds,
  uploadToCloudinary,
  isCloudinaryConfigured: isConfigValid,
};
