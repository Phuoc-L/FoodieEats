const express = require("express");
const app = express();
const mongoose = require("mongoose");
require("dotenv").config({ path: "./Backend/secrets.ini" });

mongoose.connect(process.env.MONGO_URL).then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.log("Error connecting to MongoDB", err);
  });

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});

app.get("/", (req, res) => {
  res.send({ status: "Foodie Eats API is running" });
});