import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity } from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';

export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    username: '',
    password: '',
  });

  const handleSubmit = () => {
    console.log('Form submitted:', formData);
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
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
            placeholder="Username or Email"
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
      </View>
    </View>
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
    marginTop: 40,
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