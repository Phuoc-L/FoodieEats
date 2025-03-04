import React, { useEffect, useState, useCallback } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import TempPostComponent from './TempPostComponent';
import axios from 'axios';


export default function DishReviews(props, dish) {
    const dish_param = props.route.params.dish;
    const [posts, setPosts] = useState([]);

    useFocusEffect(
        useCallback(() => {
            fetchPosts();
        }, [])
    );

    const fetchPosts = async () => {
        const url_prefix = 'http://192.168.99.152:3000/api';

        const response = await axios.get(`${url_prefix}/restaurants/${dish_param._id}/reviews`);
        console.log(response.data)

        if (response.status === 200) {
            const responseData = response.data || [];
            setPosts(responseData.posts);

        } else {
            console.error('Error fetching posts:', response.status);
        }
    };


    return (

        <View style={styles.container}>
            <FlatList
                data={posts}
                keyExtractor={(item) => item._id}
                renderItem={({ item }) => <TempPostComponent {...props} item={item} />}
                contentContainerStyle={styles.feed}
            />
        </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  feed: {
    paddingBottom: 60,
  },
});