import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet, ActivityIndicator, SafeAreaView, Text } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import PostComponent from './PostComponent';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Dimensions } from 'react-native';


const { width } = Dimensions.get('window');

export default function DishReviews({ route }) {
    const { dish_id } = route.params || {};
    console.log("dish_id:", dish_id);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [posts, setPosts] = useState([]);

    useEffect(() => {
        const fetchPosts = async () => {
            setLoading(true);
            setError(null);

            try {
                const response = await axios.get(`${process.env.EXPO_PUBLIC_API_URL}/api/restaurants/${dish_id}/reviews`);

                if (response.status === 200) {
                    const responseData = response.data || [];
                    setPosts(responseData.posts);

                } else {
                    console.error('Error fetching posts:', response.status);
                    setError("Unexpected error while fetching reviews:", response.status);
                }
            } catch (e) {
                console.error('Error fetching posts:', e);
                setError("Unexpected error while fetching reviews.");
            } finally {
                setLoading(false);
            }
        };

        fetchPosts();
    }, []);


    return (
        <SafeAreaView style={styles.container}>
            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" />
                </View>
            ) : error ? (
                <View style={styles.center}>
                    <Text style={styles.errorText}>{error}</Text>
                </View>
            ) : (
                <FlatList
                    data={posts}
                    keyExtractor={(item) => item._id}
                    renderItem={({ item }) => <PostComponent post={item} />}
                    contentContainerStyle={styles.feed}
                />
            )}
        </SafeAreaView>
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
});