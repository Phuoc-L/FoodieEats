const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema({

    post_id: { type: mongoose.Schema.Types.ObjectId, ref: "Post", required: true },
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    comment: { type: String, required: true },

    date_posted: { type: Date, default: Date.now },
    like_list: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    num_likes: { type: Number, default: 0 },
});

module.exports = mongoose.model("Comment", commentSchema, "comments");