import React from 'react';
import { StyleSheet, View, Text } from 'react-native';

export default function Profile() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Profile Page Coming Soon</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  text: {
    color: '#FFF',
    fontSize: 18,
  },
});
