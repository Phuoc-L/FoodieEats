import React, { useState } from 'react';
import { 
  View, Text, Button, Alert, TouchableOpacity, 
  Image, StyleSheet, TextInput, ScrollView
} from 'react-native';
import axios from 'axios';
import * as ImagePicker from 'expo-image-picker';

export default function CreatePostScreen(props) {
  const { user, token } = props.route.params || {};

  // Form states
  const [dishName, setDishName] = useState('');
  const [restaurantName, setRestaurantName] = useState('');
  const [reviewText, setReviewText] = useState('');
  const [rating, setRating] = useState(0);
  const [selectedImage, setSelectedImage] = useState(null);

  // 1) Pick image
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

  // 2) Submit post
  const submitPost = async () => {
    if (!dishName || !restaurantName || !selectedImage) {
      Alert.alert('Missing Fields', 'Please fill Dish, Restaurant, and pick an Image.');
      return;
    }
    try {
      await createPost({
        dishName,
        restaurantName,
        reviewText,
        rating,
        imageAsset: selectedImage,
      });
      Alert.alert('Success', 'Post created!');
      // Option 1: Navigate back to Profile
      props.navigation.goBack();
    } catch (error) {
      Alert.alert('Error', error.message || 'Could not create post');
    }
  };

  // 3) createPost function
  const createPost = async ({ dishName, restaurantName, reviewText, rating, imageAsset }) => {
    try {
      // A) Create the post
      const createRes = await axios.post(
        `${process.env.EXPO_PUBLIC_API_URL}/api/posts/${user._id}/create`,
        {
          title: dishName,
          restaurant_id: restaurantName,
          description: reviewText,
          rating: rating,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const newPost = createRes.data.post;
      const postId = newPost._id;

      // B) Get presigned URL
      const fileName = Date.now() + '-' + (imageAsset.uri.split('/').pop() ?? 'image.jpg');
      const fileType = 'image/jpeg';
      const uploadRes = await axios.post(
        `${process.env.EXPO_PUBLIC_API_URL}/api/posts/${user._id}/posts/${postId}/image`,
        { fileName, fileType },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const { presignedURL } = uploadRes.data;

      // C) Upload to S3
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

  // 4) Simple rating display
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

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Create a New Post</Text>

      <TouchableOpacity style={styles.imagePlaceholder} onPress={pickImage}>
        {selectedImage ? (
          <Image
            source={{ uri: selectedImage.uri }}
            style={styles.previewImage}
          />
        ) : (
          <Text style={{ textAlign: 'center' }}>Tap to pick image</Text>
        )}
      </TouchableOpacity>

      <TextInput
        style={styles.input}
        placeholder="Dish Name"
        value={dishName}
        onChangeText={setDishName}
      />

      <TextInput
        style={styles.input}
        placeholder="Restaurant Name"
        value={restaurantName}
        onChangeText={setRestaurantName}
      />

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
  );
}

// -----------------------------------------
// Styles
// -----------------------------------------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 22,
    marginBottom: 10,
    textAlign: 'center',
  },
  imagePlaceholder: {
    width: '100%',
    height: 120,
    backgroundColor: '#ddd',
    justifyContent: 'center',
    marginBottom: 10,
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