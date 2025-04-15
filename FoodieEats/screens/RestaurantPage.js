import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, Image, TouchableOpacity, Dimensions, Button } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { FontAwesome } from '@expo/vector-icons';
import { useNavigation } from "@react-navigation/native";
import axios from 'axios';


const { width } = Dimensions.get('window');

//export default function RestaurantPage({ route }) {
//    const { restaurantId } = route.params || {};

export default function RestaurantPage() {
    const restaurantId = '670373b1d9077967850ae902';

    const [restaurant, setRestaurant] = useState("");
    const [isOwner, setIsOwner] = useState("");
    const [userData, setUserData] = useState({});

    const navigation = useNavigation();

    useFocusEffect(
        useCallback(() => {
          const initialize = async () => {
            await getData();
            fetchRestaurant();
          };
          initialize();
        }, [])
      );

    const fetchRestaurant = async () => {
        const response = await axios.get(
            `${process.env.EXPO_PUBLIC_API_URL}/api/restaurants/${restaurantId}`
        );
        setRestaurant(response.data);
    };

    const getData = async () => {
        try {
//          const user_id = await AsyncStorage.getItem('user');
//          const user_role = await AsyncStorage.getItem('role');
            const user_id = '670378a8d9077967850ae906';
            const user_role = 'owner';
            if (!user_id) {
                console.error('User data not found in AsyncStorage');
                return;
            }
            setUserData({"id": user_id, "role": user_role});

            if (userData.role == "owner") {
                const isOwnerResponse = await axios.get(
                    `${process.env.EXPO_PUBLIC_API_URL}/api/restaurants/${restaurantId}/isOwner/${userData.id}`
                );

                if (isOwnerResponse.status == 200) {
                    setIsOwner(isOwnerResponse.data.result);
                } else {
                    setIsOwner(false);
                }
            } else {
                setIsOwner(false);
            }
        } catch (e) {
            console.error(e);
        }
      };

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

    return(
        <View style={styles.container}>
            <View style={styles.titleContainer}>
                <Text style={styles.title}>{restaurant.name}</Text>
                <View style={styles.restaurantInfo}>
                    <View style={styles.restaurantDetails}>
                        <View>
                            <Text style={styles.detailsText}>
                                <Text style={{ fontWeight: 'bold' }}>Location: </Text>
                                {restaurant.location}
                            </Text>
                            <Text style={styles.detailsText}>
                                <Text style={{ fontWeight: 'bold' }}>Hours: </Text>
                                {restaurant.operating_hours}
                            </Text>
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
            <FlatList
                data={restaurant.menu}
                keyExtractor={(item) => item._id}
                renderItem={renderMenuItem}
            />
            {isOwner && (
                <View style={styles.editButtonContainer}>
                    <TouchableOpacity
                        style={styles.editButton}
                        onPress={() => console.log("Click!")}
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
    },
    titleContainer: {
        backgroundColor: "fff",
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: "#ccc",
    },
    title: {
        fontSize: width / 12,
        color: "#000",
        flexWrap: 'wrap',
        fontWeight: '600',
        marginBottom: 12,
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
