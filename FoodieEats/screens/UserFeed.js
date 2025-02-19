import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Image, TouchableOpacity, Dimensions } from 'react-native';
import NavigationBar from './Navigation';
import axios from 'axios';
import { FontAwesome } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function UserFeed() {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const userId = '67045cebfe84a164fa7085a9'; // Replace with actual user ID
      const post_url = `http://192.168.99.150:3000/api/posts/${userId}/user_feed`
      const response = await axios.get(post_url);

      if (response.status === 200) {
        const postsData = response.data || [];

        const postsWithMenu = await Promise.all(
          postsData.map(async (post) => {
            try {
              const restaurantResponse = await axios.get(
                `http://192.168.99.150:3000/api/restaurants/${post.restaurant_id}`
              );
              console.log(restaurantResponse.data)
              const menuResponse = await axios.get(
                `http://192.168.99.150:3000/api/restaurants/${post.restaurant_id}/menu/${post.dish_id}`
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

  const renderStars = (rating) => {
    return (
      <View style={styles.starContainer}>
        {[...Array(5)].map((_, index) => (
          <FontAwesome
            key={index}
            name={index < rating ? "star" : "star-o"}
            size={0.13*width}
            color="#0080F0"
            style={styles.star}
          />
        ))}
      </View>
    );
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
      {renderStars(item.ratings)}
      <Text style={styles.itemName}>{item.dishName}</Text>
      <Text style={styles.restaurantName}>{item.restaurant.name}</Text>
      <View style={styles.descriptionContainer}>
        <Text style={styles.description}>
          <Text style={styles.title}>{item.title}  </Text>
          {item.description}
        </Text>
      </View>
      <View style={styles.footer}>
        <Text style={styles.likes}>{item.like_list.length} likes</Text>
        <TouchableOpacity style={styles.commentsButton}>
          <Text style={styles.commentsText}>View Comments</Text>
        </TouchableOpacity>
      </View>
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
  descriptionContainer: {
    marginTop: 10,
    marginBottom: 10
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  avatar: {
    width: width/7,
    height: width/7,
    borderRadius: 10,
    marginRight: width/40,
  },
  username: {
    color: "#0080F0",
    fontSize: width/20,
  },
  media: {
    width: width-20,
    height: width-20,
    alignItems: 'center',
  },
  itemName: {
      fontSize: width/16,
      fontWeight: 'bold',
      textAlign: 'center',
    },
  restaurantName: {
    fontSize: width/25,
    color: '#555',
    textAlign: 'center',
  },
  title: {
    fontSize: width/22,
    fontWeight: 'bold',
  },
  description: {
    fontSize: width/22,
  },
  starContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 5,
  },
  star: {
    marginHorizontal: width/70,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 10,
    marginTop: 5,
  },
  likes: {
    color: '#0080F0',
    fontSize: 16,
  },
  commentsButton: {
    backgroundColor: '#fff',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  commentsText: {
    color: '#0080F0',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
