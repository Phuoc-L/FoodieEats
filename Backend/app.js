const express = require("express");
const app = express();
const mongoose = require("mongoose");
const userRoutes = require("./routes/userRoutes");
require("dotenv").config({ path: "secrets.ini" });

app.use(express.json());

// Database connection
mongoose
  .connect(process.env.MONGO_URL, { dbName: "FoodieEatsDB" })
  .then(() => {
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
