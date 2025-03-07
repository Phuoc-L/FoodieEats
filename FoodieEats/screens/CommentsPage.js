import React, { useEffect, useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, Text, TextInput, Button, FlatList, TouchableOpacity, StyleSheet, Image, Dimensions } from "react-native";
import axios from 'axios';
import { FontAwesome } from '@expo/vector-icons';


const { width } = Dimensions.get('window');

const CommentsPage = ({ route }) => {
    const { postId, userId } = route.params;

    const { user, token } = props.route.params || {};

    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState("");

    useFocusEffect(
        useCallback(() => {
            fetchComments();
        }, [])
    );

    const fetchComments = async () => {
        try {
            const response = await axios.get(`${process.env.EXPO_PUBLIC_API_URL}/comments/${postId}/comments`);
            setComments(response.data);
        } catch (error) {
            console.error("Error fetching comments:", error);
        }
    };

    const handleCommentSubmit = async () => {
        if (!newComment.trim()) return; // Prevent empty comments

        try {
            const response = await axios.post(`${process.env.EXPO_PUBLIC_API_URL}/comments/${postId}/comment/${userId}`, {
                comment: newComment,
            });

            if (response.status === 201) {
                setComments([...comments, response.data.comment]); // Update UI
                setNewComment(""); // Clear input field
            }
        } catch (error) {
            console.error("Error adding comment:", error);
        }
    };

    const handleLike = async (commentId) => {
        try {
            const response = await axios.post(`${process.env.EXPO_PUBLIC_API_URL}/comments/${commentId}/like/${userId}`);

            if (response.status === 200) {
                const updatedComment = response.data.comment;

                setComments(comments.map(comment =>
                    comment._id === commentId
                        ? { ...comment, num_likes: updatedComment.num_likes, like_list: updatedComment.like_list }
                        : comment
                ));
            }
        } catch (error) {
            console.error('Error updating like on post:', error);
        }
    };

    const handleDeleteComment = async (commentId) => {
        try {
            const response = await axios.delete(
                `${process.env.EXPO_PUBLIC_API_URL}/comments/${postId}/comment/${commentId}/user/${userId}`
            );

            if (response.status === 200) {
                setComments(comments.filter(comment => comment._id !== commentId));
            }
        } catch (error) {
            console.error('Error deleting comment:', error);
        }
    };

    const renderComment = ({ item }) => {
        const hasLiked = item.like_list.includes(userId);
        const isCurrentUser = item.user_id._id === userId;

        return (
            <View style={styles.commentContainer}>
                <View style={styles.header}>
                    <View style={styles.userInfo}>
                        <Image source={{ uri: item.user_id.profile.avatar_url }} style={styles.avatar} />
                        <Text style={styles.username}>@{item.user_id.username}</Text>
                    </View>

                    <TouchableOpacity onPress={() => handleLike(item._id)} style={styles.likeContainer}>
                        <Text style={styles.likeCount}>{item.num_likes}</Text>
                        <FontAwesome
                            name={hasLiked ? "heart" : "heart-o"}
                            size={20}
                            color={hasLiked ? 'red' : '#000'}
                        />
                    </TouchableOpacity>
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
            />

            <TextInput
                style={styles.input}
                placeholder="Add a comment..."
                value={newComment}
                onChangeText={setNewComment}
            />


            <TouchableOpacity style={styles.button} onPress={handleCommentSubmit}>
                <Text style={styles.buttonText}>Submit</Text>
            </TouchableOpacity>
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
