const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
{
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    restaurant_id: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant", required: true },
    dish_id: { type: mongoose.Schema.Types.ObjectId, required: true },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    media_url: { type: String, default: "" },
    timestamp: { type: Date, default: Date.now },

    like_list: [ mongoose.Schema.Types.ObjectId ],
    num_like: { type: Number, default: 0 },

    comment_list: [{ type: mongoose.Schema.Types.ObjectId, ref: "Comment" }],
    num_comments: { type: Number, default: 0 },

    ratings: { type: Number, required: true },
});

module.exports = mongoose.model("Post", postSchema, "posts");
