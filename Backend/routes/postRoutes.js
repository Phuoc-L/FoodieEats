const express = require("express");
const mongoose = require("mongoose");
const Post = require("../data_schemas/post");
const User = require("../data_schemas/users");
const Restaurant = require("../data_schemas/restaurant");
const getPresignedURL = require("../functions/s3PresignedURL.js");
const router = express.Router();

// Middleware to verify post ownership
const verifyPostOwnership = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.post_id);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }
    if (post.user_id.toString() !== req.params.user_id) {
      return res.status(403).json({ error: "Unauthorized: User does not own this post" });
    }
    req.post = post;
    next();
  } catch (error) {
    res.status(500).json({ error: "Error verifying post ownership" });
  }
};

// Search for posts with filtering and sorting
router.get('/search', async (req, res) => {
  try {
    const { query, sortBy, sortOrder, minLikes, maxLikes, minComments, maxComments, minRating, maxRating, startDate, endDate } = req.query;

    console.log("posts route: ", req.query);

    // if no query, return posts by most likes
    if (!query) {
      const sortOptions = {};
      if (sortBy) {
        sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
      } else {
        sortOptions.timestamp = -1; // Default sort by latest posts
      }
      const posts = await Post.find().sort(sortOptions)
      .populate({
        path: 'user_id',
        match: { 
          'privacy_settings.profile_visibility': true, 
          'privacy_settings.post_visibility': true 
        }
      })
      .populate('restaurant_id');
      return res.status(200).json({ total: posts.length, posts });
    }

    const filter = {
      $and: []
    };

    if (query) {
      filter.$and.push({
        $or: [
          { title: { $regex: query, $options: 'i' } },
          { description: { $regex: query, $options: 'i' } }
        ]
      });
    }

    // Add range filters
    if (minLikes || maxLikes) {
      filter.$and.push({
        num_like: {
          ...(minLikes ? { $gte: parseInt(minLikes) } : {}),
          ...(maxLikes ? { $lte: parseInt(maxLikes) } : {})
        }
      });
    }

    if (minComments || maxComments) {
      filter.$and.push({
        num_comments: {
          ...(minComments ? { $gte: parseInt(minComments) } : {}),
          ...(maxComments ? { $lte: parseInt(maxComments) } : {})
        }
      });
    }

    if (minRating || maxRating) {
      filter.$and.push({
        ratings: {
          ...(minRating ? { $gte: parseFloat(minRating) } : {}),
          ...(maxRating ? { $lte: parseFloat(maxRating) } : {})
        }
      });
    }

    if (startDate || endDate) {
      filter.$and.push({
        timestamp: {
          ...(startDate ? { $gte: new Date(startDate) } : {}),
          ...(endDate ? { $lte: new Date(endDate) } : {})
        }
      });
    }

    if (filter.$and.length === 0) {
      delete filter.$and;
    }

    // Build sort options
    const sortOptions = {};
    if (sortBy) {
      sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
    } else {
      sortOptions.timestamp = -1; // Default sort by latest posts
    }

    const posts = await Post.find(filter).sort(sortOptions)
    .populate({
      path: 'user_id',
      match: { 
        'privacy_settings.profile_visibility': true, 
        'privacy_settings.post_visibility': true 
      }
    })
    .populate('restaurant_id');

    res.status(200).json({ total: posts.length, posts });

  } catch (err) {
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});


// Create a new post
router.post("/:user_id/create", async (req, res) => {
  try {
    const { restaurant_id, dish_id, title, description, ratings } = req.body;
    
    // Validate user exists
    const user = await User.findById(req.params.user_id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Create new post
    const newPost = new Post({
      user_id: req.params.user_id,
      restaurant_id,
      dish_id,
      title,
      description,
      ratings
    });

    // Save post
    await newPost.save();

    // Update user's posts array and count
    await User.findByIdAndUpdate(req.params.user_id, {
      $push: { posts: newPost._id },
      $inc: { posts_count: 1 }
    });

    res.status(201).json({ 
      message: "Post created successfully", 
      post: newPost 
    });
  } catch (error) {
    console.error("Create post error:", error);
    res.status(500).json({ 
      error: "Error creating post",
      details: error.message 
    });
  }
});

// Upload post image
router.post("/:user_id/posts/:post_id/image", verifyPostOwnership, async (req, res) => {
  try {
    const { fileName, fileType } = req.body;
    const uploadDir = "post_images";

    // Get presigned URL from S3
    const presignedURL = await getPresignedURL(fileName, fileType, uploadDir);
    
    // Generate the final image URL - use the correct S3 URL format without region in the hostname
    const image_url = `https://${process.env.BUCKET_NAME}.s3.amazonaws.com/${uploadDir}/${fileName}`;
    
    // Update post with image URL
    req.post.media_url = image_url;
    await req.post.save();
    console.log("Generated image URL:", image_url);
    res.status(200).json({ 
      presignedURL,
      image_url 
    });
  } catch (error) {
    console.error("Upload image error:", error);
    res.status(500).json({ 
      error: "Error uploading image",
      details: error.message 
    });
  }
});

// Get user's posts
router.get("/:user_id/posts", async (req, res) => {
  try {
    const posts = await Post.find({ user_id: req.params.user_id })
      .sort({ timestamp: -1 });
    res.status(200).json(posts);
  } catch (error) {
    console.error("Get posts error:", error);
    res.status(500).json({ 
      error: "Error retrieving posts",
      details: error.message 
    });
  }
});

// Get specific post
router.get("/:user_id/posts/:post_id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.post_id);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }
    res.status(200).json(post);
  } catch (error) {
    console.error("Get post error:", error);
    res.status(500).json({ 
      error: "Error retrieving post",
      details: error.message 
    });
  }
});

