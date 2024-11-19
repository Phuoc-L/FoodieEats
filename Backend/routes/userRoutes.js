const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const router = express.Router();
const User = require("../data_schemas/users");

// -----------------------------------------
// User Authentication
// -----------------------------------------

router.post("/signup", async (req, res) => {
  try {
    const { password, ...userData } = req.body;
    const hashedPassword = await hashPassword(password);
    const newUser = new User({ ...userData, password: hashedPassword });
    await newUser.save();

    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
    res.status(201).json({ user: newUser, token });
  } catch (error) {
    if (error.code === 11000) {
      // Duplicate key error
      const duplicateField = Object.keys(error.keyPattern)[0];
      res.status(400).json({ error: `The ${duplicateField} '${error.keyValue[duplicateField]}' is already in use.` });
    } else {
      console.error("Signup error:", error);
      res.status(400).json({ error: "Error signing up" });
    }
  }
});

router.post("/login", async (req, res) => {
  try {
    console.log("Login request received:", req.body);  // Log incoming request data
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      console.log("User not found");
      return res.status(400).json({ error: "Invalid email or password" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      console.log("Password mismatch");
      return res.status(400).json({ error: "Invalid email or password" });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
    console.log("Login successful");
    res.json({ user, token });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Error logging in" });
  }
});

// -----------------------------------------
// Backend Middleware
// -----------------------------------------

const verifyToken = (req, res, next) => {
  try {
    // Better token extraction
    const authHeader = req.headers["authorization"];
    if (!authHeader) {
      return res.status(403).json({ error: "No authorization header provided" });
    }

    const token = authHeader.startsWith("Bearer ") 
      ? authHeader.slice(7) 
      : authHeader;

    if (!token) {
      return res.status(403).json({ error: "No token provided" });
    }

    // More detailed error handling in verification
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        if (err.name === "TokenExpiredError") {
          return res.status(401).json({ 
            error: "Token expired", 
            expiredAt: err.expiredAt 
          });
        }
        if (err.name === "JsonWebTokenError") {
          return res.status(401).json({ 
            error: "Invalid token",
            details: err.message 
          });
        }
        return res.status(500).json({ 
          error: "Failed to authenticate token",
          details: err.message 
        });
      }
      
      req.userId = decoded.id;
      next();
    });
  } catch (error) {
    console.error("Token verification error:", error);
    return res.status(500).json({ 
      error: "Internal server error during authentication",
      details: error.message 
    });
  }
};

// -----------------------------------------
// Basic User CRUD
// -----------------------------------------

// Create a new user
router.post("/", async (req, res) => {
  try {
    const newUser = new User(req.body);
    newUser.password = await hashPassword(newUser.password);
    await newUser.save();
    res.status(201).json(newUser);
  } catch (error) {
    res.status(400).json({ error: "Error creating new user" });
  }
});

// Get all users
router.get("/users", async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: "Error getting all users" });
  }
});

// Get a user by ID
router.get("/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: "Error getting user by ID" });
  }
});

// Update a user by ID
router.put("/:id", async (req, res) => {
  try {
    const updatedUser = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!updatedUser) return res.status(404).json({ error: "User not found" });
    res.json(updatedUser);
  } catch (error) {
    res.status(400).json({ error: "Error updating user by ID" });
  }
});

// Delete a user by ID
router.delete("/:id", async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id);
    if (!deletedUser) return res.status(404).json({ error: "User not found" });
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Error deleting user by ID" });
  }
});

// -----------------------------------------
// Followers and Followings
// -----------------------------------------

// Add a follower to a user by ID
router.post("/:id/followers", async (req, res) => {
  try {
    // add follower to user
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    user.followers.push(req.body.follower_id);
    await user.save();

    // add user to follower's following list
    const follower = await User.findById(req.body.follower_id);
    if (!follower) return res.status(404).json({ error: "Follower not found" });
    follower.following.push(req.params.id);
    await follower.save();

    res.json({user, follower});
  } catch (error) {
    res.status(400).json({ error: "Error adding follower to user" });
  }
});

// Remove a follower from a user by ID
router.delete("/:id/followers", async (req, res) => {
  try {
    // remove follower from user
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    user.followers = user.followers.filter(
      (follower) => follower != req.body.follower_id
    );
    await user.save();

    // remove user from follower's following list
    const follower = await User.findById(req.body.follower_id);
    if (!follower) return res.status(404).json({ error: "Follower not found" });
    follower.following = follower.following.filter(
      (following) => following != req.params.id
    );
    await follower.save();

    res.json({user, follower});
  } catch (error) {
    res.status(400).json({ error: "Error removing follower from user" });
  }
});

// -----------------------------------------
// Helper Functions
// -----------------------------------------

// function to hash password
async function hashPassword(password) {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

module.exports = router;
