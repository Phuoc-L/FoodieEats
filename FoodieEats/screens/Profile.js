import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, Button, Alert,
  TouchableOpacity, Image, StyleSheet
} from 'react-native';
import axios from 'axios';
import { useIsFocused } from '@react-navigation/native'; // so we can refresh on screen focus

export default function ProfileScreen(props) {
  const { user, token } = props.route?.params || {};
  const [posts, setPosts] = useState([]);
  
  // This hook tells us if this screen is currently focused
  const isFocused = useIsFocused();

  // Fetch posts whenever screen is focused (including after navigating back)
  useEffect(() => {
    if (isFocused && user?._id && token) {
      fetchPosts();
    }
  }, [isFocused]);

  const fetchPosts = async () => {
    try {
      const response = await axios.get(
        `${process.env.EXPO_PUBLIC_API_URL}/api/posts/${user._id}/posts`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPosts(response.data);
    } catch (error) {
      console.error('Error fetching posts:', error.response?.data || error.message);
    }
  };

  // Delete post on long press
  const deletePost = async (postId) => {
    try {
      await axios.delete(
        `${process.env.EXPO_PUBLIC_API_URL}/api/posts/${user._id}/posts/${postId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Alert.alert('Deleted', 'Post deleted successfully');
      fetchPosts();
    } catch (error) {
      console.error('Delete post error:', error.response?.data || error.message);
      Alert.alert('Error', 'Could not delete the post');
    }
  };

  return (
    <View style={styles.container}>
      {/* Header (user info) */}
      <View style={styles.header}>
        <Text style={styles.usernameText}>{user?.username || 'Username'}</Text>
        <Text>Followers: {user?.followers_count || 0}</Text>
        <Text>Following: {user?.following_count || 0}</Text>
      </View>

      {/* Button to navigate to CreatePostScreen */}
      <View style={{ marginBottom: 10, alignItems: 'center' }}>
        <Button
          title="Create New Post"
          onPress={() =>
            props.navigation.navigate('NewPost', { user, token })
          }
        />
      </View>

      {/* Existing posts */}
      <ScrollView>
        <Text style={styles.postingsText}>My Review Posts</Text>
        <View style={styles.gridContainer}>
          {posts.map((post) => (
            <TouchableOpacity
              key={post._id}
              style={styles.gridItem}
              onLongPress={() => deletePost(post._id)}
            >
              {post.image_url ? (
                <Image
                  source={{ uri: post.image_url }}
                  style={styles.gridImage}
                />
              ) : (
                <View style={styles.noImageContainer}>
                  <Text>No Image</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

// -----------------------------------------
// Styles
// -----------------------------------------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 10,
  },
  usernameText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  postingsText: {
    fontSize: 16,
    fontWeight: 'bold',
    margin: 10,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  gridItem: {
    width: '33%',  // 3 columns
    aspectRatio: 1,
    marginBottom: 2,
  },
  gridImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  noImageContainer: {
    flex: 1,
    backgroundColor: '#ccc',
    alignItems: 'center',
    justifyContent: 'center',
  },
});