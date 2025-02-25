import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, Image, TouchableOpacity } from 'react-native';
import { useIsFocused } from '@react-navigation/native'; // so we can refresh on screen focus
import axios from 'axios';
import NavigationBar from './Navigation';

export default function Profile() {
  const [user, setUser] = useState("");
  const [displayUser, setDisplayUser] = useState("");
  const [following, setFollowing] = useState([]);

  const urlPrefix = process.env.EXPO_PUBLIC_API_URL + '/api/users/';

  // This hook tells us if this screen is currently focused
  const isFocused = useIsFocused();

  // Fetch posts whenever screen is focused (including after navigating back)
  useEffect(() => {
    if (isFocused) {
      getUsers();
    }
  }, [isFocused]);

  const getUsers = async () => {
    try {
        const userId = '670372a5d9077967850ae900'; // Replace with actual user ID
        const userIdResponse = await axios.get(urlPrefix + userId);
        setUser(userIdResponse.data);

        const displayUserId = '67045cebfe84a164fa7085a9'; // Replace with actual user ID
        const displayUserIdResponse = await axios.get(urlPrefix + displayUserId);
        setDisplayUser(displayUserIdResponse.data);

        // if (user != displayUser) {
        //   setFollowing(userIdResponse.following);set
        // } else {
        //   setFollowing([]);
        // }
    } catch (error) {
        console.error('Error getting user info', error)
    }
  };

  const getUserImage = () => {
    if (displayUser != null && displayUser.profile != null && displayUser.profile.avatar_url != null) {
      return displayUser.profile.avatar_url;
    } else {
      return 'https://via.placeholder.com/50';
    }
  };

  const displayButtonText = () => {
    // if (user == displayUser) {
    //   return "Edit Profile";
    // } else if (following.find(id => id === displayUserId)) {
    //   return "Unfollow";
    // } else {
    //   return "Follow";
    // }
    return "test";
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{displayUser?.username || 'Username'}</Text>
      </View>

      {/* Header (user info) */}
      <View style={styles.profileHeader}>
        <Image source={{uri: getUserImage()}} style={styles.avatar}/>
        <View>
          <Text style={styles.text}>Followers: {displayUser?.followers_count || 0}</Text>
          <Text style={styles.text}>Following: {displayUser?.following_count || 0}</Text>
        </View>
      </View>
      
      <View style={styles.header}>
        <TouchableOpacity style={styles.buttonStyle} onPress={() => {}}>
          <Text style={styles.buttonText}>Top</Text>
        </TouchableOpacity>
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
  header: {
    alignItems: 'center'
  },
  title: { 
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
  profileHeader: {
    display: 'flex',
    flexDirection: 'row', 
    alignItems: 'center', 
  },
  buttonStyle: {
    width: 100,
    height: 20,
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
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },


  text: {
    color: '#000',
    fontSize: 18,
  },
});
