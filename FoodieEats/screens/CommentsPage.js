import React, { useEffect, useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, Text, TextInput, Button, FlatList, TouchableOpacity, StyleSheet, Image, Dimensions } from "react-native";
import axios from 'axios';
import { FontAwesome } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage'; // Import AsyncStorage


const { width } = Dimensions.get('window');

const CommentsPage = ({ route }) => {
    const { postId } = route.params; // Only get postId from params
 
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState("");
    const [loggedInUserId, setLoggedInUserId] = useState(null);
    const [isOwner, setIsOwner] = useState(true);

    useFocusEffect(
        useCallback(() => {
            const initialize = async () => {
                try {
                    const id = await AsyncStorage.getItem('userID');
                    const owner = await AsyncStorage.getItem('owner');
                    setLoggedInUserId(id);
                    setIsOwner(owner.toLowerCase() === "true");

                    // Only call fetchComments *after* user ID is available
                    const response = await axios.get(`${process.env.EXPO_PUBLIC_API_URL}/api/comments/${postId}/comments`);
                    setComments(response.data);
                } catch (e) {
                    console.error("Initialization error:", e);
                }
            };

            initialize();
        }, [postId])
    );

    const handleCommentSubmit = async () => {
        if (!newComment.trim()) return;

        try {
            const response = await axios.post(
                `${process.env.EXPO_PUBLIC_API_URL}/api/comments/${postId}/comment/${loggedInUserId}`, // Use loggedInUserId state
            {
                comment: newComment,
            });

            if (response.status === 201) {
                setComments([...comments, response.data.comment]);
                setNewComment("");
            }
        } catch (error) {
            console.error("Error adding comment:", error);
        }
    };

    const handleLike = async (commentId) => {
        if (isOwner) return;

        if (!commentId || !loggedInUserId) {
            console.error("Missing commentId or loggedInUserId", commentId, loggedInUserId);
            return;
        }

        const targetComment = comments.find(c => c._id === commentId);
        const alreadyLiked = targetComment?.like_list?.includes(loggedInUserId);

        setComments(prevComments =>
            prevComments.map(comment =>
                comment._id === commentId
                    ? {
            ...comment,
                  num_likes: alreadyLiked
                    ? Math.max(0, comment.num_likes - 1)
                    : comment.num_likes + 1,
                  like_list: alreadyLiked
                    ? comment.like_list.filter(id => id !== loggedInUserId)
                    : [...comment.like_list, loggedInUserId]
                }
              : comment
          )
        );

        try {
            await axios.post(`${process.env.EXPO_PUBLIC_API_URL}/api/comments/${commentId}/like/${loggedInUserId}`);
        } catch (error) {
            console.error('Error updating like on comment:', error);
        }
    };


    const renderLikeSection = (item) => {
        const isLiked = item.like_list.includes(loggedInUserId);

        const HeartIcon = (
            <FontAwesome
                name={isOwner ? "heart" : isLiked ? "heart" : "heart-o"}
                size={20}
                color={isOwner ? "#ababab" : "#0080F0"}
            />
        );

        return isOwner ? (
            <View style={styles.likeContainer}>
                <Text style={styles.likeCount}>{item.num_likes}</Text>
                {HeartIcon}
            </View>
        ) : (
            <TouchableOpacity onPress={() => handleLike(item._id)} style={styles.likeContainer}>
                <Text style={styles.likeCount}>{item.num_likes}</Text>
                {HeartIcon}
            </TouchableOpacity>
        );
    };

    const handleDeleteComment = async (commentId) => {
        try {
            const response = await axios.delete(
                `${process.env.EXPO_PUBLIC_API_URL}/api/comments/${postId}/comment/${commentId}/user/${loggedInUserId}`
            );

            if (response.status === 200) {
                setComments(comments.filter(comment => comment._id !== commentId));
            }
        } catch (error) {
            console.error('Error deleting comment:', error);
        }
    };

    const renderComment = ({ item }) => {
        const hasLiked = item.like_list.includes(loggedInUserId); // Use loggedInUserId state
        const isCurrentUser = item.user_id._id === loggedInUserId; // Use loggedInUserId state

        return (
            <View style={styles.commentContainer}>
                <View style={styles.header}>
                    <View style={styles.userInfo}>
                        <Image source={{ uri: item.user_id.profile.avatar_url }} style={styles.avatar} />
                        <Text style={styles.username}>@{item.user_id.username}</Text>
                    </View>

                    {renderLikeSection(item)}
                </View>

                <View style={styles.commentRow}>
                    <Text style={styles.commentText}>{item.comment}</Text>

                    {isCurrentUser && (
                        <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteComment(item._id)}>
                            <Text style={styles.deleteButtonText}>Delete</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        )
    };

    return (
        <View style={styles.container}>
            {/* Comments List */}
            <FlatList
                data={comments}
                keyExtractor={(item) => item._id}
                renderItem={renderComment}
                contentContainerStyle={comments.length === 0 ? styles.emptyContainer : styles.feed}
                ListEmptyComponent={<Text style={styles.emptyText}>No comments to show.</Text>}
            />

            <TextInput
                style={[
                    styles.input,
                    isOwner && styles.disabledInput
                ]}
                placeholder={isOwner ? "Commenting unavailable" : "Add a comment..."}
                value={newComment}
                editable={!isOwner}
                onChangeText={setNewComment}
            />


            {!isOwner && (
                <TouchableOpacity
                    style={[
                        styles.button,
                        isOwner && styles.disabledButton  // ← visually gray out button too
                    ]}
                    onPress={handleCommentSubmit}
                    disabled={isOwner}                 // ← prevent pressing if owner
                >
                    <Text style={styles.buttonText}>
                        Submit
                    </Text>
                </TouchableOpacity>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 10,
        backgroundColor: "#fff",
    },
    commentContainer: {
        paddingVertical: 8,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between", // Ensures avatar & username are left, heart is right
    },
    userInfo: {
        flexDirection: "row",
        alignItems: "center",
    },
    avatar: {
        width: width / 15,
        height: width / 15,
        borderRadius: 100,
        marginRight: width / 70,
        marginLeft: 0,
    },
    comment: {
        borderBottomWidth: 1,
        borderBottomColor: "#ccc",
        paddingVertical: 8,
    },
    disabledInput: {
        backgroundColor: "#eee",
        color: "#aaa",
    },
    username: {
        fontWeight: "bold",
    },
    commentText: {
        fontSize: 16,
    },
    input: {
        borderWidth: 1,
        borderColor: "#ccc",
        padding: 10,
        borderRadius: 5,
        marginTop: 10,
    },
    button: {
        backgroundColor: "#007bff",
        padding: 10,
        borderRadius: 5,
        alignItems: "center",
        marginTop: 10,
    },
    disabledButton: {
        backgroundColor: "#ccc",
    },
    buttonText: {
        color: "#fff",
        fontWeight: "bold",
    },
    likeContainer: {
        flexDirection: 'row',
    },
    likeCount: {
        color: '#000',
        fontSize: 14,
        paddingHorizontal: 10,
    },
    commentRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 5,
        borderBottomWidth: 1,
        borderBottomColor: "#ccc",
        paddingVertical: 8,
    },
    commentText: {
        fontSize: 16,
        flex: 1,
    },
    deleteButton: {
        paddingVertical: 5,
        paddingHorizontal: 10,
        backgroundColor: "#f8d7da",
        borderRadius: 5,
    },
    deleteButtonText: {
        color: "red",
        fontWeight: "bold",
    },
});

export default CommentsPage;
