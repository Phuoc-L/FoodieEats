const express = require("express");
const mongoose = require("mongoose");
const Restaurant = require("../data_schemas/restaurant");
const Posts = require("../data_schemas/post");
const Owner = require("../data_schemas/restaurant_owner");
const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const restaurants = await Restaurant.find({}, "_id name");
    res.status(200).send(restaurants);
  } catch (error) {
    res.status(500).send({ error: "Error retrieving restaurant IDs" });
  }
});

// Search for restaurants with filtering and sorting
router.get('/search', async (req, res) => {
  try {
    const { query, minRating, maxRating, sortBy, sortOrder } = req.query;

    console.log("restaurant route: ", req.query);

    if (!query) {
      const sortOptions = {};
      if (sortBy) {
        sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
      }
      else {
        sortOptions.average_rating = -1;
      }
      // if no query return highest rated restaurants
      const restaurants = await Restaurant.find().sort(sortOptions);
      return res.status(200).json({ total: restaurants.length, restaurants });
    }

    // Build the filter
    const filter = {
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { location: { $regex: query, $options: 'i' } },
        { 'menu.name': { $regex: query, $options: 'i' } },
        { 'menu.description': { $regex: query, $options: 'i' } },
      ],
    };

    // Add rating filters
    if (minRating || maxRating) {
      filter.average_rating = {};
      if (minRating) filter.average_rating.$gte = parseFloat(minRating);
      if (maxRating) filter.average_rating.$lte = parseFloat(maxRating);
    }

    // Build sort options
    const sortOptions = {};
    if (sortBy) {
      sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
    }

    // Query the database
    const restaurants = await Restaurant.find(filter).sort(sortOptions);

    res.status(200).json({ total: restaurants.length, restaurants });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error', details: err.message });
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

// Search for menu items within a specific restaurant
router.get("/:id/menu/search", async (req, res) => {
  const { id } = req.params;
  const { query } = req.query; // Get the search query from query parameters

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send('Invalid Restaurant ObjectId');
  }
  if (!query || typeof query !== 'string') {
    // If no query, maybe return empty or the full menu? Let's return empty for autocomplete.
    return res.status(200).send([]);
  }

  try {
    const restaurant = await Restaurant.findById(id, "menu"); // Only fetch the menu
    if (!restaurant) {
      return res.status(404).send({ error: "Restaurant not found" });
    }

    // Filter the menu items based on the query (case-insensitive regex)
    const regex = new RegExp(query, 'i');
    const matchingItems = restaurant.menu.filter(item => regex.test(item.name));

    res.status(200).send(matchingItems);
  } catch (error) {
    console.error("Error searching menu items:", error);
    res.status(500).send({ error: "Error searching menu items" });
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

router.put('/:restaurantId', async (req, res) => {
    const updated = await Restaurant.findByIdAndUpdate(
        req.params.restaurantId,
        req.body,
        { new: true }
    );
    res.json(updated);
});

router.get("/:dish_id/reviews", async (req, res) => {
    const { dish_id } = req.params;

    try {
        const rawPosts = await Posts.find({ dish_id: dish_id} )
            .sort({ timestamp: -1 })
            .populate("user_id", "username profile.avatar_url")
            .populate("restaurant_id", "name")
            .exec();

        const enrichedPosts = await Promise.all(rawPosts.map(async (post) => {
            const postObj = post.toObject();
            try {
                const restaurant = await Restaurant.findById(post.restaurant_id);
                const dish = restaurant?.menu?.find(d => d._id.toString() === post.dish_id.toString());
                postObj.dish_name = dish?.name || null;
            } catch (e) {
                postObj.dish_name = null;
            }
            return postObj;
        }));

        if(!enrichedPosts) {
            return res.status(404).json({ error: "No reviews found" });
        }

        res.status(200).json({ message: "Reviews found successfully", posts: enrichedPosts });
    } catch (error) {
        res.status(500).json({ error: "Error getting reviews" });
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

router.get("/:id/isOwner/:user_id", async (req, res) => {
  const { id, user_id } = req.params;

  try {
    const user = await Owner.findById(user_id);
    if (!user) return res.status(404).send({ error: "Restaurant owner user not found", result: false });

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).send({ error: "Invalid restaurant ID", result: false });
    }

    const isOwner = user.restaurant_id.equals(new mongoose.Types.ObjectId(id));
    res.status(200).send({ message: "Restaurant owner found successfully.", result: isOwner});

  } catch (error) {
    console.error("Exception caught:", error);
    res.status(500).send({ error: error.message || "Internal server error", result: false });
  }
});

router.get("/owner/:user_id", async (req, res) => {
  const { user_id } = req.params;

  try {
    const user = await Owner.findById(user_id);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error getting user by ID" });
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
