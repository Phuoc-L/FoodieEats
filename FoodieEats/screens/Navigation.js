import React, { useEffect, useState } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { FontAwesome } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function NavigationBar() {
  const [userID, setUserID]  = useState(DEFAULT_LOGGED_IN_USER_ID);
  const [isOwner, setIsOwner] = useState(false);
  const navigation = useNavigation();

  const DEFAULT_LOGGED_IN_USER_ID = 0;

   useEffect(() => {
      FetchAsyncData()
    }, []);

  const FetchAsyncData = async () => {
    const userIDResponse = await AsyncStorage.getItem('userID');
    if (userIDResponse == null) {
      console.error('Error getting isOwner');
      setUserID(DEFAULT_LOGGED_IN_USER_ID);
    } else {
      setUserID(userIDResponse);
    }

    const isOwnerResponse = await AsyncStorage.getItem('owner');
    if (isOwnerResponse == null) {
      console.error('Error getting isOwner');
      setIsOwner(false);
    } else {
      setIsOwner(isOwnerResponse);
    }
  }

  const DisplayProfileIcon = () => {
    if (isOwner === true) {
      return (
        <TouchableOpacity onPress={() => navigation.reset({
          index: 0,
          routes: [{name: 'Restaurant', params: { restaurantID: {userID}}}],
          })}>
          <FontAwesome name="user" size={24} color="black" />
        </TouchableOpacity>
      )
    } else {
      return (
        <TouchableOpacity onPress={() => navigation.reset({
          index: 0,
          routes: [{name: 'Profile', params: { displayUserID: DEFAULT_LOGGED_IN_USER_ID}}],
          })}>
          <FontAwesome name="user" size={24} color="black" />
        </TouchableOpacity>
      )
    }
  }

  const DisplayNavBar = () => {
    if (userID !== null && typeof(userID) !== 'undefined' && isOwner !== null || typeof(isOwner) !== 'undefined') {
      return (
        <View style={styles.navBar}>
          {isOwner === true ? null : <TouchableOpacity onPress={() => navigation.reset({
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
          {isOwner === true ? null : <TouchableOpacity onPress={() => navigation.reset({
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
