import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, Button, Alert, TouchableOpacity,
  Image, StyleSheet, TextInput, ScrollView, FlatList, ActivityIndicator
} from 'react-native';
import axios from 'axios';
import * as ImagePicker from 'expo-image-picker';
import { Audio } from 'expo-av'; // Import Audio
import { MaterialIcons } from '@expo/vector-icons'; // Import an icon library
import AsyncStorage from '@react-native-async-storage/async-storage';
import NavigationBar from './Navigation';

// Debounce function
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

export default function CreatePostScreen({ navigation }) {
  // User data states
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  // Post form states
  const [reviewText, setReviewText] = useState('');
  const [rating, setRating] = useState(0);
  const [selectedImage, setSelectedImage] = useState(null);

  // Search/Autocomplete States
  const [restaurantSearch, setRestaurantSearch] = useState('');
  const [dishSearch, setDishSearch] = useState('');
  const [restaurantSuggestions, setRestaurantSuggestions] = useState([]);
  const [dishSuggestions, setDishSuggestions] = useState([]);
  const [selectedRestaurantObj, setSelectedRestaurantObj] = useState(null);
  const [selectedDishObj, setSelectedDishObj] = useState(null);
  const [isRestaurantLoading, setIsRestaurantLoading] = useState(false);
  const [isDishLoading, setIsDishLoading] = useState(false);

  // --- Speech-to-Text States ---
  const [recording, setRecording] = useState(null); // Stores the recording object
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessingAudio, setIsProcessingAudio] = useState(false);
  const [micPermission, setMicPermission] = useState(null);
  // --- End Speech-to-Text States ---

  // Refs for debounce timeouts
  const restaurantSearchTimeout = useRef(null);
  const dishSearchTimeout = useRef(null);

  // Request Microphone Permissions on Mount
  useEffect(() => {
    (async () => {
      const { status } = await Audio.requestPermissionsAsync();
      setMicPermission(status === 'granted');
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Microphone access is needed for the dictation feature.');
      }
    })();
  }, []);


  // Load user details from AsyncStorage
  useEffect(() => {
    const fetchUserParams = async () => {
      try {
        const userId = await AsyncStorage.getItem('userID'); 
        const authToken = await AsyncStorage.getItem('token');
        console.log("NewPost.js - Fetched from AsyncStorage:", { userId, authToken });

        if (!userId || !authToken) {
          Alert.alert('Error', 'User not found, please log in again');
          navigation.navigate('Auth');
          return;
        }
        setUser({ _id: userId });
        setToken(authToken);
      } catch (error) {
        console.error('Error loading user:', error);
        Alert.alert('Error', 'Failed to load user data');
      }
    };
    fetchUserParams();
  }, [navigation]);

  // --- Restaurant Search Logic ---
  const fetchRestaurantSuggestions = async (query) => {
    if (!query || query.length < 2) {
      setRestaurantSuggestions([]);
      setIsRestaurantLoading(false);
      return;
    }
    setIsRestaurantLoading(true);
    try {
      const res = await axios.get(`${process.env.EXPO_PUBLIC_API_URL}/api/restaurants/search`, {
        params: { query }
      });
      const suggestions = res.data?.restaurants || res.data || [];
      setRestaurantSuggestions(suggestions);
    } catch (error) {
      console.error("Error fetching restaurant suggestions:", error);
      setRestaurantSuggestions([]);
    } finally {
      setIsRestaurantLoading(false);
    }
  };
  const debouncedFetchRestaurants = useCallback(debounce(fetchRestaurantSuggestions, 300), []);
  const handleRestaurantSearch = (text) => {
    setRestaurantSearch(text);
    if (!text) {
        setSelectedRestaurantObj(null); setRestaurantSuggestions([]); setDishSearch('');
        setSelectedDishObj(null); setDishSuggestions([]); setIsRestaurantLoading(false);
    } else if (!selectedRestaurantObj || text !== selectedRestaurantObj.name) {
        setSelectedRestaurantObj(null); setDishSearch(''); setSelectedDishObj(null);
        setDishSuggestions([]); debouncedFetchRestaurants(text);
    } else {
         setRestaurantSuggestions([]); setIsRestaurantLoading(false);
    }
  };
  const selectRestaurant = (restaurant) => {
    setSelectedRestaurantObj(restaurant); setRestaurantSearch(restaurant.name);
    setRestaurantSuggestions([]); setDishSearch(''); setSelectedDishObj(null);
    setDishSuggestions([]);
  };
  // --- End Restaurant Search Logic ---

  // --- Dish Search Logic ---
   const fetchDishSuggestions = async (restaurantId, query) => {
    if (!restaurantId || !query || query.length < 1) {
      setDishSuggestions([]); setIsDishLoading(false); return;
    }
    setIsDishLoading(true);
    try {
      const res = await axios.get(`${process.env.EXPO_PUBLIC_API_URL}/api/restaurants/${restaurantId}/menu/search`, {
        params: { query }
      });
      setDishSuggestions(res.data || []);
    } catch (error) {
      console.error("Error fetching dish suggestions:", error); setDishSuggestions([]);
    } finally {
      setIsDishLoading(false);
    }
  };
  const debouncedFetchDishes = useCallback(debounce(fetchDishSuggestions, 300), [selectedRestaurantObj]); // Add dependency
  const handleDishSearch = (text) => {
    setDishSearch(text);
     if (!selectedRestaurantObj) {
        Alert.alert("Please select a restaurant first."); setDishSearch(''); return;
    }
    if (!text) {
        setSelectedDishObj(null); setDishSuggestions([]); setIsDishLoading(false);
    } else if (!selectedDishObj || text !== selectedDishObj.name) {
        setSelectedDishObj(null); debouncedFetchDishes(selectedRestaurantObj._id, text);
    } else {
        setDishSuggestions([]); setIsDishLoading(false);
    }
  };
  const selectDish = (dish) => {
    setSelectedDishObj(dish); setDishSearch(dish.name); setDishSuggestions([]);
  };
  // --- End Dish Search Logic ---

  // --- Speech-to-Text Logic ---
  async function startRecording() {
    if (micPermission !== true) {
      Alert.alert('Permission Required', 'Microphone access was not granted.');
      return;
    }
    try {
      console.log('Requesting Permissions..');
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      console.log('Starting recording..');
      // Define specific recording options for better compatibility
      const recordingOptions = {
        android: {
            extension: '.m4a',
            outputFormat: Audio.AndroidOutputFormat.MPEG_4,
            audioEncoder: Audio.AndroidAudioEncoder.AAC,
            sampleRate: 44100,
            numberOfChannels: 2,
            bitRate: 128000,
        },
        ios: {
            extension: '.m4a',
            outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
            audioQuality: Audio.IOSAudioQuality.HIGH,
            sampleRate: 44100,
            numberOfChannels: 2,
            bitRate: 128000,
            linearPCMBitDepth: 16,
            linearPCMIsBigEndian: false,
            linearPCMIsFloat: false,
        },
        web: { // Add web options if needed, though likely not used here
             mimeType: 'audio/webm',
             bitsPerSecond: 128000,
        }
      };

      // Use custom options instead of preset
      const { recording } = await Audio.Recording.createAsync(
         recordingOptions
      );
      setRecording(recording);
      setIsRecording(true);
      console.log('Recording started');
    } catch (err) {
      console.error('Failed to start recording', err);
      Alert.alert('Recording Error', 'Failed to start recording.');
      setIsRecording(false); // Ensure state is reset
      setRecording(null);
    }
  }

  async function stopRecording() {
    console.log('Stopping recording..');
    if (!recording) {
      console.warn('stopRecording called but no recording object exists.');
      return;
    }
    setIsRecording(false);
    setIsProcessingAudio(true); // Indicate processing started
    try {
      await recording.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({ // Reset audio mode after recording
        allowsRecordingIOS: false,
      });
      const uri = recording.getURI();
      console.log('Recording stopped and stored at', uri);
      setRecording(null); // Clear the recording object

      if (uri) {
        await sendAudioToBackend(uri);
      } else {
         console.error('Recording URI is null after stopping.');
         Alert.alert('Processing Error', 'Could not get recorded audio file.');
         setIsProcessingAudio(false);
      }

    } catch (error) {
        console.error('Failed to stop recording or process audio', error);
        Alert.alert('Processing Error', 'Failed to process recorded audio.');
        setIsProcessingAudio(false);
        setRecording(null); // Ensure recording object is cleared on error
    }
  }

  async function sendAudioToBackend(audioUri) {
     console.log('Sending audio to backend:', audioUri);
     const formData = new FormData();
     // Extract filename and type (basic example, might need refinement)
     const filename = audioUri.split('/').pop();
     const match = /\.(\w+)$/.exec(filename);
     const type = match ? `audio/${match[1]}` : `audio`; // Adjust type as needed (e.g., audio/wav, audio/mp4)

     // Append the file correctly for multer
     formData.append('audio', {
       uri: audioUri,
       name: filename,
       type: type, // Ensure this matches what multer expects or the file type
     });

     try {
        const response = await axios.post(`${process.env.EXPO_PUBLIC_API_URL}/api/speech/speech-to-text`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
             // Add Authorization header if your endpoint requires it
             // 'Authorization': `Bearer ${token}`,
          },
        });
        console.log('Transcription response:', response.data);
        if (response.data && response.data.transcript) {
            // Append transcript to existing review text
            setReviewText(prevText => prevText ? `${prevText} ${response.data.transcript}` : response.data.transcript);
        } else {
             Alert.alert('Transcription Error', 'Received invalid response from server.');
        }
     } catch (error) {
        console.error('Error sending audio to backend:', error.response?.data || error.message || error);
        Alert.alert('Transcription Error', `Failed to get transcription: ${error.response?.data?.error || error.message}`);
     } finally {
        setIsProcessingAudio(false); // Indicate processing finished
     }
  }

  const handleMicPress = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };
  // --- End Speech-to-Text Logic ---


  // Image Picker
  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });
      if (!result.canceled) {
        setSelectedImage(result.assets[0]);
      }
    } catch (err) {
      console.error('ImagePicker Error:', err);
      Alert.alert("Image Picker Error", err.message);
    }
  };

  // Submit post function
  const submitPost = async () => {
    if (
      !selectedRestaurantObj ||
      !selectedRestaurantObj._id ||
      typeof selectedRestaurantObj._id !== 'string' ||
      !selectedDishObj ||
      !selectedDishObj._id ||
      typeof selectedDishObj._id !== 'string'
    ) {
      Alert.alert('Missing Fields', 'Please search and select a valid restaurant and dish from those listed.');
      return;
    }

    if(!selectedImage) {
      Alert.alert('Missing Fields', 'Please select an image.')
      return;
    }

    if (!user || !token) {
      Alert.alert('Error', 'User not found, please log in again');
      return;
    }
    try {
      await createPost({
        title: selectedDishObj.name,
        restaurant_id: selectedRestaurantObj._id,
        dish_id: selectedDishObj._id,
        description: reviewText,
        ratings: rating,
        imageAsset: selectedImage,
      });
      Alert.alert('Success', 'Post created!');
      navigation.navigate('Profile', { displayUserID: user._id });
    } catch (error) {
      Alert.alert('Error Creating Post', error.message || 'Could not create post');
    }
  };

  // Create post API call
  const createPost = async ({ title, restaurant_id, dish_id, description, ratings, imageAsset }) => {
     try {
      const createRes = await axios.post(
        `${process.env.EXPO_PUBLIC_API_URL}/api/posts/${user._id}/create`,
        { title, restaurant_id, dish_id, description, ratings },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const newPost = createRes.data.post;
      const postId = newPost._id;

      const fileName = Date.now() + '-' + (imageAsset.uri.split('/').pop() ?? 'image.jpg');
      let fileType = imageAsset.mimeType || 'image/jpeg';
      if (!fileType.startsWith('image/')) { fileType = 'image/jpeg'; }

      const uploadRes = await axios.post(
        `${process.env.EXPO_PUBLIC_API_URL}/api/posts/${user._id}/posts/${postId}/image`,
        { fileName, fileType },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const { presignedURL } = uploadRes.data;
      console.log("Presigned URL:", presignedURL);

      const imageFetchResponse = await fetch(imageAsset.uri);
      const imageBlob = await imageFetchResponse.blob();
      console.log("Image blob created, size:", imageBlob.size);

      console.log("Uploading file blob to S3 using URL:", presignedURL);
      const uploadFetchResponse = await fetch(presignedURL, {
        method: 'PUT',
        headers: { 'Content-Type': fileType },
        body: imageBlob,
      });

      if (!uploadFetchResponse.ok) {
         const errorText = await uploadFetchResponse.text();
         console.error('S3 Upload Error Status:', uploadFetchResponse.status);
         console.error('S3 Upload Error Text:', errorText);
         throw new Error(`Failed to upload image to S3. Status: ${uploadFetchResponse.status}. ${errorText}`);
      }
      console.log("Image successfully uploaded to S3.");
    } catch (error) {
      console.error('createPost error:', error);
      if (error.response) {
        console.error('Axios error data:', error.response.data);
        console.error('Axios error status:', error.response.status);
      } else if (error.request) {
        console.error('Axios error request:', error.request);
      } else {
        console.error('Error message:', error.message);
      }
      throw new Error(error.message || 'Could not create post. Please check logs for details.');
    }
  };

  // Simple star rating component
  const renderStars = () => {
    const stars = [1, 2, 3, 4, 5];
    return (
      <View style={{ flexDirection: 'row', marginVertical: 5 }}>
        {stars.map((starValue) => (
          <TouchableOpacity key={starValue} onPress={() => setRating(starValue)}>
            <Text style={styles.star(starValue <= rating)}>★</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  // Suggestion Item Component
  const SuggestionItem = ({ item, onPress }) => (
    <TouchableOpacity onPress={onPress} style={styles.suggestionItem}>
      <Text>{item.name}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.screenContainer}>
      <ScrollView style={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Create a New Post</Text>

        {/* Restaurant Search */}
        <Text style={styles.label}>Search Restaurant:</Text>
        {selectedRestaurantObj ? (
          <View style={styles.selectedItemRow}>
            <Text style={styles.selectedText}>{selectedRestaurantObj.name}</Text>
            <TouchableOpacity onPress={() => {
              setSelectedRestaurantObj(null);
              setRestaurantSearch('');
              setDishSearch('');
              setSelectedDishObj(null);
              setDishSuggestions([]);
            }}>
              <Text style={styles.changeButton}>X</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <TextInput
              style={styles.input}
              placeholder="Start typing restaurant name..."
              value={restaurantSearch}
              onChangeText={handleRestaurantSearch}
            />
            {isRestaurantLoading && <ActivityIndicator size="small" />}
            {restaurantSuggestions.length > 0 && (
              restaurantSuggestions.map(item => (
                <SuggestionItem key={item._id} item={item} onPress={() => selectRestaurant(item)} />
              ))
            )}
          </>
        )}

        {/* Dish Search */}
        {selectedRestaurantObj && (
          <>
            <Text style={styles.label}>Search Dish:</Text>
            {selectedDishObj ? (
              <View style={styles.selectedItemRow}>
                <Text style={styles.selectedText}>{selectedDishObj.name}</Text>
                <TouchableOpacity onPress={() => {
                  setSelectedDishObj(null);
                  setDishSearch('');
                  setDishSuggestions([]);
                }}>
                  <Text style={styles.changeButton}>X</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <TextInput
                  style={styles.input}
                  placeholder="Start typing dish name..."
                  value={dishSearch}
                  onChangeText={handleDishSearch}
                />
                {isDishLoading && <ActivityIndicator size="small" />}
                {dishSuggestions.length > 0 && (
                  dishSuggestions.map(item => (
                    <SuggestionItem key={item._id} item={item} onPress={() => selectDish(item)} />
                  ))
                )}
              </>
            )}

          </>
        )}

        {/* Image Picker */}
        <TouchableOpacity style={styles.imagePlaceholder} onPress={pickImage}>
          {selectedImage ? (<Image source={{ uri: selectedImage.uri }} style={styles.previewImage} />) : (<Text style={{ textAlign: 'center' }}>Tap to pick image</Text>)}
        </TouchableOpacity>

        {/* Review Text & Mic Button */}
        <Text style={styles.label}>Review:</Text>
        <View style={styles.reviewContainer}>
          <TextInput
            style={styles.reviewInput}
            placeholder="Your review..."
            value={reviewText}
            onChangeText={setReviewText}
            multiline
          />
          <TouchableOpacity
            style={styles.micButton}
            onPress={handleMicPress}
            disabled={isProcessingAudio || micPermission !== true} // Disable while processing or if no permission
          >
            {isProcessingAudio ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <MaterialIcons name={isRecording ? "stop" : "mic"} size={24} color="white" />
            )}
          </TouchableOpacity>
        </View>

        {/* Rating */}
        <Text style={styles.label}>Rating:</Text>
        {renderStars()}

        <Button title="Submit Post" onPress={submitPost} />
        <View style={{ height: 50 }} />
      </ScrollView>
      <NavigationBar />
    </View>
  );
}

// Updated Styles
const styles = StyleSheet.create({
  screenContainer: { flex: 1, backgroundColor: '#fff' },
  scrollContainer: { flex: 1, padding: 16 },
  title: { fontSize: 22, marginBottom: 10, textAlign: 'center', fontWeight: 'bold' },
  label: { fontSize: 16, marginVertical: 8, fontWeight: '600' },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, borderRadius: 5, marginBottom: 5, fontSize: 16 },
  suggestionsList: { maxHeight: 150, borderColor: '#ccc', borderWidth: 1, borderRadius: 5, backgroundColor: '#fff', position: 'relative', marginBottom: 10 },
  suggestionItem: { padding: 10, borderBottomWidth: 1, borderBottomColor: '#eee' },
  imagePlaceholder: { width: '100%', height: 150, backgroundColor: '#eee', justifyContent: 'center', alignItems: 'center', marginVertical: 15, borderRadius: 5, borderWidth: 1, borderColor: '#ccc' },
  previewImage: { width: '100%', height: '100%', resizeMode: 'cover', borderRadius: 5 },
  reviewContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  reviewInput: { flex: 1, borderWidth: 1, borderColor: '#ccc', padding: 10, borderRadius: 5, fontSize: 16, minHeight: 80, marginRight: 8, textAlignVertical: 'top' }, // Added marginRight and textAlignVertical
  micButton: { backgroundColor: '#007bff', padding: 10, borderRadius: 25, justifyContent: 'center', alignItems: 'center', height: 50, width: 50 }, // Circular button
  star: (isActive) => ({ // Function to return style object
    fontSize: 30,
    color: isActive ? '#FF8000' : 'lightgray',
    marginHorizontal: 4,
  }),
  selectedItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  selectedText: { fontSize: 16 },
  changeButton: { color: '#007bff', fontWeight: '600' },
});
