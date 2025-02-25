import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AuthScreen from './screens/AuthScreen';
import UserFeed from './screens/UserFeed';
import Explore from './screens/Explore';
import Profile from './screens/Profile';
import NewPost from './screens/NewPost';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Profile">
        <Stack.Screen name="UserFeed" component={UserFeed} options={{ headerShown: false }} />
        <Stack.Screen name="Explore" component={Explore} options={{ headerShown: false }} />
        <Stack.Screen name="Profile" component={Profile} options={{ headerShown: false }} />
        <Stack.Screen name="NewPost" component={NewPost} />
      </Stack.Navigator>
    </NavigationContainer>
  )
}
