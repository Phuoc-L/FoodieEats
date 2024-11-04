const mongoose = require("mongoose");
const restaurant = require("./restaurant");

const restaurantOwnerSchema = new mongoose.Schema({

    restaurant_id: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant", required: true },
    first_name: { type: String, required: true },
    last_name: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
});

module.exports = mongoose.model("RestaurantOwner", restaurantOwnerSchema, "restaurant_owners");