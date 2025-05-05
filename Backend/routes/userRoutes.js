const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../data_schemas/users");
const Restaurant = require("../data_schemas/restaurant"); // Import Restaurant model

const Post = require("../data_schemas/post");
const getPresignedURL = require("../functions/s3PresignedURL.js");
require("dotenv").config({ path: "secrets.ini" });
const router = express.Router();

// -----------------------------------------
// User Authentication
// -----------------------------------------

router.post("/signup", async (req, res) => {
  try {
    const { password, isOwner, ...userData } = req.body; // Extract isOwner flag
    const hashedPassword = await hashPassword(password);
    let ownedRestaurantId = null;

    // If signing up as an owner, create a placeholder restaurant first
    if (isOwner) {
      try {
        const newRestaurant = new Restaurant({
          name: `Restaurant for ${userData.username}`,
          location: "Pending Setup",
          operating_hours: "Pending Setup",
          contact_info: {
            phone: "000-000-0000",
            email: "pending@setup.com",
          },
          coordinates: {
            latitude: 0,
            longitude: 0,
          },
          menu: [], // Start with an empty menu
        });
        const savedRestaurant = await newRestaurant.save();
        ownedRestaurantId = savedRestaurant._id;
        console.log(`Created placeholder restaurant with ID: ${ownedRestaurantId}`);
      } catch (restaurantError) {
        console.error("Error creating placeholder restaurant:", restaurantError);
        // Decide how to handle this error - perhaps prevent user signup?
        return res.status(500).json({ error: "Failed to create associated restaurant profile." });
      }
    }


    const newUser = new User({
      ...userData,
      password: hashedPassword,
      isOwner: isOwner || false, // Ensure isOwner is set
      ownedRestaurantId: ownedRestaurantId // Will be null if not an owner
    });
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
// User Search And Filter
// -----------------------------------------

router.get('/search', async (req, res) => {
  try {
    const { query, sortBy, sortOrder, minFollowers, maxFollowers, minPosts, maxPosts, showPrivate } = req.query;

    console.log("user route: ", req.query);

    if (!query) {
      const sortOptions = {};
      if (sortBy) {
        sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
      }
      else {
        sortOptions['followers_count'] = -1;
      }
      // if no query return all users with most followers
      const users = await User.find({ 'privacy_settings.profile_visibility': true }).sort(sortOptions);
      return res.status(200).json({ total: users.length, users });
    }

    const filter = {
      $and: [
        {
          $or: [
            { first_name: { $regex: query, $options: 'i' } },
            { last_name: { $regex: query, $options: 'i' } },
            { username: { $regex: query, $options: 'i' } },
            { email: { $regex: query, $options: 'i' } },
            { 'profile.bio': { $regex: query, $options: 'i' } }
          ]
        },
        showPrivate === 'true' ? {} : { 'privacy_settings.profile_visibility': true }
      ]
    };

    // Add range filters
    if (minFollowers || maxFollowers) {
      filter.$and.push({
        followers_count: {
          ...(minFollowers ? { $gte: parseInt(minFollowers) } : {}),
          ...(maxFollowers ? { $lte: parseInt(maxFollowers) } : {})
        }
      });
    }

    if (minPosts || maxPosts) {
      filter.$and.push({
        posts_count: {
          ...(minPosts ? { $gte: parseInt(minPosts) } : {}),
          ...(maxPosts ? { $lte: parseInt(maxPosts) } : {})
        }
      });
    }

    // Build sort options
    const sortOptions = {};
    if (sortBy) {
      sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
    }

    const users = await User.find(filter).sort(sortOptions);

    res.status(200).json({ total: users.length, users });

  } catch (err) {
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});


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
router.post("/:user_id", async (req, res) => {
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
    // update post's like list and count
    await Post.findOneAndUpdate(
      { _id: post._id },
      { $push: { like_list: user._id }, $inc: { num_likes: 1 } }
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
    // update post's like list and count
    await Post.findOneAndUpdate(
      { _id: post._id },
      { $pull: { like_list: user._id }, $inc: { num_likes: -1 } }
    );
    res.status(200).json({ message: "User successfully unliked the post", user: updated });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error processing unlike request" });
  }
});

// -----------------------------------------
// User Profile 
// -----------------------------------------

// Get user profile picture
router.get("/:user_id/profile", async (req, res) => {
  try {
    // Find the user
    const user = await User.findById(req.params.user_id);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.status(200).json({ avatar_url: user.profile.avatar_url });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error getting profile picture" });
  }
});

// upload user profile picture
router.post("/:user_id/profilePicture", async (req, res) => {
  try {
    // Find the user
    const user = await User.findById(req.params.user_id);
    if (!user) return res.status(404).json({ error: "User not found" });
    // Get the file name and file type
    const { fileName, fileType } = req.body;
    const uploadDir = "profile_pictures";
    // Get the presigned URL
    const presignedURL = await getPresignedURL(fileName, fileType, uploadDir);
    console.log(presignedURL);
    if (presignedURL.error !== '') {
      res.status(409).json({ error: "Error generating pre-signed URL" });
      return;
    };
    // update user with the profile picture url - use the correct S3 URL format without region in the hostname
    const image_url = "https://" + process.env.BUCKET_NAME + ".s3.amazonaws.com/" + uploadDir + "/" + fileName;
    user.profile.avatar_url = image_url;
    await user.save();
    res.status(200).json({ image_url });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error uploading profile picture" });
  }
});

// Update a user's username
router.post("/:user_id/username/:newUserName", async (req, res) => {
  try {
    // Find the user
    let user = await User.findById(req.params.user_id);
    if (!user) return res.status(404).json({ error: "User not found" });
    // Get updated username
    const newUsername = req.params.newUserName;
    console.log(newUsername);
    // Update user's name
    user.username = newUsername;
    await user.save();
    res.status(200).json({message: "User's username successfully updated" });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: "Error updating user's username" });
  }
});

// Update a user's first name
router.post("/:user_id/first_name/:newName", async (req, res) => {
  try {
    // Find the user
    let user = await User.findById(req.params.user_id);
    if (!user) return res.status(404).json({ error: "User not found" });
    // Get updated name
    const newName = req.params.newName;
    console.log(newName);
    // Update user's name
    user.first_name = newName;
    await user.save();
    res.status(200).json({message: "User's first name successfully updated" });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: "Error updating user's first name" });
  }
});

