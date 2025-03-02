import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, Image, TouchableOpacity, Dimensions } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { FontAwesome } from '@expo/vector-icons';
import axios from 'axios';


const { width } = Dimensions.get('window');

export default function RestaurantPage(props) {
    const [restaurant, setRestaurant] = useState("");

    useFocusEffect(
        useCallback(() => {
          fetchRestaurant();
        }, [])
      );

    const fetchRestaurant = async () => {
        const restaurantId = '670373b1d9077967850ae902' // Replace with parameter
        const url_prefix = 'http://192.168.99.152:3000/api' // Replace with env var

        const response = await axios.get(
            `${url_prefix}/restaurants/${restaurantId}`
        );

        setRestaurant(response.data);
    };

    const renderMenuItem = ({ item }) => {
        return (
            <View style={styles.menuItemContainer}>
                <View style={styles.dishHeader}>
                    <Text style={styles.dishTitle}>{item.name}</Text>
                    <Text style={styles.dishRatingValue}>{item.average_rating}</Text>
                    <FontAwesome
                        name={"star"}
                        size={width / 18}
                        color="#0080F0"
                        style={{ paddingHorizontal: 5 }}
                    />
                    <Text style={styles.dishNumRatings}>
                        ({item.num_ratings}
                        {item.num_ratings === 1 ? " review" : " reviews"})
                    </Text>
                </View>
                <View>
                    <Text style={styles.dishPrice}>${item.price}</Text>
                </View>
                <View style={styles.dishDetails}>
                    <Text style={styles.dishDetailsText}>{item.description}</Text>
                </View>
            </View>
        );
    };

    return(
        <View style={styles.container}>
            <View style={styles.titleContainer}>
                <Text style={styles.title}>{restaurant.name}</Text>
                <View style={styles.restaurantInfo}>
                    <View style={styles.restaurantDetails}>
                        <Text style={styles.detailsText}>{restaurant.location}</Text>
                        <Text style={styles.detailsText}>{restaurant.operating_hours}</Text>
                    </View>
                    <View style={styles.rating}>
                        <View style={styles.starRating}>
                            <Text style={styles.restaurantRatingValue}>{parseFloat(restaurant.average_rating).toFixed(1)}</Text>
                            <FontAwesome
                                name={"star"}
                                size={width / 13}
                                color="#0080F0"
                                style={{ paddingHorizontal: 5 }}
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
    },
    detailsText: {
        fontSize: width / 25,
        color: '#555',
        padding: 3,
    },
    rating: {
        alignItems: 'center',
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

    },
    dishTitle: {
        fontSize: width / 16,
        fontWeight: 'bold',
        marginRight: 15,
    },
    dishRatingValue: {
        color: '#0080F0',
        fontSize: width / 22,
    },
    dishNumRatings: {
        color: '#555',
        fontSize: width / 24,
        paddingHorizontal: 5,
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
});
