import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { useNavigation } from "@react-navigation/native";
import { FontAwesome, AntDesign } from '@expo/vector-icons';
import { Alert } from 'react-native';
import axios from 'axios';
import { ALERT_TYPE, Dialog } from 'react-native-alert-notification';
import AsyncStorage from '@react-native-async-storage/async-storage';


const { width } = Dimensions.get('window');

const PostComponent = ({ post, onDeleteSuccess }) => {
  const [likes, setLikes] = useState(post.like_list.length);
  const [isLiked, setIsLiked] = useState(false);
  const [userData, setUserData] = useState({});

  const navigation = useNavigation();
  const isCurrentUserPost = userData.id === post.user_id._id;

  useEffect(() => {
    const getData = async () => {
      try {
        const id = await AsyncStorage.getItem('userID');
        const owner = await AsyncStorage.getItem('owner');
        const isOwner = (owner.toLowerCase() === "true");
        if (!id) {
          console.error('User ID not found in AsyncStorage');
          return;
        }

        setIsLiked(post.like_list.includes(id));
        setUserData({ id, isOwner });

      } catch (e) {
        console.error(e);
      }
    };
    getData();
  }, []);

  const handleDeletePost = async () => {
    try {
      if (!userData.id || userData.id !== post.user_id._id) {
        Dialog.show({
          type: ALERT_TYPE.WARNING,
          title: 'Unauthorized',
          textBody: 'You can only delete your own posts.',
          button: 'Close',
        });
        return;
      }

      Alert.alert(
        "Delete Post",
        "Are you sure you want to delete this post? This action cannot be undone.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: async () => {
              try {
                console.log(`${process.env.EXPO_PUBLIC_API_URL}/api/posts/${userData.id}/posts/${post._id}`);
                const res = await axios.delete(
                  `${process.env.EXPO_PUBLIC_API_URL}/api/posts/${userData.id}/posts/${post._id}`
                );

                if (res.status === 200) {
                  Dialog.show({
                    type: ALERT_TYPE.SUCCESS,
                    title: 'Deleted',
                    textBody: 'Post deleted successfully.',
                    button: 'Close',
                  });

                  // Optional: Let parent know to remove this post from the feed
                  if (onDeleteSuccess) onDeleteSuccess(post._id);
                } else {
                  throw new Error('Delete failed');
                }
              } catch (err) {
                console.error("Delete failed:", err);
                Dialog.show({
                  type: ALERT_TYPE.DANGER,
                  title: 'Error',
                  textBody: 'Something went wrong while deleting.',
                  button: 'Close',
                });
              }
            },
          },
        ]
      );
    } catch (e) {
      console.error("Error deleting post:", e);
    }
  };


  const handleLike = async () => {
    if (userData.isOwner) return;
    try {
      const updatedLikes = isLiked ? likes - 1 : likes + 1;
      setLikes(updatedLikes);
      setIsLiked(!isLiked);

      const post_user_id = post.user_id._id;
      await axios.post(
        `${process.env.EXPO_PUBLIC_API_URL}/api/posts/${post_user_id}/posts/${post._id}/like/${userData.id}`
      );

      try {
        if(!isLiked) {
          await axios.post(
            `${process.env.EXPO_PUBLIC_API_URL}/api/users/${userData.id}/like/${post._id}`
          );
        } else {
          await axios.post(
            `${process.env.EXPO_PUBLIC_API_URL}/api/users/${userData.id}/unlike/${post._id}`
          );
        }
      } catch (error) {
        console.error('Error updating user\'s likes:', error);
      }

    } catch (error) {
      console.error('Error updating like on post:', error);
    }
  };

  const renderLikeSection = () => {
    const HeartIcon = (
      <FontAwesome
        name={userData.isOwner ? "heart" : isLiked ? "heart" : "heart-o"}
        size={30}
        color={userData.isOwner ? "#ababab" : "#0080F0"}
      />
    );

    return userData.isOwner ? (
      <View style={styles.likeContainer}>
        {HeartIcon}
        <Text style={styles.likes}>
          {likes} {likes === 1 ? "like" : "likes"}
        </Text>
      </View>
    ) : (
      <TouchableOpacity onPress={handleLike} style={styles.likeContainer}>
        {HeartIcon}
        <Text style={styles.likes}>
          {likes} {likes === 1 ? "like" : "likes"}
        </Text>
      </TouchableOpacity>
    );
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

  const avatarUrl = post?.user_id?.profile?.avatar_url?.trim() || null;

  return (
    <View style={styles.postContainer}>
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <Image
            source={avatarUrl ? { uri: avatarUrl} : require('../assets/defaultUserIcon.png')}
            style={styles.avatar}
          />
          <TouchableOpacity
            onPress={() => navigation.navigate("Profile", { displayUserID: post.user_id._id })}
            style={styles.usernameContainer}
          >
            <Text
              style={styles.username}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              @{post.user_id.username}
            </Text>
          </TouchableOpacity>
        </View>

        {isCurrentUserPost && (
          <TouchableOpacity
            onPress={handleDeletePost}
            style={styles.deleteButton}
          >
            <AntDesign name="delete" size={30} color="red" />
          </TouchableOpacity>
        )}
      </View>

      <Image source={{ uri: post.media_url }} style={styles.media} />

      {renderStars(post.ratings)}

      <TouchableOpacity onPress={() => navigation.navigate("DishReviews", { dish_id: post.dish_id })}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
          <Text style={styles.dishName}>{post.dish_name}</Text>
          <AntDesign name="right" size={17} color="#555" style={{ marginLeft: 5, marginTop: 5 }} />
        </View>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate("RestaurantPage", { restaurantId: post.restaurant_id._id })}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
          <Text style={styles.restaurantName}>{post.restaurant_id.name}</Text>
          <AntDesign name="right" size={15} color="#555" style={{ marginLeft: 5, marginTop: 5 }} />
        </View>
      </TouchableOpacity>

      <View style={styles.descriptionContainer}>
        <Text style={styles.description}>
          <Text style={styles.title}>{post.title}  </Text>
          {post.description}
        </Text>
      </View>

      <View style={styles.footer}>
        {renderLikeSection()}
        <TouchableOpacity
          onPress={() => navigation.navigate("CommentsPage", { postId: post._id })}
          style={styles.commentsButton}
        >
          <Text style={styles.commentsText}>
            {post.comment_list.length} {post.comment_list.length === 1 ? "Comment" : "Comments"}
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
    marginHorizontal: 15,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3, // for Android shadow
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
    paddingHorizontal: 10,
    marginBottom: 5,
    justifyContent: 'space-between',
    position: 'relative',
    paddingRight: 45,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  usernameContainer: {
    flex: 1,
    marginLeft: width / 40,
  },
  avatar: {
    width: width / 7,
    height: width / 7,
    borderRadius: 100,
  },
  username: {
    flexShrink: 1,
    color: "#000",
    fontSize: width / 20,
    fontWeight: "700",
    letterSpacing: 0.5,
    overflow: "hidden",
  },
  media: {
    width: '100%',
    aspectRatio: 1,
    marginVertical: 5,
  },
  deleteButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 2,
  },
  dishName: {
    fontSize: width / 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  restaurantName: {
    fontSize: width / 18,
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

export default PostComponent;