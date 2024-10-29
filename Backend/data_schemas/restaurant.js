const mongoose = require("mongoose");

const restaurantSchema = new mongoose.Schema(
{
    name: String,
    location: String,
    coordinates: {
        latitude: Number,
        longitude: Number,
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
            name: String,
            description: String,
            average_rating: { type: Number, default: 0 },
            price: Number,
            num_ratings: { type: Number, default: 0 }
        }
    ],
});

module.exports = mongoose.model("Restaurant", restaurantSchema, "restaurants");

