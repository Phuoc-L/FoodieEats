import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, Image, TouchableOpacity } from 'react-native';
import { useIsFocused } from '@react-navigation/native'; // so we can refresh on screen focus
import axios from 'axios';
import NavigationBar from './Navigation';

export default function Profile() {
  const [user, setUser] = useState("");
  const [displayUser, setDisplayUser] = useState("");
  const [btnTxt, setBtnTxt] = useState("");

  const EDIT_PROFILE_MSG = "Edit Profile";
  const UNFOLLOW_MSG = "Unfollow";
  const FOLLOW_MSG = "Follow";

  let count = 0;

  const urlPrefix = process.env.EXPO_PUBLIC_API_URL + '/api/users/';

  // This hook tells us if this screen is currently focused
  const isFocused = useIsFocused();

  // Fetch posts whenever screen is focused (including after navigating back)
  useEffect(() => {
    if (isFocused) {
      getUsers();
      count = count + 1;
      console.log(count);
    }
  }, [isFocused]);

  const getUsers = async () => {
    try {
        const userId = '670372a5d9077967850ae900'; // Replace with actual user ID
        const userIdResponse = await axios.get(urlPrefix + userId);
        setUser(userIdResponse.data);

        const displayUserId = '670372a5d9077967850ae901'; // Replace with actual user ID
        const displayUserIdResponse = await axios.get(urlPrefix + displayUserId);
        setDisplayUser(displayUserIdResponse.data);

        setDisplayButtonText(userIdResponse.data, displayUserIdResponse.data._id);
    } catch (error) {
        console.error('Error getting user info', error)
    }
  };

  const setDisplayButtonText = (userData, displayUserId) => {
    if (userData._id === displayUserId) {
      setBtnTxt(EDIT_PROFILE_MSG);
    } else {
      if (userData.following.find(id => id === displayUserId)) {
        setBtnTxt(UNFOLLOW_MSG);
      } else {
        setBtnTxt(FOLLOW_MSG);
      }
    }
  }

  const getUserImage = () => {
    if (displayUser != null && displayUser.profile != null && displayUser.profile.avatar_url != null) {
      return displayUser.profile.avatar_url;
    } else {
      return 'https://via.placeholder.com/50';
    }
  };

  const handleProfileButtonPress = () => {
    if (btnTxt === EDIT_PROFILE_MSG) {

    } else if (btnTxt === UNFOLLOW_MSG) {

    } else if (btnTxt === FOLLOW_MSG) {

    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.usernameTitle}>{displayUser?.username || 'Username'}</Text>
      </View>

      {/* Header (user info) */}
      <View style={styles.profileHeaderContainer}>
        <Image source={{uri: getUserImage()}} style={styles.avatar}/>
        <View>
          <Text style={styles.text}>Followers: {displayUser?.followers_count || 0}</Text>
          <Text style={styles.text}>Following: {displayUser?.following_count || 0}</Text>
        </View>
      </View>
      
      <View style={styles.headerContainer}>
        <TouchableOpacity style={styles.profileButton} onPress={handleProfileButtonPress}>
          <Text style={styles.buttonText}>{btnTxt}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.marginContainer}>
        <Text style={styles.bioName}>{displayUser?.first_name || "First"} {displayUser?.last_name || "Last"}</Text>
        <Text style={styles.bioParagraph}>{displayUser?.profile.bio || "About me"}</Text>
      </View>

      <View>

      </View>
{/* 
      <NavigationBar /> */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: "#fff",
    alignContent: 'center'
  },
  marginContainer: {
    margin: 10
  },
  headerContainer: {
    alignItems: 'center'
  },
  profileHeaderContainer: {
    display: 'flex',
    flexDirection: 'row', 
    alignItems: 'center', 
  },

  usernameTitle: { 
    fontSize: 32, 
    fontWeight: 'bold',
    color: '#000'
  },
  avatar: { 
    width: 100, 
    height: 100, 
    borderRadius: 50,
    margin: 15,
    marginLeft: 50,
    marginRight: 60,
    borderWidth: 1, 
    borderColor: '#ccc',
  },

  profileButton: {
    margin: 10,
    paddingVertical: 15,
    paddingHorizontal: 30,
    backgroundColor: '#007bff',
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
    height: 50
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },

  bioName: {
    margin: 3,
    fontWeight: 'bold',
    fontSize: 18
  },
  bioParagraph: {
    margin: 3,
    fontSize: 14
  },

  text: {
    color: '#000',
    fontSize: 18,
  },

  
});
