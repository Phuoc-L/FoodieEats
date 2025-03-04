import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AuthScreen from './screens/AuthScreen';
import UserFeed from './screens/UserFeed';
import Explore from './screens/Explore';
import Profile from './screens/Profile';
import NewPost from './screens/NewPost';
import RestaurantPage from './screens/RestaurantPage';
import DishReviews from './screens/DishReviews';

//export default function App() {
//  return <AuthScreen />;
//}



const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="RestaurantPage">
        <Stack.Screen name="UserFeed" component={UserFeed} options={{ headerShown: false }} />
        <Stack.Screen name="Explore" component={Explore} options={{ headerShown: false }} />
        <Stack.Screen name="Profile" component={Profile} options={{ headerShown: false }} />
        <Stack.Screen name="NewPost" component={NewPost} />
        <Stack.Screen name="RestaurantPage" component={RestaurantPage} options={{ headerShown: true }} />
        <Stack.Screen name="DishReviews" component={DishReviews} options={{ title: "Dish Reviews" }}/>
      </Stack.Navigator>
    </NavigationContainer>
  );
}