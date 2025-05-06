const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const RestaurantOwner = require("../data_schemas/restaurant_owner");
const Restaurant = require("../data_schemas/restaurant");
// Correct the path to secrets.ini relative to the Backend directory
require("dotenv").config({ path: require('path').resolve(__dirname, '../secrets.ini') });


const router = express.Router();

// Helper function to hash password
async function hashPassword(password) {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

// --- Restaurant Owner Signup ---
router.post("/signup", async (req, res) => {
  try {
    const { password, email, username, first_name, last_name, ...otherOwnerData } = req.body;

    // Validate required owner data
    if (!email || !username || !first_name || !last_name || !password) {
        return res.status(400).json({ error: "Missing required owner information (email, username, first/last name, password)." });
    }

    const hashedPassword = await hashPassword(password);
    let createdRestaurantId = null;

    // 1. Create placeholder Restaurant document first
    try {
      const newRestaurant = new Restaurant({
        name: `Restaurant for ${username} (Pending Setup)`,
        location: "Pending Setup", // Placeholder
        operating_hours: "Mon-Sun: 9 AM - 9 PM", // Placeholder
        contact_info: {
          phone: "000-000-0000", // Placeholder
          email: email // Use owner's email as placeholder for restaurant contact
        },
        coordinates: {
          latitude: 0.0, // Placeholder
          longitude: 0.0 // Placeholder
        },
        // average_rating, reviews, num_reviews, menu will use schema defaults
      });
      const savedRestaurant = await newRestaurant.save();
      createdRestaurantId = savedRestaurant._id;
      console.log(`Created placeholder restaurant with ID: ${createdRestaurantId} for owner ${username}`);
    } catch (restaurantError) {
      console.error("Error creating placeholder restaurant during owner signup:", restaurantError);
      return res.status(500).json({ error: "Failed to create associated restaurant profile." });
    }

    // 2. Create the RestaurantOwner document
    const newOwner = new RestaurantOwner({
      first_name,
      last_name,
      username,
      email,
      password: hashedPassword,
      restaurant_id: createdRestaurantId, // Link to the created restaurant
      ...otherOwnerData // Include any other fields passed
    });
    await newOwner.save();

    res.status(201).json({ message: "Restaurant owner account created successfully. Please log in." });

  } catch (error) {
    if (error.code === 11000) { // Duplicate key error
      const duplicateField = Object.keys(error.keyPattern)[0];
      console.error(`Duplicate key error for ${duplicateField} during owner signup.`);
      // Attempt to delete the orphaned restaurant if owner creation failed
      if (createdRestaurantId) {
        await Restaurant.findByIdAndDelete(createdRestaurantId);
        console.log(`Cleaned up orphaned restaurant: ${createdRestaurantId}`);
      }
      return res.status(400).json({ error: `The ${duplicateField} '${error.keyValue[duplicateField]}' is already in use.` });
    } else {
      console.error("Owner signup error:", error);
      if (createdRestaurantId) {
        await Restaurant.findByIdAndDelete(createdRestaurantId);
         console.log(`Cleaned up orphaned restaurant due to other error: ${createdRestaurantId}`);
      }
      return res.status(400).json({ error: "Error signing up restaurant owner." });
    }
  }
});

// --- Restaurant Owner Login ---
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required." });
    }

    const owner = await RestaurantOwner.findOne({ email });
    if (!owner) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const isPasswordValid = await bcrypt.compare(password, owner.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const tokenPayload = { id: owner._id, type: 'owner' }; 
    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: "1h" });

    const ownerResponse = owner.toObject();
    delete ownerResponse.password;

    res.json({ owner: ownerResponse, token });

  } catch (error) {
    console.error("Owner login error:", error);
    res.status(500).json({ error: "Error logging in restaurant owner." });
  }
});

module.exports = router;
