import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet, ActivityIndicator, SafeAreaView, Text } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import PostComponent from './PostComponent';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Dimensions } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';


const { width } = Dimensions.get('window');

export default function DishReviews({ route }) {
    const { dish_id } = route.params || {};

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [posts, setPosts] = useState([]);
    const [dish, setDish] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);

            try {
                const postRes = await axios.get(`${process.env.EXPO_PUBLIC_API_URL}/api/restaurants/${dish_id}/reviews`);
                setPosts(postRes.data?.posts || []);

                const restaurantId = postRes.data?.posts?.[0]?.restaurant_id?._id;
                if (restaurantId) {
                    const dishRes = await axios.get(`${process.env.EXPO_PUBLIC_API_URL}/api/restaurants/${restaurantId}/menu/${dish_id}`);
                    setDish(dishRes.data || null);
                }

            } catch (e) {
                console.error('Error fetching data:', e);
                setError("Unexpected error while fetching reviews.");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
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
                <View>
                    <View style={styles.header}>
                        <View style={{ flex: 1, flexShrink: 1 }}>
                            <Text style={styles.dishTitle} numberOfLines={2}>
                                {dish?.name}
                            </Text>
                            <Text style={styles.restaurantName} numberOfLines={1}>
                                {posts?.[0]?.restaurant_id?.name}
                            </Text>
                        </View>
                        <View style={styles.rating}>
                            <View style={styles.starRating}>
                                <Text style={styles.dishRatingValue}>
                                    {dish?.num_ratings === 0 ? "N/A" : parseFloat(dish.average_rating).toFixed(1)}
                                </Text>
                                <FontAwesome
                                    name="star"
                                    size={width / 14}
                                    color="#0080F0"
                                    style={{ paddingHorizontal: 5 }}
                                />
                            </View>
                            <Text style={styles.dishNumRatings}>
                                ({dish?.num_ratings ?? 0} {dish?.num_ratings === 1 ? "review" : "reviews"})
                            </Text>
                        </View>
                    </View>

                    <FlatList
                        data={posts}
                        keyExtractor={(item) => item._id}
                        renderItem={({ item }) => <PostComponent post={item} onDeleteSuccess={(deletedPostId) => {setPosts(current => current.filter(post => post._id !== deletedPostId));}}/>}
                        contentContainerStyle={styles.feed}
                    />
                </View>
            )}
        </SafeAreaView>
  );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        marginBottom: 12,
        paddingHorizontal: 20,
    },
    dishTitle: {
        fontSize: width / 16,
        fontWeight: 'bold',
        color: '#000',
        flexWrap: 'wrap',
    },
    restaurantName: {
        fontSize: width / 25,
        color: '#555',
        marginTop: 2,
    },
    rating: {
        alignItems: 'center',
        minWidth: width / 5,
    },
    starRating: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    dishRatingValue: {
        color: '#0080F0',
        fontSize: width / 18,
        paddingHorizontal: 5,
    },
    dishNumRatings: {
        color: '#555',
        fontSize: width / 29,
        paddingHorizontal: 5,
    },
    container: {
        flex: 1,
        backgroundColor: '#fff',
        paddingVertical: 20,
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