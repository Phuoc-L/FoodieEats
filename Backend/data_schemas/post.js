const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    restaurant_id: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant", required: true },
    dish_id: { type: mongoose.Schema.Types.ObjectId, required: true },

    title: { type: String, required: true },
    description: { type: String, required: true },
    rating: { type: Number, required: true },
    image_url: { type: String, default: "" },

    date_posted: { type: Date, default: Date.now },
    like_list: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    num_likes: { type: Number, default: 0 },
    comments_list: [{ type: mongoose.Schema.Types.ObjectId, ref: "Comment" }],
    num_comments: { type: Number, default: 0 },
});

module.exports = mongoose.model("Post", postSchema, "posts");