// Update a user's last name
router.post("/:user_id/last_name/:newName", async (req, res) => {
  try {
    // Find the user
    let user = await User.findById(req.params.user_id);
    if (!user) return res.status(404).json({ error: "User not found" });
    // Get updated name
    const newName = req.params.newName;
    console.log(newName);
    // Update user's name
    user.last_name = newName;
    await user.save();
    res.status(200).json({message: "User's last name successfully updated" });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: "Error updating user's last name" });
  }
});


// Update user's profile description
router.post("/:user_id/bio/:newBio", async (req, res) => {
  try {
    // Find the user
    let user = await User.findById(req.params.user_id);
    if (!user) return res.status(404).json({ error: "User not found" });
    // Get updated description
    const newBio = req.params.newBio;
    console.log(newBio);
    // Update user's description
    user.profile.bio = newBio;
    await user.save();
    res.status(200).json({message: "User's profile description successfully updated" });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: "Error updating user's profile description" });
  }
});

// Update user's post visibility setting
router.post("/:user_id/privacy/post_visibility", async (req, res) => {
  try {
    // Find the user
    const user = await User.findById(req.params.user_id);
    if (!user) return res.status(404).json({ error: "User not found" });

    // Get the new visibility setting from the request body
    const { post_visibility } = req.body;
    if (typeof post_visibility !== 'boolean') {
      return res.status(400).json({ error: "Invalid value for post_visibility. Must be true or false." });
    }

    // Update the user's privacy setting
    user.privacy_settings.post_visibility = post_visibility;
    await user.save();

    res.status(200).json({ message: "User's post visibility successfully updated", post_visibility: user.privacy_settings.post_visibility });
  } catch (error) {
    console.error("Error updating post visibility:", error);
    res.status(500).json({ error: "Error updating user's post visibility setting" });
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
