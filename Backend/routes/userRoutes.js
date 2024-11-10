const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const User = require("../data_schemas/users");
const Post = require("../data_schemas/post");
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
    // Remove the password from the response
    const { password, ...userWithoutPassword } = newUser.toObject();
    res.status(201).json({ message: "User created successfully", user: userWithoutPassword });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: "Error creating new user" });
  }
});

// Get all users
router.get("/users", async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error getting all users" });
  }
});

// Get a user by ID
router.get("/:user_id", async (req, res) => {
  try {
    const user = await User.findById(req.params.user_id);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error getting user by ID" });
  }
});

// Update a user by ID
router.put("/:user_id", async (req, res) => {
  try {
    // check if user exists
    let updatedUser = await User.findById(req.params.user_id);
    if (!updatedUser) return res.status(404).json({ error: "User not found" });

    updatedUser = await User.findByIdAndUpdate(req.params.user_id, req.body);
    res.status(200).json({message: "User successfully updated", user: updatedUser });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: "Error updating user by ID" });
  }
});

// Delete a user by ID
router.delete("/:user_id", async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.user_id);
    if (!deletedUser) return res.status(404).json({ error: "User not found" });
    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error deleting user by ID" });
  }
});

// -----------------------------------------
// Followers and Followings
// -----------------------------------------

// Follow: User A follows User B
router.post("/:userA_id/follow/:userB_id", async (req, res) => {
  try {
    // Find user A (the follower) and user B (the user to be followed)
    let userA = await User.findById(req.params.userA_id);
    if (!userA) return res.status(404).json({ error: "User not found" });

    let userB = await User.findById(req.params.userB_id);
    if (!userB)
      return res.status(404).json({ error: "User to follow not found" });

    // Check if user A is already following user B
    if (userA.following.includes(req.params.userB_id)) {
      return res.status(400).json({ error: "User is already following" });
    }

    // Update user A's following list and count
    userA = await User.findOneAndUpdate(
      { _id: userA._id },
      {
        $push: { following: userB._id },
        $inc: { following_count: 1 },
      },
      { new: true }
    );

    // Update user B's followers list and count
    userB = await User.findOneAndUpdate(
      { _id: userB._id },
      {
        $push: { followers: userA._id },
        $inc: { followers_count: 1 },
      },
      { new: true }
    );

    // Respond with the updated userA and userB data
    res.status(200).json({ message: "User successfully follow another user", UserA: userA, UserB: userB });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error processing follow request" });
  }
});

// Unfollow: User A unfollows User B
router.delete("/:userA_id/unfollow/:userB_id", async (req, res) => {
  try {
    // Find user A (the follower) and user B (the user to be unfollowed)
    let userA = await User.findById(req.params.userA_id);
    if (!userA) return res.status(404).json({ error: "User not found" });

    let userB = await User.findById(req.params.userB_id);
    if (!userB) return res.status(404).json({ error: "User to unfollow not found" });

    // Check if user A is not following user B
    if (!userA.following.includes(req.params.userB_id)) {
      return res.status(400).json({ error: "User is not following" });
    }

    // Remove user B from user A's following list and decrement following count
    userA = await User.findOneAndUpdate(
      { _id: userA._id },
      {
        $pull: { following: userB._id },
        $inc: { following_count: -1 },
      },
      { new: true }
    );

    // Remove user A from user B's followers list and decrement followers count
    userB = await User.findOneAndUpdate(
      { _id: userB._id },
      {
        $pull: { followers: userA._id },
        $inc: { followers_count: -1 },
      },
      { new: true }
    );

    // Respond with the updated userA and userB data
    res.status(200).json({ message: "User successfully unfollow another user", UserA: userA, UserB: userB });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error processing unfollow request" });
  }
});

// -----------------------------------------
// Likes and Unlike
// -----------------------------------------

// Like: User likes a Post
router.post("/:user_id/like/:post_id", async (req, res) => {
  try {
    // Find the user and post
    const user = await User.findById(req.params.user_id);
    if (!user) return res.status(404).json({ error: "User not found" });
    const post = await Post.findById(req.params.post_id);
    if (!post) return res.status(404).json({ error: "Post not found" });

    // Check if post is already liked by the user
    if (user.likes.includes(req.params.post_id)) {
      return res.status(400).json({ error: "User already liked this post" });
    }

    // Check if post is made by the user
    if (user._id.equals(post.user_id)) {
      return res.status(400).json({ error: "User cannot like own post" });
    }

    // Update user's likes list
    const updated = await User.findOneAndUpdate(
      { _id: user._id },
      { $push: { likes: post._id } },
      { new: true }
    );
    res.status(200).json({ message: "User successfully liked the post", user: updated });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error processing like request" });
  }
});

// Unlike: User unlikes a Post
router.post("/:user_id/unlike/:post_id", async (req, res) => {
  try {
    // Find the user and post
    const user = await User.findById(req.params.user_id);
    if (!user) return res.status(404).json({ error: "User not found" });
    const post = await Post.findById(req.params.post_id);
    if (!post) return res.status(404).json({ error: "Post not found" });

    // Check if post is not liked by the user
    if (!user.likes.includes(req.params.post_id)) {
      return res.status(400).json({ error: "User has not liked this post" });
    }

    // Update user's likes list
    const updated = await User.findOneAndUpdate(
      { _id: user._id },
      { $pull: { likes: post._id } },
      { new: true }
    );
    res.status(200).json({ message: "User successfully unliked the post", user: updated });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error processing unlike request" });
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
