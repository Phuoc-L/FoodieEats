import React, { useEffect, useState, useCallback } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import PostComponent from './PostComponent';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';


export default function DishReviews({ route }) {
    const { dish } = route.params || {};

    const [posts, setPosts] = useState([]);
    const [currentUser, setCurrentUser] = useState("");
    const [userId, setUserId] = useState("");

    useFocusEffect(
        useCallback(() => {
            getUser();
            fetchPosts();
        }, [])
    );

    const getUser = async () => {
        try {
            const user_id = await AsyncStorage.getItem('user');
            if (!user_id) {
                console.error('User ID not found in AsyncStorage');
                return;
            }
            setUserId(user_id);
            const user = await axios.get(process.env.EXPO_PUBLIC_API_URL + '/api/users/' + user_id);
            setCurrentUser(user.data);
        } catch (e) {
            console.error(e);
        }
    };

    const fetchPosts = async () => {
        const response = await axios.get(`${process.env.EXPO_PUBLIC_API_URL}/api/restaurants/${dish._id}/reviews`);

        if (response.status === 200) {
            const responseData = response.data || [];
            setPosts(responseData.posts);

        } else {
            console.error('Error fetching posts:', response.status);
        }
    };


    return (

        <View style={styles.container}>
            <FlatList
                data={posts}
                keyExtractor={(item) => item._id}
                renderItem={({ item }) => <PostComponent
                    userId={userId} dish={item}
                />}
                contentContainerStyle={styles.feed}
            />
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