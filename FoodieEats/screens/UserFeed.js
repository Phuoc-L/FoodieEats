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
  const [currentUser, setCurrentUser] = useState({});
  const [userData, setUserData] = useState({});

  useFocusEffect(
    useCallback(() => {
      const getData = async () => {
        try {
          console.log("UserFeed: Attempting to get data from AsyncStorage...");
          const id = await AsyncStorage.getItem('userID'); // Use 'userID'
          const ownerString = await AsyncStorage.getItem('owner'); // Use 'owner'
          
          console.log("UserFeed: Fetched from AsyncStorage - id:", id, "ownerString:", ownerString);

          if (!id) {
            console.error('UserFeed: User ID (userID) not found in AsyncStorage');
            setPosts([]); // Clear posts if no user ID
            return;
          }
          const ownerBool = ownerString === 'true'; // Convert to boolean
          setUserData({ id, owner: ownerBool }); // Set state

          // Fetch full user details if needed by PostComponent or other logic
          // const user = await axios.get(`${process.env.EXPO_PUBLIC_API_URL}/api/users/${id}`, {validateStatus: () => true});
          // setCurrentUser(user.data);

        } catch (e) {
          console.error("UserFeed: Error in getData", e);
        }
      };
      getData();
    }, [])
  );

  useEffect(() => {
    // Ensure userData and specifically userData.id is available
    if (!userData || !userData.id) {
        console.log("UserFeed: Skipping fetchPosts because userData.id is not set.");
        return;
    }

    const fetchPosts = async () => {
      try {
        console.log(`UserFeed: Fetching posts for user ID: ${userData.id}`);
        const response = await axios.get(`${process.env.EXPO_PUBLIC_API_URL}/api/posts/${userData.id}/user_feed`, {validateStatus: () => true});

        if (response.status === 200) {
          const postsData = response.data || [];
          setPosts(postsData);
        } else {
          console.error('Error fetching posts:', response.status);
        }
      } catch (error) {
        console.error('Error fetching posts (2):', error);
      }
    };
    fetchPosts();
  }, [userData]);


  return (
    <View style={styles.container}>
      <FlatList
        data={posts}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => <PostComponent userId={userData.id} owner={userData.owner} dish={item} />}
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
