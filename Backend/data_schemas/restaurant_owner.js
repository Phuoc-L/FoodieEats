const mongoose = require("mongoose");

const restaurantOwnerSchema = new mongoose.Schema({
    restaurant_id: mongoose.Schema.Types.ObjectId,
    first_name: String,
    last_name: String
    username: String,
    email: String,
    password: String,
});

module.exports = mongoose.model("Restaurant Owner", restaurantOwnerSchema);
