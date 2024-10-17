const express = require("express");
const app = express();
const mongoose = require("mongoose");

const mongoUrl = "mongodb+srv://manidhar:manidharpassword@cluster.yuogk.mongodb.net/?retryWrites=true&w=majority&appName=cluster";

mongoose.connect(mongoUrl).then(() => {
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