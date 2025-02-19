import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import NavigationBar from './Navigation';

export default function Explore() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Explore Page Coming Soon</Text>
      <NavigationBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
      flex: 1,
      backgroundColor: '#fff',
    },
  text: {
    color: '#000',
    fontSize: 18,
  },
});
