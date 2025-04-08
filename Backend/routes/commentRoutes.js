const express = require("express");
const mongoose = require("mongoose");
const Post = require("../data_schemas/post");
const User = require("../data_schemas/users");
const Comment = require("../data_schemas/comment");
const router = express.Router();


// Middleware to verify comment ownership
const verifyCommentOwnership = async (req, res, next) => {
  try {
	const comment = await Comment.findById(req.params.comment_id);
	if (!comment) {
	  return res.status(404).json({ error: "Comment not found" });
	}
	if (comment.user_id.toString() !== req.params.user_id) {
	  return res.status(403).json({ error: "Unauthorized: User does not own this comment" });
	}
	req.comment = comment;
	next();
  } catch (error) {
	res.status(500).json({ error: "Error verifying comment ownership" });
  }
};

// Get all comments on a post
router.get("/:post_id/comments", async (req, res) => {
  try {
    const { post_id } = req.params;
    const post = await Post.findById(post_id);

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    const comments = await Comment.find({ _id: { $in: post.comment_list } })
      .populate("user_id", "username profile.avatar_url first_name last_name")
      .sort({ timestamp: 1 });

    res.status(200).send(comments);
  } catch (error) {
    console.error("Error fetching comments:", error);
    res.status(500).json({ error: "Error retrieving comments" });
  }
});

// Add a comment to a post
router.post("/:post_id/comment/:user_id", async (req, res) => {
  try {
    const { post_id, user_id } = req.params;
    const { comment } = req.body;

    const post = await Post.findById(post_id);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    const newComment = new Comment({ post_id, user_id, comment });
    await newComment.save();

    post.comment_list.push(newComment._id);
    post.num_comments += 1;
    await post.save();

    const commentWithUser = await Comment.findById(newComment._id)
        .populate("user_id", "username profile.avatar_url first_name last_name");

    res.status(201).json({ message: "Comment added successfully", comment: commentWithUser });
  } catch (error) {
    console.error("Error adding comment to post:", error)
    res.status(500).json({ error: "Error adding comment to post", details: error.message })
  }
})

// Delete comment
router.delete("/:post_id/comment/:comment_id/user/:user_id", verifyCommentOwnership, async (req, res) => {
  try {
	const { post_id, comment_id, user_id } = req.params;

	// Delete comment object
	const deletedComment = await Comment.findByIdAndDelete(comment_id)
	if (!deletedComment) {
	  res.status(404).json({ error: "Could not find comment" });
	}

	// Remove comment from post
	const updatedPost = await Post.findByIdAndUpdate(
	  post_id,
	  {
	    $pull: { comment_list: comment_id },
	    $inc: { num_comments: -1 }
	  },
	  { new: true } // Return the updated document
	);

    if (!updatedPost) {
      return res.status(404).json({ error: "Post not found" });
    }

	res.status(200).json({ message: "Comment deleted successfully" });
  } catch (error) {
	console.error("Delete comment error:", error);
	res.status(500).json({ error: "Error deleting comment", details: error.message });
  }
});

// Like or unlike a comment
router.post("/:comment_id/like/:user_id", async (req, res) => {
  try {
	const { comment_id, user_id } = req.params;
	const comment = await Comment.findById(comment_id);

	if (!comment) {
	  return res.status(404).json({ error: "Comment not found" });
	}

	const userIndex = comment.like_list.indexOf(user_id);

	if (userIndex === -1) {
	  // User hasn't liked -> Add like
	  comment.like_list.push(user_id);
	  comment.num_likes += 1;
	} else {
	  // User has liked -> Remove like
	  comment.like_list.splice(userIndex, 1);
	  comment.num_likes -= 1;
	}

	await comment.save();
	res.status(200).json({ message: "Like updated", comment });
  } catch (error) {
	res.status(500).json({ error: "Error updating like", details: error.message });
  }
});


module.exports = router;