// Update post
router.put("/:user_id/posts/:post_id", verifyPostOwnership, async (req, res) => {
  try {
    const { title, description, ratings } = req.body;
    
    // Update only provided fields
    if (title) req.post.title = title;
    if (description) req.post.description = description;
    if (ratings) req.post.ratings = ratings;

    await req.post.save();
    res.status(200).json({ 
      message: "Post updated successfully",
      post: req.post 
    });
  } catch (error) {
    console.error("Update post error:", error);
    res.status(500).json({ 
      error: "Error updating post",
      details: error.message 
    });
  }
});

// Delete post
router.delete("/:user_id/posts/:post_id", verifyPostOwnership, async (req, res) => {
  try {
    // Remove post
    await Post.findByIdAndDelete(req.params.post_id);
    
    // Update user's posts array and count
    await User.findByIdAndUpdate(req.params.user_id, {
      $pull: { posts: req.params.post_id },
      $inc: { posts_count: -1 }
    });

    res.status(200).json({ message: "Post deleted successfully" });
  } catch (error) {
    console.error("Delete post error:", error);
    res.status(500).json({ 
      error: "Error deleting post",
      details: error.message 
    });
  }
});


router.get("/:user_id/user_feed", async (req, res) => {
  const { user_id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(user_id)) {
    return res.status(400).send('Invalid ObjectId');
  }

  try {
    const active_user = await User.findById(user_id);
    if (!active_user) {
      return res.status(404).send({ error: "Active user not found" }); // reroute to login page?
    }

    const following = active_user.following
    if (!following || following.length === 0) {
      return res.status(200).send([]);
    }

    const rawPosts = await Post.find({ user_id: { $in: following } })
      .sort({ timestamp: -1 })
      .populate("user_id", "username profile.avatar_url")
      .populate("restaurant_id", "name")
      .exec();

    const enrichedPosts = await Promise.all(rawPosts.map(async (post) => {
      const postObj = post.toObject();
      try {
        const restaurant = await Restaurant.findById(post.restaurant_id);
        const dish = restaurant?.menu?.find(d => d._id.toString() === post.dish_id.toString());
        postObj.dish_name = dish?.name || null;
      } catch (e) {
        postObj.dish_name = null;
      }
      return postObj;
    }));

    res.status(200).send(enrichedPosts);
  } catch (error) {
    res.status(500).send({ error: "Error retrieving posts" });
  }
});

// Like/Unlike a Post
router.post("/:post_user_id/posts/:post_id/like/:user_id", async (req, res) => {
  try {
    const { post_user_id, post_id, user_id } = req.params;
    const post = await Post.findById(post_id);

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    const userIndex = post.like_list.indexOf(user_id);

    if (userIndex === -1) {
      // User hasn't liked -> Add like
      post.like_list.push(user_id);
      post.num_like += 1;
    } else {
      // User has liked -> Remove like
      post.like_list.splice(userIndex, 1);
      post.num_like -= 1;
    }

    await post.save();
    res.status(200).json({ message: "Like updated", post });
  } catch (error) {
    res.status(500).json({ error: "Error updating like", details: error.message });
  }
});

module.exports = router;
