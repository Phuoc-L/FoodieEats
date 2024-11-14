const mongoose = require("mongoose");

const restaurantSchema = new mongoose.Schema({
  name: { type: String, required: true },
  location: { type: String, required: true },
  average_rating: { type: Number, default: 0 },
  operating_hours: { type: String, required: true },
  
  post_list: { type: Array, default: [] },
  num_posts: { type: Number, default: 0 },

  contact_info: {
    phone: { type: String, required: true },
    email: { type: String, required: true },
  },

  coordinates: {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
  },

  menu: [
    {
      name: { type: String, required: true },
      description: { type: String, required: true },
      price: { type: Number, required: true },
      average_rating: { type: Number, default: 0 },
      num_ratings: { type: Number, default: 0 },
    },
  ],
});

module.exports = mongoose.model("Restaurant", restaurantSchema, "restaurants");
