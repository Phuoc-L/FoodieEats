import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, Image, TouchableOpacity, ScrollView } from 'react-native';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import {Card, Paragraph } from 'react-native-paper';
import axios from 'axios';
import { FontAwesome } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NavigationBar from './Navigation';
import { ALERT_TYPE, Dialog, AlertNotificationRoot } from 'react-native-alert-notification';


export default function Profile({route}) {
  const [userId, setUserId]  = useState();
  const [user, setUser] = useState("");
  const [displayedUser, setDisplayedUser] = useState("");
  const [btnTxt, setBtnTxt] = useState("");
  const [posts, setPosts] = useState([]);
  const [state, setState] = useState(0);

  const EDIT_PROFILE_MSG = "Edit Profile";
  const UNFOLLOW_MSG = "Unfollow";
  const FOLLOW_MSG = "Follow";

  // const userIdResponse = '670372a5d9077967850ae900'; // Test: Logged In user ID
  // const displayedUserId = '673026985ab6f593df4682d7'; // Test: User ID
  // const displayedUserId = '670372a5d9077967850ae901'; // Test: Displayed user ID

  const navigation = useNavigation();
  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused) {
      FetchUserInfo();
    }
  }, [isFocused, state]);

  const FetchUserInfo = async () => {
    try {
      const displayedUserId = route.params.displayUserID;
      if (displayedUserId == null) {
        console.error('Error getting displayedUserId');
        return;
      }

      const userIdResponse = await AsyncStorage.getItem('userID');
      if (userIdResponse == null) {
        console.error('Error getting userId');
        return;
      }

      setUserId(userIdResponse);

      const userDataResponse = await axios.get(`${process.env.EXPO_PUBLIC_API_URL}/api/users/${userIdResponse}`);
      setUser(userDataResponse.data);

      if (userIdResponse === displayedUserId) {
        setDisplayedUser(userDataResponse.data);

        const displayedUserPostResponse = await axios.get(`${process.env.EXPO_PUBLIC_API_URL}/api/posts/${userIdResponse}/posts`);
        setPosts([...displayedUserPostResponse.data]);

        setBtnTxt(EDIT_PROFILE_MSG);
      } else {
        const displayedUserDataResponse = await axios.get(`${process.env.EXPO_PUBLIC_API_URL}/api/users/${displayedUserId}`);
        setDisplayedUser(displayedUserDataResponse.data);

        const displayedUserPostResponse = await axios.get(`${process.env.EXPO_PUBLIC_API_URL}/api/posts/${displayedUserId}/posts`);
        setPosts([...displayedUserPostResponse.data]);

        SetDisplayButtonText(userDataResponse.data, displayedUserDataResponse.data._id);
      }
    } catch (error) {
        console.error('Error getting user info', error);
    }
  };

  const SetDisplayButtonText = (loggedInUser, displayedUserId) => {
    if (loggedInUser.following.find(id => id === displayedUserId)) {
      setBtnTxt(UNFOLLOW_MSG);
    } else {
      setBtnTxt(FOLLOW_MSG);
    }
  }

  const GetUserImage = () => {
    if (displayedUser != null && displayedUser.profile != null && displayedUser.profile.avatar_url != null) {
      return displayedUser.profile.avatar_url;
    } else {
      return 'https://via.placeholder.com/50';
    }
  };

  const HandleProfileButtonPress = () => {
    if (btnTxt === EDIT_PROFILE_MSG) {

    } else if (btnTxt === UNFOLLOW_MSG) {
      UnfollowUser();
    } else if (btnTxt === FOLLOW_MSG) {
      FollowUser();
    }
  };

  const UnfollowUser = async () => {
    try {
      const response = await axios.delete(`${process.env.EXPO_PUBLIC_API_URL}/api/users/${userId}/unfollow/${displayedUser._id}`);
      if (response.status === 200) {
        Dialog.show({
          type: ALERT_TYPE.SUCCESS,
          title: 'Complete',
          textBody: 'Unfollow succeeded',
          button: 'Close',
        })

        setState(state + 1);
      }
    } catch (error) {
      console.error('Error unfollowing displayed user', error);
      Dialog.show({
        type: ALERT_TYPE.DANGER,
        title: 'Incomplete',
        textBody: 'Error unfollowing user',
        button: 'Close',
      })
    }
  }

  const FollowUser = async () => {
    try {
      const response = await axios.post(`${process.env.EXPO_PUBLIC_API_URL}/api/users/${userId}/follow/${displayedUser._id}`);
      if (response.status === 200) {
        Dialog.show({
          type: ALERT_TYPE.SUCCESS,
          title: 'Complete',
          textBody: 'Follow succeeded',
          button: 'Close',
        })

        setState(state + 1);
      }
    } catch (error) {
      console.error('Error following displayed user', error);
      Dialog.show({
        type: ALERT_TYPE.DANGER,
        title: 'Incomplete',
        textBody: 'Error following user',
        button: 'Close',
      })
    }
  };

  const DisplayPosts = () => {
    // Testing: For testing multiple posts
    // let a = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    // return a.map(post => CreateCardPost(post));

    return posts?.map(post => CreateCardPost(post));
  }

  const CreateCardPost = (post) => {
    return (
      <TouchableOpacity key={post._id} onPress={() => navigation.navigate('Explore', { postID: post._id })}>
        <Card style={styles.postShape}>
          <Card.Content style={{height: 60}}>
            <Paragraph numberOfLines={2} style={{fontWeight: 'bold'}}>{post?.title}</Paragraph>
          </Card.Content>
          <Card.Cover source={{uri: GetPostImage(post)}} style={styles.imgStyle}/>
          <Card.Content style={styles.rating}>
            <Paragraph style={{color: "#0080F0"}}>{post?.ratings}</Paragraph>
            <FontAwesome name={"star"} style={styles.star}/>
          </Card.Content>
        </Card>
      </TouchableOpacity>
    )
  }

  const GetPostImage = (post) => {
    if (post != null && post.media_url != null) {
      return post.media_url;
    } else {
      return 'https://via.placeholder.com/50';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.usernameTitle}>{displayedUser?.username || 'Username'}</Text>
      </View>

      <View style={styles.profileHeaderContainer}>
        <Image source={{uri: GetUserImage()}} style={styles.avatar}/>
        <View>
          <Text style={styles.text}>Followers: {displayedUser?.followers_count || 0}</Text>
          <Text style={styles.text}>Following: {displayedUser?.following_count || 0}</Text>
          <Text style={styles.text}>Posts: {displayedUser?.posts_count || 0}</Text>
        </View>
      </View>
      
      <AlertNotificationRoot>
        <View style={styles.headerContainer}>
          <TouchableOpacity style={styles.profileButton} onPress={() => HandleProfileButtonPress()}>
            <Text style={styles.buttonText}>{btnTxt}</Text>
          </TouchableOpacity>
        </View>
      </AlertNotificationRoot>

      <View style={styles.marginContainer}>
        <Text style={styles.bioName}>{displayedUser?.first_name || "First"} {displayedUser?.last_name || "Last"}</Text>
        <Text style={styles.bioParagraph}>{displayedUser?.profile?.bio || "Description"}</Text>
      </View>

      <ScrollView>
        <View style={styles.postContainer}>
          {DisplayPosts()}
        </View>
      </ScrollView>

      <NavigationBar/>
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
  postContainer: {
    margin: 10,
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
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

  imgStyle: {
    width: 80,
    height: 80,
    alignSelf: 'center',
  },
  postShape: {
    width: 110,
    height: 170,
    margin: 3, 
  },
  rating: {
    height: 60,
    display: 'flex',
    flexDirection: 'row',
    alignSelf: 'center'
  },
  star: {
    color: '#0080F0',
    marginHorizontal: 3, 
    marginVertical: 7
  },

  text: {
    color: '#000',
    fontSize: 18,
  }
});
