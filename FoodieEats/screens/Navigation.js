import React, { useEffect, useState, useCallback } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { FontAwesome } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function NavigationBar() {
  const [userID, setUserID] = useState(null); 
  const [isOwner, setIsOwner] = useState(false); // Internal state will be boolean
  const [restaurantId, setRestaurantId] = useState(null); 
  const navigation = useNavigation();

  const FetchAsyncData = useCallback(async () => {
    try {
      // Read using 'userID' and 'owner' keys
      const storedUserID = await AsyncStorage.getItem('userID'); 
      const storedOwnerString = await AsyncStorage.getItem('owner'); // This will be "true" or "false" string
      const storedRestaurantId = await AsyncStorage.getItem('restaurantId'); 

      console.log("Navigation.js - Fetched from AsyncStorage:", { storedUserID, storedOwnerString, storedRestaurantId });

      setUserID(storedUserID); 
      
      const ownerBool = storedOwnerString === 'true'; // Convert string from AsyncStorage to boolean
      setIsOwner(ownerBool); // Set boolean state

      if (ownerBool && storedRestaurantId) {
        setRestaurantId(storedRestaurantId);
      } else {
        setRestaurantId(null); 
      }

    } catch (e) {
      console.error("Navigation.js - Failed to fetch auth data from storage", e);
      setUserID(null);
      setIsOwner(false);
      setRestaurantId(null);
    }
  }, []); 

  useFocusEffect(
    useCallback(() => {
      async function performFetch() {
        await FetchAsyncData();
      }
      performFetch();
    }, [FetchAsyncData])
  );

  const DisplayProfileIcon = () => { 
    if (!userID) {
      return null; 
    }

    // Logic uses the boolean isOwner state
    if (isOwner && restaurantId) {
      return (
        <TouchableOpacity onPress={() => navigation.reset({
          index: 0,
          routes: [{ name: 'RestaurantPage', params: { restaurantId: restaurantId } }],
        })}>
          <FontAwesome name="user" size={24} color="black" />
        </TouchableOpacity>
      );
    } else if (!isOwner) {
      return (
        <TouchableOpacity onPress={() => navigation.reset({
          index: 0,
          routes: [{ name: 'Profile', params: { displayUserID: userID } }], 
        })}>
          <FontAwesome name="user" size={24} color="black" />
        </TouchableOpacity>
      );
    } else {
      console.warn("Owner user detected but no restaurantId found in state.");
       return (
        <TouchableOpacity onPress={() => navigation.reset({
          index: 0,
          routes: [{ name: 'Profile', params: { displayUserID: userID } }],
        })}>
          <FontAwesome name="user" size={24} color="black" />
        </TouchableOpacity>
      );
    }
  };

  const DisplayNavBar = () => {
    // Logic uses the boolean isOwner state
    if (userID !== null && typeof(userID) !== 'undefined' && isOwner !== null /* isOwner is boolean, no typeof needed */) {
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
    return null; 
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
