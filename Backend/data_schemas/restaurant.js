const mongoose = require("mongoose");

const restaurantSchema = new mongoose.Schema(
{
    name: { type: String, required: true },
    location: type: String,
    coordinates: {
        latitude: { type: Number, require: true },
        longitude: { type: Number, require: true },
    },
    reviews: { type: Array, default: [] },
    average_rating: { type: Number, default: 0 },
    followers: { type: Array, default: [] },
    operating_hours: String,
    contact_info: {
        phone: String,
        email: String,
    },
    reservation_link: String,
    menu: [
        {
            name: { type: String, require: true },
            description: { type: String, require: true },
            average_rating: { type: Number, default: 0 },
            price: { type: Number, require: true },
            num_ratings: { type: Number, default: 0 }
        }
    ],
});

module.exports = mongoose.model("Restaurant", restaurantSchema, "restaurants");

