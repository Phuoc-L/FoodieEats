const mongoose = require("mongoose");

const restaurantSchema = new mongoose.Schema({
  name: { type: String, default: "" },
  location: { type: String, default: "" },
  average_rating: { type: Number, default: 0.0 },
  operating_hours: { type: String, default: "" },
  
  reviews: { type: Array, default: [] },
  num_reviews: { type: Number, default: 0 },

  contact_info: {
    phone: { type: String, default: "" },
    email: { type: String, default: "" },
  },

  coordinates: {
    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null },
  },

  menu: [
    {
      name: { type: String, required: true },
      description: { type: String, required: true },
      price: { type: Number, required: true },
      average_rating: { type: Number, default: 0.0 },
      num_ratings: { type: Number, default: 0 },
    },
  ],
});

module.exports = mongoose.model("Restaurant", restaurantSchema, "restaurants");
