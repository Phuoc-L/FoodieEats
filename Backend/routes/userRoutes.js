const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const User = require("../data_schemas/users");
const router = express.Router();

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

    res.json({ user, follower });
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

    res.json({ user, follower });
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
