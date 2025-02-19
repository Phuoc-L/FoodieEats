import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AuthScreen from './screens/AuthScreen';
import UserFeed from './screens/UserFeed';
import Explore from './screens/Explore';
import Profile from './screens/Profile';
import NewPost from './screens/NewPost';

//export default function App() {
//  return <AuthScreen />;
//}



const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="UserFeed">
        <Stack.Screen name="UserFeed" component={UserFeed} options={{ title: "Following" }} />
        <Stack.Screen name="Explore" component={Explore} options={{ title: "Explore" }} />
        <Stack.Screen name="Profile" component={Profile} options={{ title: "Profile" }} />
        <Stack.Screen name="NewPost" component={NewPost} options={{ headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
