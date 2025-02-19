import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import NavigationBar from './Navigation';

export default function Profile() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Profile Page Coming Soon</Text>
      <NavigationBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  text: {
    color: '#000',
    fontSize: 18,
  },
});
