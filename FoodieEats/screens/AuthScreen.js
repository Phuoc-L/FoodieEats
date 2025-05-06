import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, Alert, TouchableWithoutFeedback, Platform, Keyboard, KeyboardAvoidingView, Switch } from 'react-native';
import axios from 'axios';
import { Eye, EyeOff } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function AuthScreen(props) {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  // Use accountType state: 'personal' or 'owner'
  const [accountType, setAccountType] = useState('personal'); 

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    username: '',
    password: '',
  });

  // Save data
  const saveData = async (dataName, data) => {
    try {
        await AsyncStorage.setItem(dataName, data);
    } catch (e) {
        console.error(e);
    }
  };

  // Combined Login Function
  const handleLogin = async (credentials) => {
    const isOwnerLogin = accountType === 'owner';
    const loginUrl = isOwnerLogin
      ? `${process.env.EXPO_PUBLIC_API_URL}/api/restaurant-owners/login`
      : `${process.env.EXPO_PUBLIC_API_URL}/api/users/login`;
      
    try {
      console.log(`Attempting ${accountType} login to: ${loginUrl}`);
      const response = await axios.post(loginUrl, credentials);
      
      const { token } = response.data;
      // Backend returns 'user' for personal and 'owner' for restaurant owner
      const userData = response.data.user || response.data.owner; 
      
      if (!userData || !token) {
          throw new Error("Invalid login response structure from backend.");
      }

      // Clear previous potentially conflicting keys to be safe
      await AsyncStorage.removeItem("userId"); // Main ID key
      await AsyncStorage.removeItem("isOwner");
      await AsyncStorage.removeItem("restaurantId");
      await AsyncStorage.removeItem("token");


      // Save common data
      await saveData("token", token);
      await saveData("isOwner", isOwnerLogin.toString()); // 'true' or 'false'
      await saveData("userId", userData._id); // Store the unique ID (_id from users or restaurant_owners)

      let targetScreen = 'UserFeed'; // Default for personal users

      // Save restaurantId only for owners and set target screen
      if (isOwnerLogin) {
        if (userData.restaurant_id) {
          await saveData("restaurantId", userData.restaurant_id);
          targetScreen = 'RestaurantPage'; // Navigate owner to their RestaurantPage
          console.log("Owner login, restaurantId:", userData.restaurant_id);
        } else {
          console.error("Owner login successful but restaurant_id missing in response.");
          Alert.alert("Login Error", "Owner account error: Restaurant ID missing.");
          return; // Stop if essential data is missing for owner
        }
      }
      
      Keyboard.dismiss();
      // Navigate after successful login and data storage
      props.navigation.reset({ 
          index: 0, 
          routes: [{ name: targetScreen, params: isOwnerLogin ? { restaurantId: userData.restaurant_id } : {} }] 
      });

    } catch (error) {
      console.error(`${accountType} Login error:`, error.response ? error.response.data : error.message);
      Alert.alert("Login Error", error.response?.data?.error || `Failed to log in as ${accountType}.`);
    }
  };

  const signupUser = async (userData) => {
    try {
      // Prepare data common to both user types
      const commonData = {
        first_name: userData.firstName,
        last_name: userData.lastName,
        email: userData.email,
        username: userData.username,
        password: userData.password,
      };

      // Determine URL based on account type
      const signupUrl = accountType === 'owner'
        ? `${process.env.EXPO_PUBLIC_API_URL}/api/restaurant-owners/signup`
        : `${process.env.EXPO_PUBLIC_API_URL}/api/users/signup`;

      console.log(`Attempting ${accountType} signup to: ${signupUrl}`);
      // Backend handles restaurant creation for owner signup
      const response = await axios.post(signupUrl, commonData); 
      
      Keyboard.dismiss();
      console.log(`${accountType} Signup successful:`, response.data);

      Alert.alert("Success", `${accountType === 'owner' ? 'Restaurant Owner' : 'User'} account created successfully! Please log in.`);
      // Switch to login view and set account type for convenience
      setIsLogin(true); 
      // setAccountType(accountType); // Keep the selected account type for login
    } catch (error) {
      console.error('Signup error:', error.response ? error.response.data : error.message);
      Alert.alert("Signup Error", error.response?.data?.error || "Something went wrong");
    }
  };

  const handleSubmit = () => {
    if (isLogin) {
      handleLogin({ email: formData.email, password: formData.password }); 
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

          {/* Moved Switch Container Here */}
          <View style={styles.switchContainer}>
            <Text style={styles.switchLabel}>Account Type:</Text>
            <Text style={[styles.switchText, accountType === 'personal' && styles.switchTextActive]}>Personal</Text>
            <Switch
              trackColor={{ false: "#767577", true: "#81b0ff" }}
              thumbColor={accountType === 'owner' ? "#007AFF" : "#f4f3f4"}
              ios_backgroundColor="#3e3e3e"
              onValueChange={() => setAccountType(prev => prev === 'personal' ? 'owner' : 'personal')}
              value={accountType === 'owner'} // Switch is on if type is 'owner'
            />
            <Text style={[styles.switchText, accountType === 'owner' && styles.switchTextActive]}>Owner</Text>
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
    color: '#aaa', // Dim inactive text
  },
  switchTextActive: {
      color: '#000', // Highlight active text
      fontWeight: 'bold',
  },
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
