const express = require("express");
const mongoose = require("mongoose");
const User = require("../data_schemas/users");
const Post = require("../data_schemas/post");
const router = express.Router();

router.get("/:user_id/following", async (req, res) => {
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
        return res.status(200).send({ error: "No followed users found.", posts: [] });
    }

    const posts = await Post.find({ user_id: { $in: following } })
        .sort({ timestamp: -1 })
        .populate("user_id", "username profile.avatar_url")
        .exec();

    res.status(200).send(posts);
  } catch (error) {
    res.status(500).send({ error: "Error retrieving posts" });
  }
});

module.exports = router;
