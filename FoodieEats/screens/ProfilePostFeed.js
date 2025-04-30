import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Image, ActivityIndicator, Alert, Modal, TouchableWithoutFeedback } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { ALERT_TYPE, Dialog, AlertNotificationRoot } from 'react-native-alert-notification';
import { SafeAreaView } from 'react-native-safe-area-context';
import PostComponent from './PostComponent';

export default function ProfilePostFeed() {
  const route = useRoute();
  const navigation = useNavigation();
  const { userId, initialPostId } = route.params; // userId of the profile owner

  const [posts, setPosts] = useState([]);
  const [loggedInUserId, setLoggedInUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionSheetVisible, setActionSheetVisible] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [initialScrollDone, setInitialScrollDone] = useState(false); // Track if initial scroll happened
  const flatListRef = useRef(null);

  // Fetch logged-in user ID once on mount
  useEffect(() => {
    fetchLoggedInUser();
  }, []);

  // Re-fetch posts whenever the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchPosts();
      // Reset initial scroll flag when focusing, allows re-scrolling if needed
      // setInitialScrollDone(false); // Keep this commented unless specific re-scroll logic is needed
      return () => {
        // Optional cleanup
      };
    }, [userId]) // Dependency array ensures it refetches if the profile userId changes
  );

  const fetchLoggedInUser = async () => {
    try {
      const id = await AsyncStorage.getItem('userID');
      setLoggedInUserId(id);
    } catch (e) {
      console.error("Failed to fetch logged-in user ID from storage", e);
    }
  };

  const fetchPosts = async () => {
    console.log(`Fetching posts for user: ${userId}`); // Log user ID being fetched
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${process.env.EXPO_PUBLIC_API_URL}/api/posts/${userId}/posts`);
//      console.log(`Fetched ${response.data.length} posts.`); // Log number of posts fetched
//      // Add user_id to each post object client-side as the API doesn't populate it
//      const postsWithUserId = response.data.map(post => ({
//          ...post,
//          user_id: userId // Add the profile owner's ID here
//      }));
//      setPosts(postsWithUserId);
      console.log("Response:", response.data);
      setPosts(response.data);
      // Reset scroll flag only when posts are successfully fetched for a *new* user
      // This prevents resetting if fetchPosts runs on focus for the same user
      setInitialScrollDone(false); 
    } catch (err) {
      console.error('Error fetching posts:', err.response?.data || err.message);
      setError('Failed to load posts.');
      Dialog.show({
        type: ALERT_TYPE.DANGER,
        title: 'Error',
        textBody: 'Could not load posts. Please try again later.',
        button: 'Close',
      });
    } finally {
      setLoading(false);
    }
  };

  // --- Delete Handler ---
  const handleDeletePost = async (postIdToDelete) => {
    if (!loggedInUserId || loggedInUserId !== userId) { // Double check ownership
      console.error("Delete attempt failed: User does not own this post or is not logged in.");
      Dialog.show({ type: ALERT_TYPE.WARNING, title: 'Error', textBody: 'You can only delete your own posts.', button: 'Close' });
      return;
    }

    Alert.alert(
      "Delete Post",
      "Are you sure you want to delete this post? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          onPress: async () => {
            console.log(`Attempting delete: User ${loggedInUserId}, Post ${postIdToDelete}`);
            try {
              const response = await axios.delete(`${process.env.EXPO_PUBLIC_API_URL}/api/posts/${loggedInUserId}/posts/${postIdToDelete}`);
              if (response.status === 200) {
                setPosts(currentPosts => currentPosts.filter(post => post._id !== postIdToDelete));
                Dialog.show({ type: ALERT_TYPE.SUCCESS, title: 'Success', textBody: 'Post deleted successfully.', button: 'Close' });
              } else {
                 throw new Error(response.data.message || 'Failed to delete post');
              }
            } catch (err) {
              console.error('Error deleting post:', err.response?.data || err.message);
              Dialog.show({ type: ALERT_TYPE.DANGER, title: 'Error', textBody: err.response?.data?.error || 'Could not delete post.', button: 'Close' });
            }
          },
          style: "destructive"
        }
      ]
    );
  };

  // --- Like Handler ---
  const handleLikeToggle = async (postId, postOwnerId) => {
    if (!loggedInUserId) {
      Dialog.show({ type: ALERT_TYPE.WARNING, title: 'Login Required', textBody: 'You must be logged in to like posts.', button: 'Close' });
      return;
    }
    if (!postOwnerId) {
        console.error("Cannot like post: Owner ID is missing from post data.");
        Dialog.show({ type: ALERT_TYPE.DANGER, title: 'Error', textBody: 'Cannot like post due to missing data.', button: 'Close' });
        return;
    }

    // Optimistic UI Update
    setPosts(currentPosts =>
      currentPosts.map(post => {
        if (post._id === postId) {
          const alreadyLiked = post.like_list?.includes(loggedInUserId);
          const newLikeCount = alreadyLiked ? (post.num_like || 1) - 1 : (post.num_like || 0) + 1;
          const newLikeList = alreadyLiked
            ? post.like_list.filter(id => id !== loggedInUserId)
            : [...(post.like_list || []), loggedInUserId];
          console.log(`Optimistic like update for post ${postId}: Liked: ${!alreadyLiked}, Count: ${newLikeCount}`);
          return { ...post, num_like: newLikeCount, like_list: newLikeList };
        }
        return post;
      })
    );

    try {
      console.log(`API Like Toggle: User ${loggedInUserId}, Post ${postId}, Owner ${postOwnerId}`);
      await axios.post(`${process.env.EXPO_PUBLIC_API_URL}/api/posts/${postOwnerId}/posts/${postId}/like/${loggedInUserId}`);
      // Success - UI already updated
    } catch (err) {
      console.error('Error toggling like:', err.response?.data || err.message);
      // Revert optimistic update on error
      setPosts(currentPosts =>
        currentPosts.map(post => {
          if (post._id === postId) {
             const originallyLiked = !post.like_list?.includes(loggedInUserId); // State *after* optimistic update, so flip
             const originalLikeCount = originallyLiked ? (post.num_like || 1) - 1 : (post.num_like || 0) + 1;
             const originalLikeList = originallyLiked
               ? post.like_list.filter(id => id !== loggedInUserId)
               : [...(post.like_list || []), loggedInUserId];
             console.log(`Reverting like update for post ${postId}: Liked: ${originallyLiked}, Count: ${originalLikeCount}`);
             return { ...post, num_like: originalLikeCount, like_list: originalLikeList };
          }
          return post;
        })
      );
      Dialog.show({ type: ALERT_TYPE.DANGER, title: 'Error', textBody: 'Could not update like status.', button: 'Close' });
    }
  };

  const renderFullPostItem = ({ item }) => {
    return (
      <PostComponent
        userId={loggedInUserId}
        owner={loggedInUserId === userId}
        dish={item}
      />
    );
  };


//  // --- Post Rendering ---
//  const renderFullPostItem = ({ item }) => {
//    const postOwnerId = item.user_id; // Get owner ID from post data
//    const isOwner = loggedInUserId === userId; // Check if logged-in user owns the profile (not necessarily the post)
//
//    return (
//      <View style={styles.postContainer}>
//        {/* Post Header */}
//        <View style={styles.postHeader}>
//           <Text style={styles.postTitle}>{item.title}</Text>
//           {isOwner && ( // Only profile owner can delete posts from their feed view
//             <TouchableOpacity onPress={() => { setSelectedPostId(item._id); setActionSheetVisible(true); }} style={styles.deleteButton}>
//               <Ionicons name="ellipsis-vertical" size={24} color="black" />
//             </TouchableOpacity>
//           )}
//        </View>
//
//        {/* Post Image */}
//        {item.media_url && <Image source={{ uri: item.media_url }} style={styles.postImage} />}
//
//        {/* Post Details */}
//        <View style={styles.postContent}>
//          <Text style={styles.description}>{item.description}</Text>
//          {/* Location */}
//          {item.restaurant_id?.name && (
//            <Text style={styles.locationText}>
//              <Ionicons name="location-sharp" size={16} color="#555" /> {item.restaurant_id.name}
//            </Text>
//          )}
//          {/* Footer with Rating, Likes, Comments */}
//          <View style={styles.postFooter}>
//             {/* Rating */}
//             <View style={styles.footerStat}>
//                <Ionicons name="star" size={18} color="gold" />
//                <Text style={styles.footerStatText}>{item.ratings?.toFixed(1) || 'N/A'}</Text>
//             </View>
//             {/* Likes */}
//             <TouchableOpacity style={styles.footerAction} onPress={() => handleLikeToggle(item._id, postOwnerId)}>
//                <Ionicons
//                    name={item.like_list?.includes(loggedInUserId) ? "heart" : "heart-outline"}
//                    size={20}
//                    color={item.like_list?.includes(loggedInUserId) ? "red" : "black"}
//                />
//                <Text style={styles.footerActionText}>{item.num_like || 0}</Text>
//             </TouchableOpacity>
//             {/* Comments */}
//             <TouchableOpacity style={styles.footerAction} onPress={() => navigation.navigate('CommentsPage', { postID: item._id })}>
//                <Ionicons name="chatbubble-outline" size={20} color="black" />
//                <Text style={styles.footerActionText}>{item.num_comments || 0}</Text>
//             </TouchableOpacity>
//          </View>
//        </View>
//      </View>
//    );
//  };

  // --- Scroll to initial post (run only once after posts are loaded) ---
  useEffect(() => {
    if (!loading && posts.length > 0 && initialPostId && flatListRef.current && !initialScrollDone) {
      const index = posts.findIndex(post => post._id === initialPostId);
      console.log(`Attempting initial scroll to index: ${index} for post ID: ${initialPostId}`);
      if (index !== -1) {
        setTimeout(() => {
          flatListRef.current?.scrollToIndex({ animated: true, index: index, viewPosition: 0.5 });
          setInitialScrollDone(true); // Mark initial scroll as done
          console.log(`Initial scroll performed to index: ${index}`);
        }, 150);
      } else {
         console.log(`Initial post ID ${initialPostId} not found in fetched posts.`);
         setInitialScrollDone(true); // Mark as done even if not found
      }
    }
  }, [loading, posts, initialPostId, initialScrollDone]);


  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" /></View>;
  }

  if (error) {
    return <View style={styles.center}><Text style={styles.errorText}>{error}</Text></View>;
  }

  if (posts.length === 0) {
    return <View style={styles.center}><Text>No posts found for this user.</Text></View>;
  }

  return (
    <AlertNotificationRoot>
      <SafeAreaView style={styles.container}>
        <FlatList
          ref={flatListRef}
          data={posts}
          renderItem={renderFullPostItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContentContainer}
          initialNumToRender={5}
          maxToRenderPerBatch={10}
          windowSize={10}
          getItemLayout={(data, index) => (
            { length: 500, offset: 500 * index, index } // Estimate height
          )}
        />

        {/* Action Sheet Modal */}
        <Modal
          transparent={true}
          visible={actionSheetVisible}
          animationType="fade"
          onRequestClose={() => setActionSheetVisible(false)}
        >
          <TouchableWithoutFeedback onPress={() => setActionSheetVisible(false)}>
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback>
                <View style={styles.actionSheetContainer}>
                  <TouchableOpacity
                    style={[styles.actionSheetButton, styles.actionSheetButtonDestructive]}
                    onPress={() => {
                      setActionSheetVisible(false);
                      if (selectedPostId) {
                        handleDeletePost(selectedPostId);
                      } else {
                        console.error("No post selected for deletion");
                        Dialog.show({ type: ALERT_TYPE.WARNING, title: 'Error', textBody: 'No post selected.', button: 'Close' });
                      }
                    }}
                  >
                    <Text style={styles.actionSheetButtonTextDestructive}>Delete Post</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionSheetButton}
                    onPress={() => setActionSheetVisible(false)}
                  >
                    <Text style={styles.actionSheetButtonText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>

      </SafeAreaView>
    </AlertNotificationRoot>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  listContentContainer: {
    paddingBottom: 20,
    paddingTop: 10,
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
  postContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginVertical: 8,
    marginHorizontal: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
    justifyContent: 'space-between',
  },
  postTitle: {
      fontWeight: 'bold',
      fontSize: 16,
      flex: 1,
      marginRight: 10,
  },
  deleteButton: {
    padding: 5,
  },
  postImage: {
    width: '100%',
    aspectRatio: 1,
  },
  postContent: {
    paddingHorizontal: 15,
    paddingTop: 10,
    paddingBottom: 5,
  },
  description: {
    marginBottom: 10,
    fontSize: 14,
    lineHeight: 20,
    color: '#333',
  },
   locationText: {
     fontSize: 14,
     color: '#555',
     marginBottom: 10,
   },
  postFooter: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 10,
    paddingBottom: 10,
  },
  footerStat: {
      flexDirection: 'row',
      alignItems: 'center',
  },
  footerStatText: {
      marginLeft: 5,
      fontSize: 14,
      color: '#333',
  },
  footerAction: {
      flexDirection: 'row',
      alignItems: 'center',
  },
  footerActionText: {
      marginLeft: 5,
      fontSize: 14,
      color: '#333',
      fontWeight: '500',
  },
  // Action Sheet Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  actionSheetContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    paddingBottom: 30,
    paddingTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
  },
  actionSheetButton: {
    paddingVertical: 15,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
   actionSheetButtonDestructive: {
     borderTopWidth: 0,
   },
  actionSheetButtonText: {
    fontSize: 18,
    color: '#007AFF',
  },
  actionSheetButtonTextDestructive: {
    fontSize: 18,
    color: '#FF3B30',
    fontWeight: 'bold',
  },
});