const express = require("express");
const app = express();
const mongoose = require("mongoose");
const userRoutes = require("./routes/userRoutes");
const restaurantRoutes = require("./routes/restaurantRoutes");
const postRoutes = require("./routes/postRoutes");
const speechRoutes = require("./routes/speechRoutes");
const commentRoutes = require("./routes/commentRoutes");
const restaurantOwnerRoutes = require("./routes/restaurantOwnerRoutes"); // Import owner routes
require("dotenv").config({ path: "secrets.ini" });
const cors = require('cors');

app.use(express.json());

mongoose.connect(process.env.MONGO_URL, {dbName: "FoodieEatsDB"}).then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.log("Error connecting to MongoDB", err);
  });

// Start the server
app.listen(3000, () => {
  console.log("Server is running on port 3000");
});

// Basic route
app.get("/", (req, res) => {
  res.send({ status: "Foodie Eats API is running" });
});

// routes
const jwt = require("jsonwebtoken");
app.use("/api/users", userRoutes);
app.use("/api/restaurants", restaurantRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/speech", speechRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/restaurant-owners", restaurantOwnerRoutes); // Register owner routes
app.use(cors());
