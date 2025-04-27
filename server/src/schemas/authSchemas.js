const Joi = require("joi");

// Custom password validation pattern
const passwordPattern =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;

// Common address schema
const addressSchema = Joi.object({
  street: Joi.string().trim().max(100),
  city: Joi.string().trim().max(50),
  state: Joi.string().trim().max(50),
  zipCode: Joi.string().trim().max(10),
  country: Joi.string().trim().max(50),
});

// Registration schema
const registerSchema = Joi.object({
  name: Joi.string().trim().min(2).max(50).required().messages({
    "string.empty": "Name is required",
    "string.min": "Name must be at least 2 characters long",
    "string.max": "Name cannot exceed 50 characters",
  }),
  email: Joi.string().email().trim().required().messages({
    "string.email": "Please provide a valid email address",
    "string.empty": "Email is required",
  }),
  password: Joi.string().pattern(passwordPattern).required().messages({
    "string.pattern.base":
      "Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number and one special character",
    "string.empty": "Password is required",
  }),
  isSeller: Joi.boolean(),
  sellerProfile: Joi.when("isSeller", {
    is: true,
    then: Joi.object({
      businessName: Joi.string().trim().min(2).max(100).required(),
      description: Joi.string().trim().max(1000),
      address: addressSchema.required(),
      phone: Joi.string().trim().max(20).required(),
    }),
  }),
});

// Login schema
const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.email": "Please provide a valid email address",
    "string.empty": "Email is required",
  }),
  password: Joi.string().required().messages({
    "string.empty": "Password is required",
  }),
});

// Update profile schema
const updateProfileSchema = Joi.object({
  name: Joi.string().trim().min(2).max(50).messages({
    "string.min": "Name must be at least 2 characters long",
    "string.max": "Name cannot exceed 50 characters",
  }),
  email: Joi.string().email().trim().messages({
    "string.email": "Please provide a valid email address",
  }),
  password: Joi.string().pattern(passwordPattern).messages({
    "string.pattern.base":
      "Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number and one special character",
  }),
})
  .min(1)
  .messages({
    "object.min": "At least one field must be provided for update",
  });

// Seller profile schema
const sellerProfileSchema = Joi.object({
  businessName: Joi.string().trim().min(2).max(100).required(),
  description: Joi.string().trim().max(1000),
  address: addressSchema.required(),
  phone: Joi.string().trim().max(20).required(),
}).messages({
  "object.base": "Seller profile data must be an object",
});

// Review schema
const reviewSchema = Joi.object({
  rating: Joi.number().min(1).max(5).required().messages({
    "number.base": "Rating must be a number",
    "number.min": "Rating must be at least 1",
    "number.max": "Rating cannot exceed 5",
    "any.required": "Rating is required",
  }),
  comment: Joi.string().trim().min(10).max(500).required().messages({
    "string.empty": "Review comment is required",
    "string.min": "Review comment must be at least 10 characters long",
    "string.max": "Review comment cannot exceed 500 characters",
  }),
});

module.exports = {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  sellerProfileSchema,
  reviewSchema,
};
