import React from 'react';
import AuthScreen from './screens/AuthScreen';
import ProfileScreen from './screens/ProfileScreen'
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

export default function App() {
  const Stack = createNativeStackNavigator();

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName='Auth'>
        <Stack.Screen name='Auth' component={AuthScreen}/>
        <Stack.Screen name='Profile' component={ProfileScreen}/>
      </Stack.Navigator>
    </NavigationContainer>
  )
}