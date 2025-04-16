import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, Image, TouchableOpacity, Dimensions, Button } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { FontAwesome } from '@expo/vector-icons';
import { useNavigation } from "@react-navigation/native";
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import axios from 'axios';


const { width } = Dimensions.get('window');

//export default function RestaurantPage({ route }) {
//    const { restaurantId } = route.params || {};

export default function RestaurantPage() {
    const restaurantId = '670373b1d9077967850ae902';

    const [restaurant, setRestaurant] = useState("");
    const [isOwner, setIsOwner] = useState(false);
    const [userData, setUserData] = useState(null);

    const navigation = useNavigation();

    useFocusEffect(
        useCallback(() => {
            const fetchRestaurant = async () => {
                try {
                    const res = await axios.get(
                        `${process.env.EXPO_PUBLIC_API_URL}/api/restaurants/${restaurantId}`
                    );
                setRestaurant(res.data);
                } catch (err) {
                    console.error("Error fetching restaurant:", err);
                }
            };
            fetchRestaurant();
        }, [restaurantId])
    );


    useEffect(() => {
        const readUser = async () => {
//            const id = await AsyncStorage.getItem('user');
//            const owner = await AsyncStorage.getItem('owner');
            const id   = "670378a8d9077967850ae906";
            const owner = false;
            setUserData({ id, owner });
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
                const res = await axios.get(
                    `${process.env.EXPO_PUBLIC_API_URL}/api/restaurants/${restaurantId}/isOwner/${userData.id}`
                );
                setIsOwner(res.status === 200 && res.data.result);
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
                onPress={() => navigation.navigate("DishReviews", { dish: item })}
                style={styles.menuItemContainer}
            >
                <View style={styles.dishHeader}>
                    <Text style={styles.dishTitle}>{item.name}</Text>
                    <View style={styles.rating}>
                        <View style={styles.starRating}>
                            <Text style={styles.dishRatingValue}>{parseFloat(item.average_rating).toFixed(1)}</Text>
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

    return(
        <View style={styles.container}>
            <View style={styles.titleContainer}>
                {isOwner ? (
                    <View style={styles.ownerTitleRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.title, { textAlign: 'left' }]} numberOfLines={0}>
                          {restaurant.name}
                        </Text>
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
                            <Text style={styles.restaurantRatingValue}>{parseFloat(restaurant.average_rating).toFixed(1)}</Text>
                            <FontAwesome
                                name={"star"}
                                size={width / 13}
                                color="#0080F0"
                                style={{ paddingHorizontal: 3 }}
                            />
                        </View>
                        <Text style={styles.restaurantNumRatings}>
                            ({restaurant.num_posts}
                            {restaurant.num_posts === 1 ? " review" : " reviews"})
                        </Text>
                    </View>
                </View>
            </View>
            <Text style={[styles.title, { textAlign: 'center', marginTop: 20 }]}>Menu</Text>
            <FlatList
                data={restaurant.menu}
                keyExtractor={(item) => item._id}
                renderItem={renderMenuItem}
                contentContainerStyle={{ paddingBottom: isOwner ? 100 : 0 }}
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
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 20,
    },
    titleContainer: {
        backgroundColor: "fff",
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: "#ccc",
    },
    ownerTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
        width: '100%',
        columnGap: 10,
    },
    title: {
        fontSize: width / 12,
        color: "#000",
        fontWeight: '600',
        flex: 1,
        flexWrap: 'wrap',
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
        bottom: 20,
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
});
