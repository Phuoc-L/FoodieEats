import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import NavigationBar from './Navigation';
import axios from 'axios';
import PostComponent from './PostComponent';

export default function UserFeed() {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const userId = '67045cebfe84a164fa7085a9'; // Replace with actual user ID
      const url_prefix = "http://192.168.99.152:3000"
      const post_url = url_prefix + `/api/posts/${userId}/user_feed`
      const response = await axios.get(post_url);

      if (response.status === 200) {
        const postsData = response.data || [];

        const postsWithMenu = await Promise.all(
          postsData.map(async (post) => {
            try {
              const restaurantResponse = await axios.get(
                url_prefix + `/api/restaurants/${post.restaurant_id}`
              );
              const menuResponse = await axios.get(
                url_prefix + `/api/restaurants/${post.restaurant_id}/menu/${post.dish_id}`
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
