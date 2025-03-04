import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { useNavigation } from "@react-navigation/native";
import { FontAwesome } from '@expo/vector-icons';
import axios from 'axios';


const { width } = Dimensions.get('window');

export default function TempPostComponent(props, item) {
  const { user, token } = props.route?.params || {};

  const [likes, setLikes] = useState(item.like_list.length);
  const [isLiked, setIsLiked] = useState(item.like_list.includes('67045cebfe84a164fa7085a9')); // Replace with actual user ID
  const navigation = useNavigation();

  const userId = '67045cebfe84a164fa7085a9'; // Replace with actual user ID

  const handleLike = async () => {
    try {
      const updatedLikes = isLiked ? likes - 1 : likes + 1;
      setLikes(updatedLikes);
      setIsLiked(!isLiked);

      console.log(item.user_id);
      console.log(item._id);

      await axios.post(`${process.env.EXPO_PUBLIC_API_URL}/posts/${item._id}/like/${userId}`);

      try {
        if(!isLiked) {
          await axios.post(`${process.env.EXPO_PUBLIC_API_URL}/users/${userId}/like/${item._id}`);
        } else {
          await axios.post(`${process.env.EXPO_PUBLIC_API_URL}/users/${userId}/unlike/${item._id}`);
        }
      } catch (error) {
        console.error('Error updating user\'s likes:', error);
      }

    } catch (error) {
      console.error('Error updating like on post:', error);
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

  return (
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
        <TouchableOpacity onPress={handleLike} style={styles.likeContainer}>
          <FontAwesome name={isLiked ? 'heart' : 'heart-o'} size={30} color='#0080F0' />
          <Text style={styles.likes}>{likes} {likes === 1 ? 'like' : 'likes'}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => navigation.navigate("CommentsPage", { props: props, postId: item._id, userId: userId })}
          style={styles.commentsButton}
        >
          <Text style={styles.commentsText}>
            {item.comment_list.length} {item.comment_list.length === 1 ? "Comment" : "Comments"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  postContainer: {
    marginTop: 10,
    marginBottom: 25,
  },
  descriptionContainer: {
    padding: 10,
  },
  likeContainer: {
    flexDirection: 'row',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  avatar: {
    width: width / 7,
    height: width / 7,
    borderRadius: 100,
    marginRight: width / 40,
    marginLeft: 10
  },
  username: {
    color: "#000",
    fontSize: width / 20,
    fontWeight: 700,
    letterSpacing: 0.5,
  },
  media: {
    width: width,
    height: width,
    alignItems: 'center',
    marginVertical: 5,
  },
  itemName: {
    fontSize: width / 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  restaurantName: {
    fontSize: width / 25,
    color: '#555',
    textAlign: 'center',
  },
  title: {
    fontSize: width / 22,
    fontWeight: 'bold',
  },
  description: {
    fontSize: width / 22,
  },
  starContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 5,
  },
  star: {
    marginHorizontal: width / 70,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 10,
    marginTop: 10,
  },
  likes: {
    color: '#0080F0',
    fontSize: 16,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  commentsButton: {
    backgroundColor: '#fff',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  commentsText: {
    color: '#0080F0',
    fontSize: 15,
    fontWeight: 'bold',
  },
});
