import React, { useEffect, useState } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { FontAwesome } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function NavigationBar() {
  const [userID, setUserID] = useState(null); // Default to null
  const [isOwner, setIsOwner] = useState(false);
  const [restaurantId, setRestaurantId] = useState(null); // Add state for restaurantId
  const navigation = useNavigation();

  // Remove DEFAULT_LOGGED_IN_USER_ID as we fetch the actual ID

   useEffect(() => {
      FetchAsyncData();
      // Optional: Add listener for focus to refetch if needed,
      // though AsyncStorage changes should ideally trigger re-renders if managed globally.
      // const unsubscribe = navigation.addListener('focus', FetchAsyncData);
      // return unsubscribe;
    }, []); // Run once on mount

  const FetchAsyncData = async () => {
    try {
      const storedUserID = await AsyncStorage.getItem('userID');
      const storedIsOwner = await AsyncStorage.getItem('owner'); // Returns 'true' or 'false' string
      const storedRestaurantId = await AsyncStorage.getItem('restaurantId'); // Returns ID or null

      setUserID(storedUserID); // Can be null if not logged in
      
      const ownerBool = storedIsOwner === 'true'; // Convert to boolean
      setIsOwner(ownerBool);

      if (ownerBool && storedRestaurantId) {
        setRestaurantId(storedRestaurantId);
      } else {
        setRestaurantId(null); // Ensure it's null if not owner or no ID stored
      }

    } catch (e) {
      console.error("Failed to fetch auth data from storage", e);
      // Reset state on error
      setUserID(null);
      setIsOwner(false);
      setRestaurantId(null);
    }
  };

  const DisplayProfileIcon = () => {
    // Only show profile icon if logged in (userID is not null)
    if (!userID) {
      return null; // Or maybe a login icon? For now, hide if not logged in.
    }

    if (isOwner && restaurantId) {
      // Navigate to RestaurantPage if owner and restaurantId is available
      return (
        <TouchableOpacity onPress={() => navigation.reset({
          index: 0,
          routes: [{ name: 'RestaurantPage', params: { restaurantId: restaurantId } }],
        })}>
          <FontAwesome name="user" size={24} color="black" />
        </TouchableOpacity>
      );
    } else if (!isOwner) {
      // Navigate to Profile if not owner
      return (
        <TouchableOpacity onPress={() => navigation.reset({
          index: 0,
          routes: [{ name: 'Profile', params: { displayUserId: userID } }], // Use fetched userID
        })}>
          <FontAwesome name="user" size={24} color="black" />
        </TouchableOpacity>
      );
    } else {
      // Edge case: Owner but no restaurantId? Maybe show Profile or a specific message/screen.
      // For now, fallback to Profile, but this might need refinement.
      console.warn("Owner user detected but no restaurantId found in state.");
       return (
        <TouchableOpacity onPress={() => navigation.reset({
          index: 0,
          routes: [{ name: 'Profile', params: { displayUserId: userID } }],
        })}>
          <FontAwesome name="user" size={24} color="black" />
        </TouchableOpacity>
      );
    }
  };

  const DisplayNavBar = () => {
    // Display the nav bar only if the user is logged in (userID is available)
    if (userID !== null) {
      return (
        <View style={styles.navBar}>
          {isOwner ? null : <TouchableOpacity onPress={() => navigation.reset({
            index: 0,
            routes: [{name: 'UserFeed'}],
            })}>
            <FontAwesome name="home" size={24} color="black" />
          </TouchableOpacity>}
          <TouchableOpacity onPress={() => navigation.reset({
            index: 0,
            routes: [{name: 'Explore'}],
            })}>
            <FontAwesome name="globe" size={24} color="black" />
          </TouchableOpacity>
          {isOwner ? null : <TouchableOpacity onPress={() => navigation.reset({
            index: 0,
            routes: [{name: 'NewPost'}],
            })}>
            <FontAwesome name="plus-circle" size={24} color="black"/>
          </TouchableOpacity>}
          {DisplayProfileIcon()}
        </View>
      );
    }
  };

  return (
    <View>
      {DisplayNavBar()}
    </View>
  );
}

const styles = StyleSheet.create({
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#ccc',
    backgroundColor: '#fff',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
});
