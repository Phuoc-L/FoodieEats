import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, Image, TouchableOpacity, ScrollView, Modal, TextInput, Alert } from 'react-native';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import {Card, Paragraph } from 'react-native-paper';
import axios from 'axios';
import { FontAwesome } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NavigationBar from './Navigation';
import { ALERT_TYPE, Dialog, AlertNotificationRoot } from 'react-native-alert-notification';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import {SafeAreaView, SafeAreaProvider} from 'react-native-safe-area-context';

export default function Profile({route}) {
  const [userId, setUserId]  = useState();
  const [user, setUser] = useState("");
  const [displayedUser, setDisplayedUser] = useState("");
  const [btnTxt, setBtnTxt] = useState("");
  const [posts, setPosts] = useState([]);
  const [state, setState] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [profileInfo, setProfileInfo] = useState({
      username: '',
      firstName: '',
      lastName: '',
      bio: '',
      profilePic: '',
    });

  const EDIT_PROFILE_MSG = "Edit Profile";
  const UNFOLLOW_MSG = "Unfollow";
  const FOLLOW_MSG = "Follow";
  const DEFAULT_LOGGED_IN_USER_ID = 0;

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
      // Get logged-in user ID
      const userIdResponse = await AsyncStorage.getItem('userID');
      if (userIdResponse == null) {
        console.error('Error getting userId');
        return;
      }
      setUserId(userIdResponse);

      const displayedUserId = route.params.displayUserID;    
      // Get passed-in displayed user ID
      if (displayedUserId=== null || typeof(displayedUserId) === 'undefined') {
        console.error('Error getting displayedUserId');
        return;
      }

      // Get logged-in user data
      const userDataResponse = await axios.get(`${process.env.EXPO_PUBLIC_API_URL}/api/users/${userIdResponse}`);
      setUser(userDataResponse.data);

      if (userIdResponse === displayedUserId || displayedUserId === DEFAULT_LOGGED_IN_USER_ID) {
        // Logged-in user ID and displayed user ID is the same
        setDisplayedUser(userDataResponse.data);

        // Get logged-in user's posts
        const displayedUserPostResponse = await axios.get(`${process.env.EXPO_PUBLIC_API_URL}/api/posts/${userIdResponse}/posts`);
        // console.log("Fetched Posts Data (Self):", JSON.stringify(displayedUserPostResponse.data, null, 2)); // Removed logging
        setPosts([...displayedUserPostResponse.data]);

        // Set button text
        setBtnTxt(EDIT_PROFILE_MSG);
      } else {
        // Get displayed user's data
        const displayedUserDataResponse = await axios.get(`${process.env.EXPO_PUBLIC_API_URL}/api/users/${displayedUserId}`);
        setDisplayedUser(displayedUserDataResponse.data);

        // Get displayed user's posts
        const displayedUserPostResponse = await axios.get(`${process.env.EXPO_PUBLIC_API_URL}/api/posts/${displayedUserId}/posts`);
        // console.log(`Fetched Posts Data (User ${displayedUserId}):`, JSON.stringify(displayedUserPostResponse.data, null, 2)); // Removed logging
        setPosts([...displayedUserPostResponse.data]);

        // Set button text to either 'follow' or 'unfollow'
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

  const LogoutDisplay = () => {
    // If logged-in user ID and displayed user ID is the same, display a logout button
    if (userId === displayedUser._id) {
      return (
        <TouchableOpacity>
          <MaterialIcons name="logout" size={24} style={styles.logout} onPress={() => navigation.navigate('Auth')}/>
        </TouchableOpacity>
    )}
  }

  const GetUserImage = () => {
    if (displayedUser?.profile?.avatar_url) {
      return {uri: displayedUser?.profile?.avatar_url};
    } else {
      return require('../assets/defaultUserIcon.png');
    }
  };

  const HandleProfileButtonPress = () => {
    if (btnTxt === EDIT_PROFILE_MSG) {
      setModalVisible(true);
    } else if (btnTxt === UNFOLLOW_MSG) {
      UnfollowUser();
    } else if (btnTxt === FOLLOW_MSG) {
      FollowUser();
    }
  };

  const DisplayEditProfileForm = () => {
    return (
      <Modal animationType='slide' transparent={true} visible={modalVisible} onRequestClose={() => {setModalVisible(!modalVisible)}}>
        <View style={styles.centerContainer}>
          <View style={styles.modalContainer}>
            
            <Text style={styles.textLeft}>Username:</Text>
            <TextInput style={styles.input} placeholder={'Username'} placeholderTextColor={'#A0A0A0'} defaultValue={user?.username}
              inputMode='text' clearButtonMode={'always'} maxLength={100} onChangeText={name => setProfileInfo({...profileInfo, username: name})}/>           
            <Text style={styles.textLeft}>First Name:</Text>
            <TextInput style={styles.input} placeholder={'First Name'} placeholderTextColor={'#A0A0A0'} defaultValue={user?.first_name}
              inputMode='text' clearButtonMode={'always'} maxLength={100} onChangeText={name => setProfileInfo({...profileInfo, firstName: name})}/>
            <Text style={styles.textLeft}>Last Name:</Text>
            <TextInput style={styles.input} placeholder={'Last Name'} placeholderTextColor={'#A0A0A0'} defaultValue={user?.last_name}
              inputMode='text' clearButtonMode={'always'} maxLength={100} onChangeText={name => setProfileInfo({...profileInfo, lastName: name})}/>
            <Text style={styles.textLeft}>Profile Description:</Text>
            <TextInput style={styles.inputMultiline} placeholder={'Description'} placeholderTextColor={'#A0A0A0'} defaultValue={user?.profile?.bio} scrollEnabled={true}
              multiline={true} maxLength={500} onChangeText={description => setProfileInfo({...profileInfo, bio: description})}/>
            <TouchableOpacity style={styles.changeImgButton}>
              <Text style={styles.buttonText}>Change Profile Picture</Text>
            </TouchableOpacity>

            <View style={styles.editProfileBtnContainer}>
              <TouchableOpacity style={styles.profileButton} onPress={() => UpdateUserInfo()}>
                <Text style={styles.buttonText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.profileButton} onPress={() => setModalVisible(!modalVisible)}>
                <Text style={styles.buttonText}>Close</Text>
              </TouchableOpacity>
            </View>

          </View>
        </View>
      </Modal>
    )
  }

  const UpdateUserInfo = async () => {
    try {
      let changeMsgs = '';
      let errorMsgs = '';

      if (profileInfo?.username !== '' && user?.username !== profileInfo?.username) {
        const response = await axios.post(`${process.env.EXPO_PUBLIC_API_URL}/api/users/${userId}/username/${profileInfo?.username}`);
        if (response.status === 200) {
          changeMsgs += "- Username to " + profileInfo.username + "\n";
        } else {
          errorMsgs += "- Username to " + profileInfo.username + "\n";
        }
      }

      if (profileInfo?.firstName !== '' && user?.first_name !== profileInfo?.firstName) {
        const response = await axios.post(`${process.env.EXPO_PUBLIC_API_URL}/api/users/${userId}/first_name/${profileInfo?.firstName}`);
        if (response.status === 200) {
          changeMsgs += "- First name to " + profileInfo.firstName + "\n";
        } else {
          errorMsgs += "- First name to " + profileInfo.firstName + "\n";
        }
      }

      if (profileInfo?.lastName !== '' && user?.last_name !== profileInfo?.lastName) {
        const response = await axios.post(`${process.env.EXPO_PUBLIC_API_URL}/api/users/${userId}/last_name/${profileInfo?.lastName}`);
        if (response.status === 200) {
          changeMsgs += "- Last name to " + profileInfo.lastName + "\n";
        } else {
          errorMsgs += "Last name to " + profileInfo.lastName + "\n";
        }
      }

      if (profileInfo?.bio !== "" && user?.profile?.bio !== profileInfo?.bio) {
        const response = await axios.post(`${process.env.EXPO_PUBLIC_API_URL}/api/users/${userId}/bio/${profileInfo?.bio}`);
        if (response.status === 200) {
          changeMsgs += "- Profile description\n";
        } else {
          errorMsgs += "- Profile description\n";
        }
      }

      if (errorMsgs !== "") {
        Alert.alert("Error Updating", errorMsgs);
      }

      if (changeMsgs !== "") {
        Alert.alert("Successfully Updated", changeMsgs);

        setState(state + 1);
      } 

    } catch (error) {
      console.error('Error updating user info', error);
      Alert.alert('Error updating user info', error);
    }
    finally {
      setProfileInfo({
        username: '',
        firstName: '',
        lastName: '',
        bio: '',
        profilePic: '',
      });
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

    if (posts.length === 0) {
      return <View style={styles.emptyContainer}>
        <Text style={styles.emptyPostText}>No Posts</Text>
      </View>
    } else {
      // Create a card component for each displayed user's post
      return posts?.map(post => CreateCardPost(post));
    }
  }

  const CreateCardPost = (post) => {
    const imageUrl = GetPostImage(post); // Get the URL
    // console.log(`Rendering post ${post?._id} with image URL: ${imageUrl}`); // Removed logging
    return (
      <TouchableOpacity key={post._id} onPress={() => navigation.navigate('Explore', { postID: post._id })}>
        <Card style={styles.postShape}>
          <Card.Content style={{height: 60}}>
            <Paragraph numberOfLines={2} style={{fontWeight: 'bold'}}>{post?.title}</Paragraph>
          </Card.Content>
          <Card.Cover source={GetPostImage(post)} style={styles.imgStyle}/>
          <Card.Content style={styles.rating}>
            <Paragraph style={{color: '#0080F0'}}>{post?.ratings}</Paragraph>
            <FontAwesome name={"star"} style={styles.star}/>
          </Card.Content>
        </Card>
      </TouchableOpacity>
    )
  }

  const GetPostImage = (post) => {
    if (post?.media_url) {
      return {uri: post?.media_url};
    } else {
      return require('../assets/defaultFoodIcon.png');
    }
  };
  

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        {/* Display logout button option */}
        {LogoutDisplay()}

        {/* Display displayed user's name */}
        <View style={styles.headerContainer}>
          <Text style={styles.usernameTitle}>{displayedUser?.username || 'Username'}</Text>
        </View>

        {/* Display displayed user's profile pic, followers, following, and posts numbers */}
        <View style={styles.profileHeaderContainer}>
          <Image source={GetUserImage()} style={styles.avatar}/>
          <View>
            <Text style={styles.text}>Followers: {displayedUser?.followers_count || 0}</Text>
            <Text style={styles.text}>Following: {displayedUser?.following_count || 0}</Text>
            <Text style={styles.text}>Posts: {displayedUser?.posts_count || 0}</Text>
          </View>
        </View>
        
        {/* Display Edit Profile/Follow/Unfollow button and enable alert popup modal response */}
        <AlertNotificationRoot>
          <View style={styles.headerContainer}>
            <TouchableOpacity style={styles.profileButton} onPress={() => HandleProfileButtonPress()}>
              <Text style={styles.buttonText}>{btnTxt}</Text>
            </TouchableOpacity>
          </View>
        </AlertNotificationRoot>

        {/* Display displayed user's name and description */}
        <View style={styles.marginContainer}>
          <Text style={styles.bioName}>{displayedUser?.first_name || "First"} {displayedUser?.last_name || "Last"}</Text>
          <Text style={styles.bioParagraph}>{displayedUser?.profile?.bio || "Description"}</Text>
        </View>

        {/* Display displayed user's posts */}
        <ScrollView style={{height: 200}}>
          <View style={styles.postContainer}>
            {DisplayPosts()}
          </View>
        </ScrollView>

        {DisplayEditProfileForm()}
        <NavigationBar/>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 10,
    paddingHorizontal: 10,
    backgroundColor: "#fff",
    alignContent: 'center'
  },
  marginContainer: {
    margin: 10,
    borderBottomColor: 'black',
    borderBottomWidth: StyleSheet.hairlineWidth,
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
  emptyContainer: {
    height: 200,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContainer: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  editProfileBtnContainer: {
    display: 'flex',
    flexDirection: 'row', 
    alignItems: 'center', 
    alignContent: 'center',
    justifyContent: 'center',
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
  changeImgButton: {
    margin: 10,
    paddingVertical: 15,
    paddingHorizontal: 30,
    backgroundColor: '#FF6B00',
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
    height: 50,
    width: 270,
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
  placeholderImage: {
     // Specific styles for the placeholder View
     backgroundColor: '#eee', // Placeholder background
     justifyContent: 'center',
     alignItems: 'center',
     borderWidth: 1,
     borderColor: '#ccc',
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

  logout: {
    alignSelf: 'flex-end',
    color: '#000',
  },

  text: {
    color: '#000',
    fontSize: 18,
  },
  textLeft: {
    color: '#000',
    fontSize: 18,
    alignSelf: 'flex-start'
  },
  emptyPostText: {
    fontStyle: 'italic',
    color: '#000',
    fontSize: 18,
  },
  input: {
    borderWidth: 1,
    borderColor: '#000',
    padding: 15,
    borderRadius: 5,
    width: 300,
  },
  inputMultiline: {
    borderWidth: 1,
    borderColor: '#000',
    padding: 15,
    borderRadius: 5,
    width: 300,
    height: 100,
  },
});
