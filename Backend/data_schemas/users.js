const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  first_name: { type: String, required: true },
  last_name: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },

  profile: {
    avatar_url: { type: String, default: "" }, // URL to the user's avatar image
    bio: { type: String, default: "" }, // Short biography or description
  },

  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // List of user IDs who follow this user
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // List of user IDs this user is following
  collections: { type: Array, default: [] }, // No uses for now
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "Post" }], // List of IDs of posts liked by the user

  privacy_settings: {
    message_privacy: { type: Boolean, default: true },    // True if user can receive messages
    post_visibility: { type: Boolean, default: true },    // True if user's posts are public
    profile_visibility: { type: Boolean, default: true }, // True if user's profile is public
  },
});

module.exports = mongoose.model("User", userSchema, "users");
