import React, { useEffect, useState, useCallback } from 'react';
import { View, FlatList, StyleSheet, Text, Dimensions } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NavigationBar from './Navigation';
import axios from 'axios';
import PostComponent from './PostComponent';


const { width } = Dimensions.get('window');

export default function UserFeed() {
  const [posts, setPosts] = useState([]);
  const [currentUser, setCurrentUser] = useState("");
  const [userId, setUserId] = useState("");

  useFocusEffect(
    useCallback(() => {
      const initialize = async () => {
        await getUser();
        fetchPosts(true);
      };
      initialize();
    }, [])
  );

  // Get user data
  const getUser = async () => {
    try {
      const user_id = await AsyncStorage.getItem('user');
      if (!user_id) {
        console.error('User ID not found in AsyncStorage');
        return;
      }
      setUserId(user_id);
      const user = await axios.get(process.env.EXPO_PUBLIC_API_URL + '/api/users/' + user_id);
      setCurrentUser(user.data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchPosts = async (refresh = false) => {
    try {
      if (!userId) return;

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
      console.error('Error fetching posts (2):', error);
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={posts}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => <PostComponent userId={userId} item={item} />}
        contentContainerStyle={posts.length === 0 ? styles.emptyContainer : styles.feed}
        ListEmptyComponent={<Text style={styles.emptyText}>No posts to show.</Text>}
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  feed: {
    paddingBottom: 60,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 18,
    color: 'gray',
    marginBottom: 60,
  },
});
