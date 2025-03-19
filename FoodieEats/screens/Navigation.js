import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { FontAwesome } from '@expo/vector-icons';

export default function NavigationBar() {
  const navigation = useNavigation();

  const DEFAULT_LOGGED_IN_USER_ID = 0;

  return (
    <View style={styles.navBar}>
      <TouchableOpacity onPress={() => navigation.reset({
        index: 0,
        routes: [{name: 'UserFeed'}],
      })}>
        <FontAwesome name="home" size={24} color="black" />
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.reset({
        index: 0,
        routes: [{name: 'Explore'}],
      })}>
        <FontAwesome name="globe" size={24} color="black" />
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.reset({
        index: 0,
        routes: [{name: 'NewPost'}],
      })}>
        <FontAwesome name="plus-circle" size={24} color="black" />
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.reset({
        index: 0,
        routes: [{name: 'Profile', params: { displayUserId: DEFAULT_LOGGED_IN_USER_ID}}],
      })}>
        <FontAwesome name="user" size={24} color="black" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#ccc',
    backgroundColor: '#fff',
  },
});
