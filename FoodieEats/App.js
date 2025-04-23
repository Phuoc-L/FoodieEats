import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AuthScreen from './screens/AuthScreen';
import UserFeed from './screens/UserFeed';
import Explore from './screens/Explore';
import Profile from './screens/Profile';
import NewPost from './screens/NewPost';
import CommentsPage from './screens/CommentsPage';
import RestaurantPage from './screens/RestaurantPage'; // Import RestaurantPage
import ProfilePostFeed from './screens/ProfilePostFeed'; // Import the new screen


const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Auth">
        <Stack.Screen name="Auth" component={AuthScreen} options={{ headerShown: false }} />
        <Stack.Screen name="UserFeed" component={UserFeed} options={{ headerShown: false }} />
        <Stack.Screen name="Explore" component={Explore} options={{ headerShown: false }} />
        <Stack.Screen name="Profile" component={Profile} options={{ headerShown: true }} />
        <Stack.Screen name="NewPost" component={NewPost} />
        <Stack.Screen name="CommentsPage" component={CommentsPage} options={{ title: "Comments" }}/>
        <Stack.Screen name="RestaurantPage" component={RestaurantPage} options={{ title: "Restaurant Profile" }}/>

        <Stack.Screen name="ProfilePostFeed" component={ProfilePostFeed} options={{ title: "Post Feed" }}/>
      </Stack.Navigator>
    </NavigationContainer>
  );
}
