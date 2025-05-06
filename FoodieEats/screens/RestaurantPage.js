import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, Image, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { FontAwesome } from '@expo/vector-icons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const { width } = Dimensions.get('window');

export default function RestaurantPage({ route }) {
    // Task 4.2: Accept restaurantId from route params
    const { restaurantId } = route.params || {}; 

    const [restaurant, setRestaurant] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isOwner, setIsOwner] = useState(false);
    const [loggedInUserId, setLoggedInUserId] = useState(null);
    const [loggedInUserRestaurantId, setLoggedInUserRestaurantId] = useState(null);

    const navigation = useNavigation();

    // Task 4.3: Fetch restaurant details
    useFocusEffect(
        useCallback(() => {
            const fetchRestaurant = async () => {
                if (!restaurantId) {
                    console.error("No restaurant ID provided");
                    setIsLoading(false);
                    // Handle error appropriately - maybe navigate back or show error message
                    return;
                }
                setIsLoading(true);
                try {
                    const res = await axios.get(
                        `${process.env.EXPO_PUBLIC_API_URL}/api/restaurants/${restaurantId}`
                    );
                    setRestaurant(res.data);
                } catch (err) {
                    console.error("Error fetching restaurant:", err);
                    // Handle error (e.g., show message)
                } finally {
                    setIsLoading(false);
                }
            };
            fetchRestaurant();
        }, [restaurantId]) // Depend on restaurantId from props
    );

    // Task 4.4: Fetch logged-in user's owner status and restaurant ID
    useEffect(() => {
        const readUserData = async () => {
            try {
                // Use correct AsyncStorage keys
                const userId = await AsyncStorage.getItem('userId'); 
                const ownerStatus = await AsyncStorage.getItem('isOwner'); // Stored as string 'true'/'false'
                const ownedRestId = await AsyncStorage.getItem('restaurantId'); // May be null

                setLoggedInUserId(userId);
                const ownerBool = ownerStatus === 'true'; // Convert string to boolean

                // Task 4.5: Check if current user owns *this* restaurant
                if (ownerBool && ownedRestId && ownedRestId === restaurantId) {
                    setIsOwner(true);
                    setLoggedInUserRestaurantId(ownedRestId);
                } else {
                    setIsOwner(false);
                    setLoggedInUserRestaurantId(null); // Clear if not owner or ID doesn't match
                }

            } catch (e) {
                console.error("Failed to load user data from storage", e);
                setIsOwner(false); // Default to not owner on error
            }
        };
        readUserData();
    }, [restaurantId]); // Re-check if the restaurantId prop changes

    // Placeholder for menu item rendering
    const renderMenuItem = ({ item }) => {
        // Basic structure - needs styling and navigation
        return (
            <View style={styles.menuItemContainer}>
                <Text style={styles.dishTitle}>{item.name}</Text>
                <Text>${item.price}</Text>
                <Text>{item.description}</Text>
                {/* Add rating display */}
            </View>
        );
    };

    // Placeholder for logout button (Task 6.1)
    const handleLogout = async () => {
        try {
            // Use consistent keys for removal
            await AsyncStorage.removeItem('userId'); 
            await AsyncStorage.removeItem('isOwner');
            await AsyncStorage.removeItem('restaurantId');
            await AsyncStorage.removeItem('token');
            navigation.reset({ index: 0, routes: [{ name: 'Auth' }] });
        } catch (e) {
            console.error("Error logging out:", e);
        }
    };

    if (isLoading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    if (!restaurant) {
        return (
            <View style={styles.centered}>
                <Text>Restaurant data not found.</Text>
                {/* Optionally add a button to go back */}
            </View>
        );
    }

    // Basic render structure - needs significant styling and content population
    return (
        <View style={styles.container}>
            <View style={styles.titleContainer}>
                 {isOwner && (
                     <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
                         <MaterialIcons name="logout" size={28} color="#000" />
                     </TouchableOpacity>
                 )}
                <Text style={styles.title}>{restaurant.name}</Text>
                {/* Add other restaurant details: location, hours, rating etc. */}
                <Text>Location: {restaurant.location}</Text>
                <Text>Hours: {restaurant.operating_hours}</Text>
                {/* Add more details */}
            </View>

            <Text style={styles.menuTitle}>Menu</Text>
            <FlatList
                data={restaurant.menu}
                keyExtractor={(item) => item._id?.toString() || Math.random().toString()} // Use _id if available
                renderItem={renderMenuItem}
                contentContainerStyle={{ paddingBottom: isOwner ? 100 : 0 }} // Space for edit button
            />

            {/* Task 4.5: Conditional Edit Button */}
            {isOwner && (
                <View style={styles.editButtonContainer}>
                    <TouchableOpacity
                        style={styles.editButton}
                        onPress={() => navigation.navigate("EditRestaurant", { restaurantId: restaurantId })} // EditRestaurant needs to be created/added
                    >
                        <Text style={styles.editButtonText}>Edit Restaurant</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}

// Basic styles - adapt from branch version or create new
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    titleContainer: {
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: "#ccc",
        alignItems: 'center', // Center title by default
        position: 'relative', // For logout button positioning
    },
    logoutButton: {
        position: 'absolute',
        top: 15, // Adjust as needed
        right: 15, // Adjust as needed
    },
    title: {
        fontSize: width / 12,
        fontWeight: '600',
        textAlign: 'center',
    },
    menuTitle: {
        fontSize: width / 14,
        fontWeight: 'bold',
        textAlign: 'center',
        marginTop: 20,
        marginBottom: 10,
    },
    menuItemContainer: {
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: "#eee",
    },
    dishTitle: {
        fontSize: width / 18,
        fontWeight: 'bold',
    },
    editButtonContainer: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
        alignItems: 'center',
    },
    editButton: {
        backgroundColor: '#007AFF',
        paddingVertical: 12,
        paddingHorizontal: 30,
        borderRadius: 25,
        width: '80%', // Adjust width as needed
        alignItems: 'center',
    },
    editButtonText: {
        color: 'white',
        fontSize: width / 20,
        fontWeight: 'bold',
    },
    // Add more styles for restaurant details, ratings, etc.
});
