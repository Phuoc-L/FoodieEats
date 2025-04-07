import React, { useEffect, useState, useCallback } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import TempPostComponent from './TempPostComponent';
import axios from 'axios';


export default function DishReviews({ route }) {
    const { dish } = route.params || {};

    console.log("Dish:", dish);

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
//            const user_id = await AsyncStorage.getItem('user');
            const user_id = '67045cebfe84a164fa7085a9'
            if (!user_id) {
                console.error('User ID not found in AsyncStorage');
                return;
            }
            setUserId(user_id);
            const url = process.env.EXPO_PUBLIC_API_URL + '/api/users/' + user_id
            console.log("GET", url);
            const user = await axios.get(process.env.EXPO_PUBLIC_API_URL + '/api/users/' + user_id);
            console.log("Fetched user:", user.data);
            setCurrentUser(user.data);
        } catch (e) {
            console.error(e);
        }
    };

    const fetchPosts = async () => {
        const response = await axios.get(`${process.env.EXPO_PUBLIC_API_URL}/api/restaurants/${dish._id}/reviews`);
        console.log("Posts:", response.data);

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
                renderItem={({ item }) => <TempPostComponent
                    userId={userId} currentUser={currentUser} dish={item}
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