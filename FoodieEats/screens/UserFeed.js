import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Image, TouchableOpacity } from 'react-native';
import NavigationBar from './Navigation';
import axios from 'axios';

export default function UserFeed() {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const userId = '67045cebfe84a164fa7085a9'; // Replace with actual user ID
      const response = await axios.get(
        `$http://192.168.1.195:3000/api/posts/${userId}/user_feed`
      );
      setPosts(response.data.posts || []);
    } catch (error) {
      console.error('Error fetching posts:', error);
    }
  };

  const renderPost = ({ item }) => (
    <View style={styles.postContainer}>
      <View style={styles.header}>
        <Image
          source={{ uri: item.user_id.profile.avatar_url }}
          style={styles.avatar}
        />
        <Text style={styles.username}>@{item.user_id.username}</Text>
      </View>
      <Image source={{ uri: item.media_url }} style={styles.media} />
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.description}>{item.description}</Text>
      <Text style={styles.likes}>{item.num_like} likes</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={posts}
        keyExtractor={(item) => item._id}
        renderItem={renderPost}
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
  postContainer: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  username: {
    fontWeight: 'bold',
  },
  media: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    marginVertical: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  description: {
    color: '#555',
  },
  likes: {
    marginTop: 5,
    color: '#555',
  },
});
