import React, { useEffect, useState, useCallback } from 'react';
import { View, FlatList, StyleSheet, Text, Dimensions, SafeAreaView, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NavigationBar from './Navigation';
import axios from 'axios';
import PostComponent from './PostComponent';


const { width } = Dimensions.get('window');

export default function UserFeed() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [posts, setPosts] = useState([]);
  const [currentUser, setCurrentUser] = useState({});
  const [userData, setUserData] = useState({});

  useFocusEffect(
    useCallback(() => {
      const getData = async () => {
        try {
          const id = await AsyncStorage.getItem('userID');
          const owner = await AsyncStorage.getItem('owner');
          const isOwner = (owner.toLowerCase() === "true");
          if (!id) {
            console.error('UserFeed: User ID (userID) not found in AsyncStorage');
            setPosts([]); // Clear posts if no user ID
            return;
          }
          setUserData({ id, isOwner });
          const user = await axios.get(`${process.env.EXPO_PUBLIC_API_URL}/api/users/${id}`);
          setCurrentUser(user.data);
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
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get(`${process.env.EXPO_PUBLIC_API_URL}/api/posts/${userData.id}/user_feed`);

        if (response.status === 200) {
          const postsData = response.data || [];
          setPosts(postsData);
        } else {
          console.error('Error fetching posts:', response.status);
          setError('Failed to load posts.');
        }
      } catch (error) {
        console.error('Error fetching posts (2):', error);
        setError('Something went wrong loading your feed.');
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, [userData]);


  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>FoodieEats</Text>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => <PostComponent post={item} onDeleteSuccess={(deletedPostId) => {setPosts(current => current.filter(post => post._id !== deletedPostId));}}/>}
          contentContainerStyle={posts.length === 0 ? styles.emptyContainer : styles.feed}
          ListEmptyComponent={<Text style={styles.emptyText}>No posts to show.</Text>}
        />
      )}

      <NavigationBar />
    </SafeAreaView>

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
  title: {
    fontSize: width/8,
    fontWeight: 800,
    textAlign: 'center',
    marginTop: 30,
    color: '#FF8000',
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
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: 'red',
    fontSize: 16,
  },
});
