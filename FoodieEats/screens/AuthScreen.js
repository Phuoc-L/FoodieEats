import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, Alert, TouchableWithoutFeedback, Platform, Keyboard, KeyboardAvoidingView, Switch } from 'react-native';
import axios from 'axios';
import { Eye, EyeOff } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function AuthScreen(props) {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  // Revert to isOwnerMode to match "original" code structure
  const [isOwnerMode, setIsOwnerMode] = useState(false); 

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    username: '',
    password: '',
  });

  const saveData = async (dataName, data) => {
    try {
        if (data === null || data === undefined) {
            return; 
        }
        await AsyncStorage.setItem(dataName, data);
    } catch (e) {
        console.error(`Error saving ${dataName}:`, e);
    }
  };

  const loginUser = async (credentials) => {
    // Determine API endpoint based on isOwnerMode
    const loginUrl = isOwnerMode
      ? `${process.env.EXPO_PUBLIC_API_URL}/api/restaurant-owners/login`
      : `${process.env.EXPO_PUBLIC_API_URL}/api/users/login`;
      
    try {
      console.log(`Attempting ${isOwnerMode ? 'Owner' : 'Personal'} login to: ${loginUrl}`);
      const response = await axios.post(loginUrl, credentials);
      
      const { token } = response.data;
      // Backend returns 'user' for personal and 'owner' for restaurant owner
      const responseData = isOwnerMode ? response.data.owner : response.data.user; 

      if (!responseData || !responseData._id || !token) {
          Alert.alert("Login Error", "Invalid response from server.");
          return; 
      }

      // Clear previous keys
      await AsyncStorage.multiRemove(['userID', 'owner', 'restaurantId', 'token']);

      // Save data using "original" keys
      await saveData("token", token);
      await saveData("owner", isOwnerMode.toString()); // Save "true" or "false"
      await saveData("userID", responseData._id);    // Save as userID (uppercase D)

      let targetScreen = 'UserFeed';
      let params = {};

      if (isOwnerMode) {
        if (responseData.restaurant_id) {
          await saveData("restaurantId", responseData.restaurant_id);
          targetScreen = 'RestaurantPage'; 
          params = { restaurantId: responseData.restaurant_id };
        } else {
          Alert.alert("Login Error", "Owner account error: Restaurant ID missing.");
          return; 
        }
      }
      
      Keyboard.dismiss();
      props.navigation.reset({ 
          index: 0, 
          routes: [{ name: targetScreen, params: params }] 
      });

    } catch (error) {
      console.error(`${isOwnerMode ? 'Owner' : 'Personal'} Login error:`, error.response ? error.response.data : error.message);
      Alert.alert("Login Error", error.response?.data?.error || `Failed to log in.`);
    }
  };

  const signupUser = async (currentFormState) => {
    // Data for both user types
    const commonData = {
      first_name: currentFormState.firstName,
      last_name: currentFormState.lastName,
      email: currentFormState.email,
      username: currentFormState.username,
      password: currentFormState.password,
    };

    // Determine URL and payload based on isOwnerMode
    let signupUrl;
    let payload;

    if (isOwnerMode) {
      signupUrl = `${process.env.EXPO_PUBLIC_API_URL}/api/restaurant-owners/signup`;
      payload = commonData; // Backend /api/restaurant-owners/signup handles restaurant creation
    } else {
      signupUrl = `${process.env.EXPO_PUBLIC_API_URL}/api/users/signup`;
      // Original user signup didn't send an isOwner flag, backend users schema is clean
      payload = commonData; 
    }
      
    try {
      console.log(`Attempting ${isOwnerMode ? 'Owner' : 'Personal'} signup to: ${signupUrl}`);
      const response = await axios.post(signupUrl, payload); 
      
      Keyboard.dismiss();
      console.log(`${isOwnerMode ? 'Owner' : 'Personal'} Signup successful:`, response.data);

      Alert.alert("Success", `${isOwnerMode ? 'Restaurant Owner' : 'User'} account created successfully! Please log in.`);
      setIsLogin(true); 
      // setIsOwnerMode(isOwnerMode); // Keep the selected mode for login convenience
    } catch (error) {
      console.error('Signup error:', error.response ? error.response.data : error.message);
      Alert.alert("Signup Error", error.response?.data?.error || "Something went wrong during signup.");
    }
  };
  
  const handleSubmit = () => {
    if (isLogin) {
      loginUser({ email: formData.email, password: formData.password }); 
    } else {
      signupUser(formData); 
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={styles.container}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.content}>
          <Text style={styles.logo}>FoodieEats</Text>

          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[
                styles.tabButton,
                isLogin ? styles.activeTabButton : styles.inactiveTabButton
              ]}
              onPress={() => setIsLogin(true)}
            >
              <Text style={[
                styles.buttonText,
                isLogin ? styles.activeButtonText : styles.inactiveButtonText
              ]}>Log In</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[
                styles.tabButton,
                !isLogin ? styles.activeTabButton : styles.inactiveTabButton
              ]}
              onPress={() => setIsLogin(false)}
            >
              <Text style={[
                styles.buttonText,
                !isLogin ? styles.activeButtonText : styles.inactiveButtonText
              ]}>Sign Up</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.switchContainer}>
            <Text style={styles.switchLabel}>Account Type:</Text>
            <Text style={styles.switchText}>Personal</Text>
            <Switch
              trackColor={{ false: "#767577", true: "#81b0ff" }}
              thumbColor={isOwnerMode ? "#007AFF" : "#f4f3f4"}
              ios_backgroundColor="#3e3e3e"
              onValueChange={() => setIsOwnerMode(prev => !prev)}
              value={isOwnerMode}
            />
            <Text style={styles.switchText}>Owner</Text>
          </View>

          <View style={styles.form}>
            {!isLogin && (
              <>
                <TextInput
                  style={styles.input}
                  placeholder="First Name"
                  value={formData.firstName}
                  onChangeText={(text) => setFormData({...formData, firstName: text})}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Last Name"
                  value={formData.lastName}
                  onChangeText={(text) => setFormData({...formData, lastName: text})}
                />
              </>
            )}
            
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={formData.email}
              onChangeText={(text) => setFormData({...formData, email: text})}
            />
            
            {!isLogin && (
              <TextInput
                style={styles.input}
                placeholder="Username"
                value={formData.username}
                onChangeText={(text) => setFormData({...formData, username: text})}
              />
            )}
            
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Password"
                secureTextEntry={!showPassword}
                value={formData.password}
                onChangeText={(text) => setFormData({...formData, password: text})}
              />
              <TouchableOpacity 
                style={styles.eyeIcon} 
                onPress={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <Eye size={24} color="#007AFF" />
                ) : (
                  <EyeOff size={24} color="#007AFF" />
                )}
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.goButton} onPress={handleSubmit}>
              <Text style={styles.goButtonText}>Go</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    fontSize: 50,
    color: '#FF6B00',
    fontWeight: 'bold',
    marginBottom: 60,
  },
  buttonContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 10,
  },
  tabButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 13,
    width: 100,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#000',
  },
  activeTabButton: {
    backgroundColor: '#007AFF',
  },
  inactiveTabButton: {
    backgroundColor: '#E3F2FF',
  },
  buttonText: {
    fontSize: 16,
  },
  activeButtonText: {
    color: '#FFFFFF',
  },
  inactiveButtonText: {
    color: '#007AFF',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    width: '100%',
  },
  switchLabel: {
    marginRight: 10,
    fontSize: 16,
    fontWeight: 'bold',
  },
  switchText: {
    fontSize: 16,
    marginHorizontal: 5,
    // color: '#aaa', // Dim inactive text - keeping original style
  },
  // switchTextActive: { // Not used with isOwnerMode boolean directly for text style
  //     color: '#000', 
  //     fontWeight: 'bold',
  // },
  form: {
    width: '100%',
    gap: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: '#000',
    padding: 15,
    borderRadius: 5,
    width: '100%',
  },
  passwordContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  passwordInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#000',
    padding: 15,
    borderRadius: 5,
    paddingRight: 50,
  },
  eyeIcon: {
    position: 'absolute',
    right: 12,
    height: '100%',
    justifyContent: 'center',
  },
  goButton: {
    backgroundColor: '#5ced73',
    padding: 15,
    borderRadius: 13,
    alignItems: 'center',
    width: '20%',
    alignSelf: 'flex-end',
    borderWidth: 1,
    borderColor: '#000',
  },
  goButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
