import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function PostComponent({ item }) {
  const renderStars = (rating) => {
    return (
      <View style={styles.starContainer}>
        {[...Array(5)].map((_, index) => (
          <FontAwesome
            key={index}
            name={index < rating ? "star" : "star-o"}
            size={0.13*width}
            color="#0080F0"
            style={styles.star}
          />
        ))}
      </View>
    );
  };

  return (
    <View style={styles.postContainer}>
      <View style={styles.header}>
        <Image
          source={{ uri: item.user_id.profile.avatar_url }}
          style={styles.avatar}
        />
        <Text style={styles.username}>@{item.user_id.username}</Text>
      </View>
      <Image source={{ uri: item.media_url }} style={styles.media} />
      {renderStars(item.ratings)}
      <Text style={styles.itemName}>{item.dishName}</Text>
      <Text style={styles.restaurantName}>{item.restaurant.name}</Text>
      <View style={styles.descriptionContainer}>
        <Text style={styles.description}>
          <Text style={styles.title}>{item.title}  </Text>
          {item.description}
        </Text>
      </View>
      <View style={styles.footer}>
        <Text style={styles.likes}>{item.like_list.length} {item.like_list.length === 1 ? "like" : "likes"}</Text>
        <TouchableOpacity style={styles.commentsButton}>
          <Text style={styles.commentsText}>View Comments</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  postContainer: {
    marginTop: 20,
    marginBottom: 20,
  },
  descriptionContainer: {
    padding: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  avatar: {
    width: width / 7,
    height: width / 7,
    borderRadius: 10,
    marginRight: width / 40,
    marginLeft: 10
  },
  username: {
    color: "#0080F0",
    fontSize: width / 20,
  },
  media: {
    width: width,
    height: width,
    alignItems: 'center',
  },
  itemName: {
    fontSize: width / 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  restaurantName: {
    fontSize: width / 25,
    color: '#555',
    textAlign: 'center',
  },
  title: {
    fontSize: width / 22,
    fontWeight: 'bold',
  },
  description: {
    fontSize: width / 22,
  },
  starContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 5,
  },
  star: {
    marginHorizontal: width / 70,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 10,
    marginTop: 5,
  },
  likes: {
    color: '#0080F0',
    fontSize: 16,
  },
  commentsButton: {
    backgroundColor: '#fff',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  commentsText: {
    color: '#0080F0',
    fontSize: 14,
    fontWeight: 'bold',
  },
});