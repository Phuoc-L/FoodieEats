import React, { useEffect, useState, useCallback } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { AsyncStorage } from '@react-native-async-storage/async-storage';
import NavigationBar from './Navigation';
import axios from 'axios';
import PostComponent from './PostComponent';

export default function UserFeed() {
  const [posts, setPosts] = useState([]);
  const [currentUser, setCurrentUser] = useState("");

  useFocusEffect(
    useCallback(() => {
      getUser();
      fetchPosts();
    }, [])
  );

  // Get user data
  const getUser = async () => {
    try {
      const userID = await AsyncStorage.getItem('userID');
      if (!userID) {
        console.error('User ID not found in AsyncStorage');
        return;
      }
      const user = await axios.get(process.env.EXPO_PUBLIC_API_URL + '/api/users/' + userID);
      setCurrentUser(user.data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchPosts = async () => {
    try {
      console.log(currentUser);
      const userId = currentUser;

      console.log(`${process.env.EXPO_PUBLIC_API_URL}/api/posts/${userId}/user_feed`);
      const response = await axios.get(`${process.env.EXPO_PUBLIC_API_URL}/api/posts/${userId}/user_feed`);

      if (response.status === 200) {
        const postsData = response.data || [];

        const postsWithMenu = await Promise.all(
          postsData.map(async (post) => {
            try {
              const restaurantResponse = await axios.get(
                process.env.EXPO_PUBLIC_API_URL + `/api/restaurants/${post.restaurant_id}`
              );
              const menuResponse = await axios.get(
                process.env.EXPO_PUBLIC_API_URL + `/api/restaurants/${post.restaurant_id}/menu/${post.dish_id}`
              );
              return { ...post, dishName: menuResponse.data?.name || null, restaurant: restaurantResponse.data || null };
            } catch (error) {
              console.error(`Error fetching menu item for post ${post._id}:`, error);
              return { ...post, dishName: null, restaurant: null };
            }
          })
        );

        setPosts(postsWithMenu);
      } else {
        console.error('Error fetching posts:', response.status);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={posts}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => <PostComponent item={item} />}
        contentContainerStyle={styles.feed}
      />
      <NavigationBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  feed: {
    paddingBottom: 60,
  },
});
