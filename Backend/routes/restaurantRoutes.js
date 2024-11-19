const express = require("express");
const mongoose = require("mongoose");
const Restaurant = require("../data_schemas/restaurant");
const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const restaurants = await Restaurant.find({}, "_id name");
    res.status(200).send(restaurants);
  } catch (error) {
    res.status(500).send({ error: "Error retrieving restaurant IDs" });
  }
});

router.get("/:id", async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).send('Invalid ObjectId');
    }

  try {
    const restaurant = await Restaurant.findById(id);
    if (!restaurant) {
      return res.status(404).send({ error: "Restaurant not found" });
    }
    res.status(200).send(restaurant);
  } catch (error) {
    res.status(500).send({ error: "Error retrieving restaurant information" });
  }
});

router.get("/:id/menu", async (req, res) => {
  const { id } = req.params;

  try {
    const restaurant = await Restaurant.findById(id, "menu");
    if (!restaurant) {
      return res.status(404).send({ error: "Restaurant not found" });
    }
    res.status(200).send(restaurant.menu);
  } catch (error) {
    res.status(500).send({ error: "Error retrieving restaurant information" });
  }
});

router.post("/:id/menu", async (req, res) => {
  const { id } = req.params;
  const { name, description, price } = req.body;

  try {
    const restaurant = await Restaurant.findById(id);
    if (!restaurant) return res.status(404).send({ error: "Restaurant not found" });

    const newItem = {
      _id: new mongoose.Types.ObjectId(),
      name,
      description,
      price,
      average_rating: 0,
      num_ratings: 0,
    };

    restaurant.menu.push(newItem);
    await restaurant.save();
    res.status(201).send({ message: "Menu item added successfully", item: newItem });
  } catch (error) {
    res.status(500).send({ error: "Error adding menu item" });
  }
});

router.get("/:id/menu/:dishId", async (req, res) => {
    const { id, dishId } = req.params;

    try {
    const restaurant = await Restaurant.findById(id, "menu");
    if (!restaurant) {
     return res.status(404).send({ error: "Restaurant not found" });
    }
    const menuItem = restaurant.menu.id(dishId);
    if (!menuItem) return res.status(404).send({ error: "Menu item not found" });

    res.status(200).send(menuItem);
    } catch (error) {
    res.status(500).send({ error: "Error retrieving restaurant menu item information" });
    }
});

router.put("/:id/menu/:dishId", async (req, res) => {
  const { id, dishId } = req.params;
  const { name, description, price } = req.body;

  try {
    const restaurant = await Restaurant.findById(id);
    if (!restaurant) return res.status(404).send({ error: "Restaurant not found" });

    const menuItem = restaurant.menu.id(dishId);
    if (!menuItem) return res.status(404).send({ error: "Menu item not found" });

    if (name) menuItem.name = name;
    if (description) menuItem.description = description;
    if (price) menuItem.price = price;

    await restaurant.save();
    res.status(200).send({ message: "Menu item updated successfully", item: menuItem });
  } catch (error) {
    res.status(500).send({ error: "Error updating menu item" });
  }
});

router.delete("/:id/menu/:dishId", async (req, res) => {
  const { id, dishId } = req.params;

  try {
    const restaurant = await Restaurant.findById(id);
    if (!restaurant) return res.status(404).send({ error: "Restaurant not found" });

    const originalLength = restaurant.menu.length;
    restaurant.menu = restaurant.menu.filter(item => item._id.toString() !== dishId);

    if (restaurant.menu.length === originalLength) {
      return res.status(404).send({ error: "Menu item not found" });
    }

    await restaurant.save();
    res.status(200).send({ message: "Menu item deleted successfully" });
  } catch (error) {
    res.status(500).send({ error: "Error deleting menu item" });
  }
});

router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { name, operating_hours, contact_info, reservation_link, location } = req.body;
  try {
    const restaurant = await Restaurant.findById(id);
    if (!restaurant) return res.status(404).send({ error: "Restaurant not found" });
    if (name) restaurant.name = name;
    if (operating_hours) restaurant.operating_hours = operating_hours;
    if (contact_info) restaurant.contact_info = contact_info;
    if (reservation_link) restaurant.reservation_link = reservation_link;
    if (location) restaurant.location = location;
    await restaurant.save();
    res.status(200).send({ message: "Restaurant page updated successfully" });
  } catch (error) {
    res.status(500).send({ error: "Error updating restaurant page" });
  }
});

router.put("/:id/menu/:dishId/rating", async (req, res) => {
  const { id, dishId } = req.params;
  const { newRating } = req.body;
  try {
    const restaurant = await Restaurant.findById(id);
    if (!restaurant) return res.status(404).send({ error: "Restaurant not found" });
    const dish = restaurant.menu.id(dishId);
    if (!dish) return res.status(404).send({ error: "Dish not found" });
    dish.average_rating = (dish.average_rating * dish.num_ratings + newRating) / (dish.num_ratings + 1);
    dish.num_ratings += 1;

    restaurant.average_rating = calculateAverageRating(restaurant.menu);

    await restaurant.save();
    res.status(200).send({ message: "Dish rating updated successfully" });
  } catch (error) {
    res.status(500).send({ error: "Error updating dish rating" });
  }
});

const calculateAverageRating = (menu) => {
  let totalRatingSum = 0;
  let totalRatingCount = 0;

  menu.forEach((item) => {
    totalRatingSum += item.average_rating * item.num_ratings;
    totalRatingCount += item.num_ratings;
  });

  return totalRatingCount > 0 ? totalRatingSum / totalRatingCount : 0;
};

module.exports = router;