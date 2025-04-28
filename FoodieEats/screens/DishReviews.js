import React, { useEffect, useState, useCallback } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import PostComponent from './PostComponent';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';


export default function DishReviews({ route }) {
    const { dish } = route.params || {};

    const [posts, setPosts] = useState([]);
    const [userData, setUserData] = useState("");

    useFocusEffect(
        useCallback(() => {
            getUser();
            fetchPosts();
        }, [])
    );

    const getUser = async () => {
        try {
            const id = await AsyncStorage.getItem('userID');
            const owner = await AsyncStorage.getItem('owner');

            const isOwner = owner.toLowerCase() === "true" ? true : false;
            if (!id) {
                console.error('User ID not found in AsyncStorage');
                return;
            }
            setUserData({ id, isOwner });
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
                    userId={userData.id} owner={userData.isOwner} dish={item}
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