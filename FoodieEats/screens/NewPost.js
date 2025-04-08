import React, { useState, useEffect } from 'react';
import { 
  View, Text, Button, Alert, TouchableOpacity, 
  Image, StyleSheet, TextInput, ScrollView 
} from 'react-native';
import axios from 'axios';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NavigationBar from './Navigation';
import { Picker } from '@react-native-picker/picker';

export default function CreatePostScreen({ navigation }) {
  // User data states
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  // Post form states
  const [reviewText, setReviewText] = useState('');
  const [rating, setRating] = useState(0);
  const [selectedImage, setSelectedImage] = useState(null);

  // Restaurant & Dish selection states
  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [selectedDish, setSelectedDish] = useState(null);

  // Load user details from AsyncStorage and fetch user data
  useEffect(() => {
    const fetchUserParams = async () => {
      try {
        const userId = await AsyncStorage.getItem('userID');
        const authToken = await AsyncStorage.getItem('token');

        if (!userId || !authToken) {
          Alert.alert('Error', 'User not found, please log in again');
          return;
        }

        const userRes = await axios.get(
          `${process.env.EXPO_PUBLIC_API_URL}/api/users/${userId}`,
          { headers: { Authorization: `Bearer ${authToken}` } }
        );

        setUser(userRes.data);
        setToken(authToken);
      } catch (error) {
        console.error('Error loading user:', error);
        Alert.alert('Error', 'Failed to load user data');
      }
    };
    fetchUserParams();
  }, []);

  // Fetch list of restaurants on mount
  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const res = await axios.get(`${process.env.EXPO_PUBLIC_API_URL}/api/restaurants`);
        setRestaurants(res.data);
      } catch (error) {
        console.error("Error fetching restaurants:", error);
      }
    };
    fetchRestaurants();
  }, []);

  // When a restaurant is selected, fetch its menu items
  const onRestaurantChange = async (restaurantId) => {
    const restaurant = restaurants.find(r => r._id === restaurantId);
    setSelectedRestaurant(restaurant);
    setSelectedDish(null); // reset dish selection
    try {
      const res = await axios.get(`${process.env.EXPO_PUBLIC_API_URL}/api/restaurants/${restaurantId}/menu`);
      setMenuItems(res.data);
    } catch (error) {
      console.error("Error fetching menu items:", error);
    }
  };

  // Image Picker
  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 1,
      });
      if (!result.canceled) {
        setSelectedImage(result.assets[0]);
      }
    } catch (err) {
      console.error('ImagePicker Error:', err);
    }
  };

  // Submit post function: now uses selectedRestaurant and selectedDish
  const submitPost = async () => {
    if (!selectedRestaurant || !selectedDish || !selectedImage) {
      Alert.alert('Missing Fields', 'Please select a restaurant, dish, and pick an image.');
      return;
    }
    if (!user || !token) {
      Alert.alert('Error', 'User not found, please log in again');
      return;
    }
    try {
      await createPost({
        // Use selected dish's name as title (or adjust as needed)
        title: selectedDish.name,
        restaurant_id: selectedRestaurant._id,
        dish_id: selectedDish._id,
        description: reviewText,
        ratings: rating,
        imageAsset: selectedImage,
      });
      Alert.alert('Success', 'Post created!');
      navigation.navigate('Profile', { displayUserId: user._id });
    } catch (error) {
      Alert.alert('Error', error.message || 'Could not create post');
    }
  };

  // Create post API call
  const createPost = async ({ title, restaurant_id, dish_id, description, ratings, imageAsset }) => {
    try {
      const createRes = await axios.post(
        `${process.env.EXPO_PUBLIC_API_URL}/api/posts/${user._id}/create`,
        {
          title,
          restaurant_id,
          dish_id,
          description,
          ratings,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const newPost = createRes.data.post;
      const postId = newPost._id;

      // Get presigned URL for image upload
      const fileName = Date.now() + '-' + (imageAsset.uri.split('/').pop() ?? 'image.jpg');
      const fileType = 'image/jpg';
      const uploadRes = await axios.post(
        `${process.env.EXPO_PUBLIC_API_URL}/api/posts/${user._id}/posts/${postId}/image`,
        { fileName, fileType },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const { presignedURL } = uploadRes.data;

      // Upload image using the presigned URL
      await fetch(presignedURL, {
        method: 'PUT',
        headers: { 'Content-Type': fileType },
        body: {
          uri: imageAsset.uri,
          type: fileType,
          name: fileName,
        },
      });
    } catch (error) {
      console.error('createPost error:', error.response?.data || error.message);
      throw new Error('Could not create post');
    }
  };

  // Simple star rating component
  const renderStars = () => {
    const stars = [1, 2, 3, 4, 5];
    return (
      <View style={{ flexDirection: 'row', marginVertical: 5 }}>
        {stars.map((starValue) => (
          <TouchableOpacity
            key={starValue}
            onPress={() => setRating(starValue)}
          >
            <Text style={{
              fontSize: 24,
              color: starValue <= rating ? 'gold' : 'gray',
              marginHorizontal: 2,
            }}>
              ★
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  // Layout with scrollable content and NavigationBar pinned at the bottom
  return (
    <View style={styles.screenContainer}>
      <ScrollView style={styles.scrollContainer}>
        <Text style={styles.title}>Create a New Post</Text>

        {/* Restaurant Picker */}
        <Text style={styles.label}>Select Restaurant:</Text>
        <Picker
          selectedValue={selectedRestaurant ? selectedRestaurant._id : ''}
          onValueChange={(itemValue) => onRestaurantChange(itemValue)}
        >
          <Picker.Item label="Select a restaurant" value="" />
          {restaurants.map((restaurant) => (
            <Picker.Item key={restaurant._id} label={restaurant.name} value={restaurant._id} />
          ))}
        </Picker>

        {/* Dish Picker */}
        {menuItems.length > 0 && (
          <>
            <Text style={styles.label}>Select Dish:</Text>
            <Picker
              selectedValue={selectedDish ? selectedDish._id : ''}
              onValueChange={(itemValue) => {
                const dish = menuItems.find(d => d._id === itemValue);
                setSelectedDish(dish);
              }}
            >
              <Picker.Item label="Select a dish" value="" />
              {menuItems.map((dish) => (
                <Picker.Item key={dish._id} label={dish.name} value={dish._id} />
              ))}
            </Picker>
          </>
        )}

        {/* Image Picker */}
        <TouchableOpacity style={styles.imagePlaceholder} onPress={pickImage}>
          {selectedImage ? (
            <Image source={{ uri: selectedImage.uri }} style={styles.previewImage} />
          ) : (
            <Text style={{ textAlign: 'center' }}>Tap to pick image</Text>
          )}
        </TouchableOpacity>

        {/* Review Text */}
        <TextInput
          style={[styles.input, { height: 80 }]}
          placeholder="Review"
          value={reviewText}
          onChangeText={setReviewText}
          multiline
        />

        {renderStars()}

        <Button title="Submit Post" onPress={submitPost} />
      </ScrollView>

      {/* NavigationBar at bottom */}
      <NavigationBar />
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContainer: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 22,
    marginBottom: 10,
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    marginVertical: 8,
  },
  imagePlaceholder: {
    width: '100%',
    height: 120,
    backgroundColor: '#ddd',
    justifyContent: 'center',
    marginVertical: 10,
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    marginVertical: 5,
    padding: 10,
    borderRadius: 5,
  },
});
