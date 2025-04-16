import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    Image,
    TouchableOpacity,
    Dimensions,
    Button,
    ScrollView,
    TextInput,
    Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { FontAwesome } from '@expo/vector-icons';
import { useNavigation } from "@react-navigation/native";
import axios from 'axios';


export default function EditRestaurant({ route }) {
    const navigation = useNavigation();

    const { restaurantId } = route.params || {};

    const [restaurant, setRestaurant] = useState(null);
    const [loading, setLoading] = useState(true);
    const [inputHeight, setInputHeight] = useState(40);

    useEffect(() => {
        fetchRestaurant();
    }, []);

    const fetchRestaurant = async () => {
        const response = await axios.get(
            `${process.env.EXPO_PUBLIC_API_URL}/api/restaurants/${restaurantId}`
        );

        setRestaurant(response.data);
        setLoading(false);
    };

    const updateField = (field, value) => {
        setRestaurant({ ...restaurant, [field]: value });
    };

    const updateContact = (field, value) => {
        setRestaurant({
            ...restaurant,
            contact_info: { ...restaurant.contact_info, [field]: value },
        });
    };

    const updateMenuItem = (index, field, value) => {
        const updatedMenu = [...restaurant.menu];
        updatedMenu[index][field] = value;
        setRestaurant({ ...restaurant, menu: updatedMenu });
    };

    const addMenuItem = () => {
        setRestaurant({
            ...restaurant,
            menu: [
                ...restaurant.menu,
                {
                    name: '',
                    description: '',
                    price: 0,
                    average_rating: 0,
                    num_ratings: 0,
                },
            ],
        });
    };

    const removeMenuItem = (index) => {
        const updated = restaurant.menu.filter((_, i) => i !== index);
        setRestaurant({ ...restaurant, menu: updated });
    };

    const cleanRestaurant = () => {
        const location          = (restaurant.location        ?? "").trim();
        const operating_hours   = (restaurant.operating_hours ?? "").trim();

        if (location === "" || operating_hours === "") {
            Alert.alert(
                "Missing Required Info",
                "Please fill in both Location and Operating Hours before saving."
            );
            return null;
        }


        return {
            ...restaurant,
            location,
            operating_hours,
            contact_info: {
                phone : (restaurant.contact_info?.phone  ?? "").trim(),
                email : (restaurant.contact_info?.email  ?? "").trim(),
            },
            menu: restaurant.menu.map((m) => ({
                ...m,
                price: parseFloat(m.price) || 0,
            })),
        };
    };

    const saveChanges = async () => {
        const payload = cleanRestaurant();
        if (!payload) return;

        try {
            await axios.put(
                `${process.env.EXPO_PUBLIC_API_URL}/api/restaurants/${restaurantId}`,
                payload
            );
            navigation.navigate("RestaurantPage", { restaurantId });
        } catch (err) {
            Alert.alert('Error saving changes', err.message);
        }
    };

    if (loading || !restaurant) return <Text>Loading...</Text>;

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Text style={styles.header}>Edit Restaurant Info</Text>
                <Text style={styles.subheader}>Name</Text>

                <TextInput
                    style={styles.input}
                    placeholder="Name"
                    value={restaurant.name}
                    onChangeText={(text) => updateField('name', text)}
                />

                <Text style={styles.subheader}>Location</Text>

                <TextInput
                    style={styles.input}
                    placeholder="Location"
                    value={restaurant.location}
                    onChangeText={(text) => updateField('location', text)}
                />

                <Text style={styles.subheader}>Operating Hours</Text>

                <TextInput
                    style={styles.input}
                    placeholder="Operating Hours"
                    value={restaurant.operating_hours}
                    onChangeText={(text) => updateField('operating_hours', text)}
                />

                <Text style={styles.subheader}>Phone Number</Text>

                <TextInput
                    style={styles.input}
                    placeholder="Phone"
                    value={restaurant.contact_info.phone}
                    onChangeText={(text) => updateContact('phone', text)}
                />

                <Text style={styles.subheader}>Email</Text>

                <TextInput
                    style={styles.input}
                    placeholder="Email"
                    value={restaurant.contact_info.email}
                    onChangeText={(text) => updateContact('email', text)}
                />

                <Text style={styles.header}>Menu Items</Text>

                {restaurant.menu.map((item, idx) => (
                    <View key={idx} style={styles.menuItem}>
                        <TextInput
                            style={styles.input}
                            placeholder="Name"
                            value={item.name}
                            onChangeText={(text) => updateMenuItem(idx, 'name', text)}
                        />
                        <TextInput
                            style={styles.description}
                            placeholder="Description"
                            value={item.description}
                            onChangeText={(text) => updateMenuItem(idx, 'description', text)}
                            multiline
                            numberOfLines={4}
                            textAlignVertical="top"
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Price"
                            keyboardType="numeric"
                            value={item.price?.toString() ?? ''}
                            onChangeText={(text) => updateMenuItem(idx, 'price', text)}
                        />
                        <Button
                            title="Remove"
                            color="red"
                            onPress={() => removeMenuItem(idx)}
                        />
                    </View>
                ))}

                <Button title="Add Menu Item" onPress={addMenuItem} />


            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity style={styles.saveButton} onPress={saveChanges}>
                    <Text style={styles.saveButtonText}>SAVE CHANGES</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 100,
    },
    footer: {
        padding: 10,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#ccc',
    },
    saveButton: {
        backgroundColor: '#0080F0',
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center',
    },
      saveButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    header: { fontSize: 24, fontWeight: 'bold', marginTop: 20, marginBottom: 10 },
    subheader: { fontSize: 18, fontWeight: '600', marginTop: 10, marginBottom: 10 },
    input: {
        borderWidth: 1,
        borderColor: '#aaa',
        borderRadius: 6,
        padding: 8,
        marginBottom: 10,
    },
    description: {
        borderWidth: 1,
        borderColor: '#aaa',
        borderRadius: 6,
        padding: 8,
        marginBottom: 10,
        minHeight: 100,
        textAlignVertical: 'top',
    },
    menuItem: {
        borderWidth: 1,
        borderColor: '#ccc',
        padding: 10,
        borderRadius: 6,
        marginBottom: 10,
    },
});