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
//          const id = await AsyncStorage.getItem('user');
//          const owner = await AsyncStorage.getItem('owner');
          const id = '67045cebfe84a164fa7085a9';
          const owner = false;
          if (!id) {
            console.error('User ID not found in AsyncStorage');
            return;
          }
          setUserData({ id, owner });
          const user = await axios.get(`${process.env.EXPO_PUBLIC_API_URL}/api/users/${id}`);
          setCurrentUser(user.data);
        } catch (e) {
          console.error(e);
        }
      };
      getData();
    }, [])
  );

  useEffect(() => {
    if (!userData) return;

    const fetchPosts = async () => {
      try {
        const response = await axios.get(`${process.env.EXPO_PUBLIC_API_URL}/api/posts/${userData.id}/user_feed`);

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
