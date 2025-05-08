import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, Image, TouchableOpacity, Dimensions, Button, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { FontAwesome } from '@expo/vector-icons';
import { useNavigation } from "@react-navigation/native";
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import NavigationBar from './Navigation';


const { width } = Dimensions.get('window');

export default function RestaurantPage({ route }) {
    const { restaurantId } = route.params || {};

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [restaurant, setRestaurant] = useState({});
    const [isOwner, setIsOwner] = useState(null);
    const [userData, setUserData] = useState(null);

    const navigation = useNavigation();


    useEffect(() => {
        const fetchRestaurant = async () => {
            setLoading(true);
            setError(null);

            try {
                const res = await axios.get(
                    `${process.env.EXPO_PUBLIC_API_URL}/api/restaurants/${restaurantId}`
                );
                setRestaurant(res.data);
            } catch (err) {
                console.error("Error fetching restaurant:", err);
                setError("Unable to load this restaurant page.");
            } finally {
                setLoading(false);
            }
        };
        fetchRestaurant();
    }, [restaurantId]);


    useEffect(() => {
        const readUser = async () => {
            const id = await AsyncStorage.getItem('userID');
            const owner_string = await AsyncStorage.getItem('owner');
            const restaurant_id = await AsyncStorage.getItem('restaurantId');

            const owner = (owner_string.toLowerCase() === "true");

            setUserData({ id, owner, restaurant_id });
        };
        readUser();
    }, []);


    useEffect(() => {
        const checkOwner = async () => {
            if (!userData || !userData.owner) {
                setIsOwner(false);
                return;
            }
            try {
                setIsOwner(userData.restaurant_id === restaurantId);
            } catch (err) {
                console.error("Error checking owner:", err);
                setIsOwner(false);
            }
        };
        checkOwner();
    }, [userData, restaurantId]);

    const renderMenuItem = ({ item }) => {
        return (
            <TouchableOpacity
                onPress={() => navigation.navigate("DishReviews", { dish_id: item._id, restaurant_id: restaurant._id })}
                style={styles.menuItemContainer}
            >
                <View style={styles.dishHeader}>
                    <Text style={styles.dishTitle}>{item.name}</Text>
                    <View style={styles.rating}>
                        <View style={styles.starRating}>
                            <Text style={styles.dishRatingValue}>
                                {item.num_ratings === 0
                                    ? "N/A"
                                    : parseFloat(item.average_rating).toFixed(1)}
                            </Text>
                            <FontAwesome
                                name={"star"}
                                size={width / 18}
                                color="#0080F0"
                                style={{ paddingHorizontal: 5 }}
                            />
                        </View>
                        <Text style={styles.dishNumRatings}>
                            ({item.num_ratings}
                            {item.num_ratings === 1 ? " review" : " reviews"})
                        </Text>
                    </View>
                </View>
                <View>
                    <Text style={styles.dishPrice}>${item.price}</Text>
                </View>
                <View style={styles.dishDetails}>
                    <Text style={styles.dishDetailsText}>{item.description}</Text>
                </View>
            </TouchableOpacity>
        );
    };

    const LogoutButton = () => {
        if (!isOwner) return null;

        return (
            <TouchableOpacity onPress={() => navigation.navigate('Auth')}>
                <MaterialIcons name="logout" size={24} style={styles.logout} />
            </TouchableOpacity>
        );
    };

    const isRestaurantInfoEmpty =
        (restaurant.location ?? "").trim() === "" &&
        (restaurant.operating_hours ?? "").trim() === "" &&
        (restaurant.contact_info?.phone ?? "").trim() === "" &&
        (restaurant.contact_info?.email ?? "").trim() === "";


    if (loading || (restaurant?.name === "" && isOwner === null)) {
        return (
            <View style={{ flex: 1 }}>
                <View style={styles.center}>
                    <ActivityIndicator size="large" />
                </View>

                <NavigationBar />
            </View>
        );
    }

    if (error) {
        return (
            <View style={{ flex: 1 }}>
                <View style={styles.center}>
                    <Text style={styles.errorText}>{error}</Text>
                </View>

                <NavigationBar />
            </View>
        );
    }

    if (restaurant.name === "" && isOwner === false) {
        return (
            <View style={{ flex: 1 }}>
                <View style={styles.center}>
                    <Text style={styles.errorText}>
                        You are not permitted to view this restaurant.
                    </Text>
                </View>

                <NavigationBar />
            </View>
        );
    }

    return(
        <View style={styles.container}>
            <View style={styles.titleContainer}>
                {isOwner ? (
                    <View style={styles.ownerTitleRow}>
                        <View style={{ flex: 1 }}>
                            {restaurant.name === "" ? (
                                <Text style={[styles.title, { textAlign: 'left', color: 'gray' }]} numberOfLines={0}>
                                    Pending Setup
                                </Text>
                            ) : (
                                <Text style={[styles.title, { textAlign: 'left' }]} numberOfLines={0}>
                                    {restaurant.name}
                                </Text>
                            )}
                        </View>
                        <TouchableOpacity onPress={() => navigation.navigate('Auth')}>
                            <MaterialIcons name="logout" size={28} style={styles.logout} />
                        </TouchableOpacity>
                    </View>
                ) : (
                    <Text style={[styles.title, { textAlign: 'center' }]}>
                        {restaurant.name}
                    </Text>
                )}

                {isRestaurantInfoEmpty ? (
                    <View style={{ alignItems: 'center', padding: 20 }}>
                        <View style={styles.starRating}>
                            <Text style={[styles.restaurantRatingValue, { fontSize: width / 15 }]}>
                                {restaurant.num_reviews === 0
                                    ? "N/A"
                                    : parseFloat(restaurant.average_rating).toFixed(1)}
                            </Text>
                            <FontAwesome
                                name="star"
                                size={width / 12}
                                color="#0080F0"
                                style={{ paddingHorizontal: 3 }}
                            />
                        </View>
                        <Text style={[styles.restaurantNumRatings, { fontSize: width / 26 }]}>
                            ({restaurant.num_reviews}
                            {restaurant.num_reviews === 1 ? " review" : " reviews"})
                        </Text>
                    </View>
                ) : (
                    <View style={styles.restaurantInfo}>
                        <View style={styles.restaurantDetails}>
                            <View>
                                { (restaurant.location ?? "").trim() !== "" && (
                                    <Text style={styles.detailsText}>
                                        <Text style={{ fontWeight: 'bold' }}>Location: </Text>
                                        {restaurant.location}
                                    </Text>
                                )}

                                { (restaurant.operating_hours ?? "").trim() !== "" && (
                                    <Text style={styles.detailsText}>
                                        <Text style={{ fontWeight: 'bold' }}>Hours: </Text>
                                        {restaurant.operating_hours}
                                    </Text>
                                )}

                                { (restaurant.contact_info?.phone ?? "").trim() !== "" && (
                                    <Text style={styles.detailsText}>
                                        <Text style={{ fontWeight: "bold" }}>Phone: </Text>
                                        {restaurant.contact_info.phone}
                                    </Text>
                                ) }
                                { (restaurant.contact_info?.email ?? "").trim() !== "" && (
                                    <Text style={styles.detailsText}>
                                        <Text style={{ fontWeight: "bold" }}>Email: </Text>
                                        {restaurant.contact_info.email}
                                    </Text>
                                ) }
                            </View>
                        </View>
                        <View style={styles.rating}>
                            <View style={styles.starRating}>
                                <Text style={styles.restaurantRatingValue}>
                                    {restaurant.num_reviews === 0
                                        ? "N/A"
                                        : parseFloat(restaurant.average_rating).toFixed(1)}
                                </Text>
                                <FontAwesome
                                    name={"star"}
                                    size={width / 13}
                                    color="#0080F0"
                                    style={{ paddingHorizontal: 3 }}
                                />
                            </View>

                            <Text style={styles.restaurantNumRatings}>
                                ({restaurant.num_reviews}
                                {restaurant.num_reviews === 1 ? " review" : " reviews"})
                            </Text>
                        </View>
                    </View>
                )}
            </View>
            <Text style={[styles.menuTitle, { textAlign: 'center', marginVertical: 20 }]}>Menu</Text>
            <FlatList
                data={restaurant.menu}
                keyExtractor={(item) => item._id}
                renderItem={renderMenuItem}
                contentContainerStyle={
                    restaurant.menu.length === 0
                    ? [styles.emptyContainer, { paddingHorizontal: 20, paddingBottom: isOwner ? 130 : 0 }]
                    : { paddingHorizontal: 20, paddingBottom: isOwner ? 130 : 0 }
                }
                ListEmptyComponent={<Text style={styles.emptyText}>No menu items to show.</Text>}
            />
            {isOwner && (
                <View style={styles.editButtonContainer}>
                    <TouchableOpacity
                        style={styles.editButton}
                        onPress={() => navigation.navigate("EditRestaurant", { restaurantId: restaurantId })}
                    >
                        <Text style={styles.editButtonText}>Edit</Text>
                    </TouchableOpacity>
                </View>
            )}


            <NavigationBar />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    titleContainer: {
        backgroundColor: "fff",
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: "#ccc",
        padding: 20,
    },
    ownerTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
        width: '100%',
        columnGap: 10,
    },
    title: {
        fontSize: width / 10,
        color: "#FF8000",
        flexWrap: 'wrap',
        fontWeight: '800',
    },
    menuTitle: {
        fontSize: width / 12,
        color: "#000",
        flexWrap: 'wrap',
        fontWeight: '600',
    },
    logout: {
        color: '#000',
        paddingLeft: 10,
    },
    restaurantInfo: {
        width: width-20,
        flexDirection: 'row',
        justifyContent: "space-between",
        alignItems: 'center',
        marginTop: 12,
        marginBottom: 12,
    },
    restaurantDetails: {
        flexShrink: 1,
        marginRight: 10,
    },
    detailsText: {
        fontSize: width / 25,
        color: '#555',
        padding: 3,
        flexWrap: 'wrap',
    },
    rating: {
        alignItems: 'center',
        minWidth: width/5,
    },
    starRating: {
        alignItems: 'center',
        flexDirection: 'row',
    },
    restaurantRatingValue: {
        color: '#0080F0',
        fontSize: width / 18,
        paddingHorizontal: 5,
    },
    restaurantNumRatings: {
        color: '#555',
        fontSize: width / 29,
        paddingHorizontal: 5,
    },
    menuItemContainer: {
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: "#ccc",
    },
    dishHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    dishTitle: {
        fontSize: width / 16,
        fontWeight: 'bold',
        marginRight: 15,
        flex: 1,
    },
    dishRatingValue: {
        color: '#0080F0',
        fontSize: width / 22,
        paddingHorizontal: 3,
    },
    dishNumRatings: {
        color: '#555',
        fontSize: width / 29,
        paddingHorizontal: 3,
    },
    dishPrice: {
        fontSize: width / 22,
        color: '#555',
        padding: 3,
    },
    dishDetails: {
        paddingHorizontal: 10,
        paddingVertical: 5,
    },
    dishDetailsText: {
        flexWrap: 'wrap',
        fontSize: width / 25,
        color: '#555',
    },
    editButtonContainer: {
        position: 'absolute',
        bottom: 60,
        left: 20,
        right: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },

    editButton: {
        backgroundColor: '#0080F0',
        paddingVertical: 12,
        paddingHorizontal: 30,
        borderRadius: 25,
        width: '100%',
        alignItems: 'center',
    },

    editButtonText: {
        color: 'white',
        fontSize: width / 20,
        fontWeight: 'bold',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        paddingBottom: 60,
    },
    errorText: {
        color: 'red',
        fontSize: 16,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    feed: {
        paddingBottom: 60,
    },
    emptyText: {
        textAlign: 'center',
        fontSize: 18,
        color: 'gray',
        marginBottom: 60,
    },
});
