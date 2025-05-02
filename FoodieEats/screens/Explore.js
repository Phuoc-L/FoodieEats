import { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, Image, StyleSheet, Modal, TouchableWithoutFeedback, Keyboard, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import NavigationBar from './Navigation';
import DropDownPicker from 'react-native-dropdown-picker';
import PostComponent from './PostComponent';

export default function Explore() {
  // const user = props.route.params.user;

  const [searchMode, setSearchMode] = useState('posts'); // 'users' or 'restaurants' or 'posts'
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState([]);
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [sortField, setSortField] = useState('');
  const [sortOrder, setSortOrder] = useState('asc');
  const [sortOpen, setSortOpen] = useState(false);
  const [orderOpen, setOrderOpen] = useState(false);
  const navigation = useNavigation();

  // User filters
  const [minFollowers, setMinFollowers] = useState('');
  const [maxFollowers, setMaxFollowers] = useState('');
  const [minPosts, setMinPosts] = useState('');
  const [maxPosts, setMaxPosts] = useState('');

  // Restaurant filters
  const [minRating, setMinRating] = useState('');
  const [maxRating, setMaxRating] = useState('');

  // Post filters
  const [minLikes, setMinLikes] = useState('');
  const [maxLikes, setMaxLikes] = useState('');
  const [minComments, setMinComments] = useState('');
  const [maxComments, setMaxComments] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // store each search results
  const [userSearchResults, setUserSearchResults] = useState([]);
  const [restaurantSearchResults, setRestaurantSearchResults] = useState([]);
  const [postSearchResults, setPostSearchResults] = useState([]);

  const flatListRef = useRef(null);

  useEffect(() => {
    runOnLoad();
  }, []);

  const runOnLoad = async () => {
    try {
      handleSearch(); // default search
      let userResponse = await axios.get(process.env.EXPO_PUBLIC_API_URL + "/api/users/search");
      setUserSearchResults(userResponse.data.users);
      let restaurantsResponse = await axios.get(process.env.EXPO_PUBLIC_API_URL + "/api/restaurants/search");
      setRestaurantSearchResults(restaurantsResponse.data.restaurants);
    } catch (error) {
      console.error(`Error fetching ${searchMode}:`, error.response?.data || error.message);
    }
  };

  const renderUserItem = (item) => { // Changed to block body {}
    console.log('Rendering User Item:', JSON.stringify(item)); // Log user item data
    // Added optional chaining for safety
    const avatarUrl = item?.profile?.avatar_url;
    const bio = item?.profile?.bio;

    return ( // Added explicit return
      <TouchableOpacity onPress={() => navigation.push('Profile', { displayUserID: item?._id })}>
        <View style={styles.resultCard}>
          <Image source={avatarUrl ? { uri: avatarUrl} : require('../assets/defaultUserIcon.png')} style={styles.avatar} />
          <View style={styles.resultDetailBox}>
            <Text style={styles.resultName}>@{item?.username}</Text>
            <Text style={styles.fullName}>{item?.first_name} {item?.last_name}</Text>
            <Text style={styles.resultDetails}>{bio}</Text>
          </View>
        </View>
      </TouchableOpacity>
    ); // Closing parenthesis for return
  }; // Closing brace for function body
  
  const renderRestaurantItem = (item) => (
    <TouchableOpacity onPress={() => navigation.navigate('RestaurantPage', { restaurantId: item._id })}>
      <View style={styles.resultCard}>
        <View style={styles.resultDetailBox}>
          <View style={styles.Rating}>
            <Text style={styles.resultName}>{item.name}</Text>
            <Text>
              {item.average_rating?.toFixed(1) || 'N/A'} <Ionicons name="star" size={16} color="gold" /> 
            </Text>
          </View>
          <Text style={styles.fullName}>{item.location}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderPostItem = (item) => { // Changed to block body {}
    // Added optional chaining for safety
    const avatarUrl = item?.user_id?.profile?.avatar_url;
    const restaurantName = item?.restaurant_id?.name ? item.restaurant_id.name : item?.restaurant_id ? item.restaurant_id : "No restaurantID.";
    const dishName = item?.restaurant_id && item?.dish_id ? getDishNameByDishId(item.restaurant_id, item.dish_id) : "N/A";
    const username = item?.user_id?.username;

    const restaurantExists = item?.restaurant_id?.name ? true : item?.restaurant_id ? true : false;

    const enrichedPost = restaurantExists ? {...item, dish_name: dishName} : {...item, dish_name: dishName, restaurant_id: {name: "No name."}};

    return (
      <PostComponent
        post={enrichedPost}
        onDeleteSuccess={(deletedPostId) => {
          setPosts(current => current.filter(post => post._id !== deletedPostId));
        }}
      />
    );
  }; // Closing brace for function body

  const handleSearch = async () => {
    try {
      const endpoint = searchMode === 'users' ? '/api/users/search' : searchMode === 'restaurants' ? '/api/restaurants/search' : '/api/posts/search';
      const params = {
        query: searchQuery,
        sortBy: sortField || undefined,
        sortOrder: sortOrder || 'asc',
        ...(searchMode === 'users' ? {
          minFollowers: minFollowers || undefined,
          maxFollowers: maxFollowers || undefined,
          minPosts: minPosts || undefined,
          maxPosts: maxPosts || undefined,
        } : searchMode === 'restaurants' ?{
          minRating: minRating || undefined,
          maxRating: maxRating || undefined,
        } : searchMode === 'posts' ? {
          minLikes: minLikes || undefined,
          maxLikes: maxLikes || undefined,
          minComments: minComments || undefined,
          maxComments: maxComments || undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          minRating: minRating || undefined,
          maxRating: maxRating || undefined,
        } : {})
      };

      console.log(process.env.EXPO_PUBLIC_API_URL + endpoint);
      const response = await axios.get(process.env.EXPO_PUBLIC_API_URL + endpoint, { params });

      setResults(response.data.restaurants || response.data.users || response.data.posts);
      console.log("results.length:", response.data.posts.length);
      Keyboard.dismiss();
      flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
    } catch (error) {
      console.error(`Error fetching ${searchMode}:`, error.response?.data || error.message);
    }
  };

  const handleModeToggle = async (mode) => {
    Keyboard.dismiss();
    const tempSearchMode = searchMode;
    setSearchMode(mode);
    
    // store the search results for previous mode
    if (tempSearchMode === 'users') {
      setUserSearchResults(results);
    } else if (tempSearchMode === 'restaurants') {
      setRestaurantSearchResults(results);
    } else if (tempSearchMode === 'posts') {
      setPostSearchResults(results);
    }
    // set results to the stored search results
    if (mode === 'users') {
      setResults(userSearchResults);
    } else if (mode === 'restaurants') {
      setResults(restaurantSearchResults);
    } else if (mode === 'posts') {
      setResults(postSearchResults);
    }
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  };

  const getDishNameByDishId = (restaurant, dishId) => {
    const dish = restaurant.menu.find((item) => item._id === dishId);
    return dish ? dish.name : 'Dish not found';
  };

  return (
//    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}> 
          <Text style={styles.title}>Explore</Text>
          <View style={styles.modeToggle}>
            <TouchableOpacity onPress={() => handleModeToggle('users')}>
              <Text style={[styles.modeButton, searchMode === 'users' && styles.activeMode]}>Users</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleModeToggle('restaurants')}>
              <Text style={[styles.modeButton, searchMode === 'restaurants' && styles.activeMode]}>Restaurants</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleModeToggle('posts')}>
              <Text style={[styles.modeButton, searchMode === 'posts' && styles.activeMode]}>Posts</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ padding: 10 }}>
          <View style={styles.searchContainer}>
            <TextInput style={styles.searchInput} placeholder={`Search ${searchMode}...`} value={searchQuery} onChangeText={setSearchQuery}/>
            <TouchableOpacity onPress={() => { setFiltersVisible(true); Keyboard.dismiss(); }}>
              <Ionicons name="options" size={30} color="black" />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSearch}>
              <Ionicons name="search" size={30} color="black" />
            </TouchableOpacity>
          </View>
        </View>

        <FlatList 
          ref={flatListRef}
          data={results}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => 
            searchMode === 'users' 
              ? renderUserItem(item) 
              : searchMode === 'restaurants' 
                ? renderRestaurantItem(item)
                : renderPostItem(item)
          }
        />

        <Modal visible={filtersVisible && searchMode === 'restaurants'} animationType="slide">
          <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <SafeAreaView style={styles.container}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}> 
                  <Text style={styles.modalTitle}>Restaurant Search Filters</Text>
                </View>
                <Text style={styles.label}>Min Rating</Text>
                <TextInput style={styles.input} placeholder={"0"} placeholderTextColor={'#A0A0A0'} keyboardType="numeric" value={minRating} onChangeText={setMinRating} />
                <Text style={styles.label}>Max Rating</Text>
                <TextInput style={styles.input} placeholder={"5"} placeholderTextColor={'#A0A0A0'} keyboardType="numeric" value={maxRating} onChangeText={setMaxRating} />
                <Text style={styles.label}>Sort By</Text>
                <DropDownPicker open={sortOpen} value={sortField}
                  items={[
                    { label: 'Name', value: 'name' },
                    { label: 'Average Rating', value: 'average_rating' }
                  ]} setOpen={setSortOpen} setValue={setSortField} style={[styles.dropdown, {zIndex:2000}]} containerStyle={[styles.dropdownContainer, {zIndex:2000}]}
                />
                <Text style={styles.label}>Sort Order</Text>
                <DropDownPicker open={orderOpen} value={sortOrder}
                  items={[
                    { label: 'Ascending', value: 'asc' },
                    { label: 'Descending', value: 'desc' },
                  ]} setOpen={setOrderOpen} setValue={setSortOrder} style={[styles.dropdown, {zIndex:1000}]} containerStyle={[styles.dropdownContainer, {zIndex:1000}]}
                />
                <TouchableOpacity style={styles.applyButton} onPress={() => { setFiltersVisible(false); setSortOpen(false); setOrderOpen(false); }}>
                  <Text style={styles.applyButtonText}>Apply Filters</Text>
                </TouchableOpacity>
              </View>
            </SafeAreaView>
          </TouchableWithoutFeedback>
        </Modal>

        <Modal visible={filtersVisible && searchMode === 'users'} animationType="slide">
          <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <SafeAreaView style={styles.container}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}> 
                  <Text style={styles.modalTitle}>User Search Filters</Text>
                </View>
                <Text style={styles.label}>Min Followers</Text>
                <TextInput style={styles.input} placeholder={"0"} placeholderTextColor={'#A0A0A0'} keyboardType="numeric" value={minFollowers} onChangeText={setMinFollowers} />
                <Text style={styles.label}>Max Followers</Text>
                <TextInput style={styles.input} placeholder={"100"} placeholderTextColor={'#A0A0A0'} keyboardType="numeric" value={maxFollowers} onChangeText={setMaxFollowers} />
                <Text style={styles.label}>Min Posts</Text>
                <TextInput style={styles.input} placeholder={"0"} placeholderTextColor={'#A0A0A0'} keyboardType="numeric" value={minPosts} onChangeText={setMinPosts} />
                <Text style={styles.label}>Max Posts</Text>
                <TextInput style={styles.input} placeholder={"100"} placeholderTextColor={'#A0A0A0'} keyboardType="numeric" value={maxPosts} onChangeText={setMaxPosts} />
                <Text style={styles.label}>Sort By</Text>
                <DropDownPicker open={sortOpen} value={sortField}
                  items={[
                    { label: 'Follower Count', value: 'followers_count' },
                    { label: 'Post Count', value: 'posts_count' },
                    { label: 'Username', value: 'username' },
                  ]}setOpen={setSortOpen} setValue={setSortField} style={[styles.dropdown, {zIndex:2000}]} containerStyle={[styles.dropdownContainer, {zIndex:2000}]}
                />
                <Text style={styles.label}>Sort Order</Text>
                <DropDownPicker open={orderOpen} value={sortOrder}
                  items={[
                    { label: 'Ascending', value: 'asc' },
                    { label: 'Descending', value: 'desc' },
                  ]} setOpen={setOrderOpen} setValue={setSortOrder} style={[styles.dropdown, {zIndex:1000}]} containerStyle={[styles.dropdownContainer, {zIndex:1000}]}
                />
                <TouchableOpacity style={styles.applyButton} onPress={() => { setFiltersVisible(false); setSortOpen(false); setOrderOpen(false); }}>
                  <Text style={styles.applyButtonText}>Apply Filters</Text>
                </TouchableOpacity>
              </View>
            </SafeAreaView>
          </TouchableWithoutFeedback>
        </Modal>
        
        <Modal visible={filtersVisible && searchMode === 'posts'} animationType="slide">
          <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <SafeAreaView style={styles.container}>
              <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                  <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                      <Text style={styles.modalTitle}>Post Search Filters</Text>
                    </View>
                    <Text style={styles.label}>Min Likes</Text>
                    <TextInput style={styles.input} placeholder={"0"} placeholderTextColor={'#A0A0A0'} keyboardType="numeric" value={minLikes} onChangeText={setMinLikes} />
                    <Text style={styles.label}>Max Likes</Text>
                    <TextInput style={styles.input} placeholder={"100"} placeholderTextColor={'#A0A0A0'} keyboardType="numeric" value={maxLikes} onChangeText={setMaxLikes} />
                    <Text style={styles.label}>Min Comments</Text> 
                    <TextInput style={styles.input} placeholder={"0"} placeholderTextColor={'#A0A0A0'} keyboardType="numeric" value={minComments} onChangeText={setMinComments} />
                    <Text style={styles.label}>Max Comments</Text>
                    <TextInput style={styles.input} placeholder={"100"} placeholderTextColor={'#A0A0A0'} keyboardType="numeric" value={maxComments} onChangeText={setMaxComments} />
                    <Text style={styles.label}>Start Date</Text>
                    <TextInput style={styles.input} placeholder={"YYYY-MM-DD"} placeholderTextColor={'#A0A0A0'} value={startDate} onChangeText={setStartDate} />
                    <Text style={styles.label}>End Date</Text>
                    <TextInput style={styles.input} placeholder={"YYYY-MM-DD"} placeholderTextColor={'#A0A0A0'} value={endDate} onChangeText={setEndDate} />
                    <Text style={styles.label}>Min Rating</Text>
                    <TextInput style={styles.input} placeholder={"0"} placeholderTextColor={'#A0A0A0'} keyboardType="numeric" value={minRating} onChangeText={setMinRating} />
                    <Text style={styles.label}>Max Rating</Text>
                    <TextInput style={styles.input} placeholder={"5"} placeholderTextColor={'#A0A0A0'} keyboardType="numeric" value={maxRating} onChangeText={setMaxRating} />
                    <Text style={styles.label}>Sort By</Text>
                    <DropDownPicker open={sortOpen} value={sortField}
                      items={[
                        { label: 'Likes', value: 'num_like' },
                        { label: 'Comments', value: 'num_comments' },
                        { label: 'Rating', value: 'ratings' },
                        { label: 'Date', value: 'timestamp' },
                      ]} setOpen={setSortOpen}  setValue={setSortField} listMode="SCROLLVIEW" style={[styles.dropdown, {zIndex: 2000}]} containerStyle={[styles.dropdownContainer, {zIndex: 2000}]}
                    />
                    <Text style={styles.label}>Sort Order</Text>
                    <DropDownPicker open={orderOpen} value={sortOrder}
                      items={[
                        { label: 'Ascending', value: 'asc' },
                        { label: 'Descending', value: 'desc' },
                      ]} setOpen={setOrderOpen}  setValue={setSortOrder} listMode="SCROLLVIEW" dropDownDirection="BOTTOM" style={[styles.dropdown, {zIndex: 1000}]} containerStyle={[styles.dropdownContainer, {zIndex: 1000}]}
                    />
                    <TouchableOpacity style={styles.applyButton} onPress={() => { setFiltersVisible(false); setSortOpen(false); setOrderOpen(false); }}>
                      <Text style={styles.applyButtonText}>Apply Filters</Text>
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              </KeyboardAvoidingView>
            </SafeAreaView>
          </TouchableWithoutFeedback>
        </Modal>

        <NavigationBar />
      </SafeAreaView>
//    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#fff', 
//    padding: 10,
  },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'flex-end', 
    paddingVertical: 10, 
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderColor: '#ddd'
  },
  title: { 
    fontSize: 32, 
    fontWeight: 'bold' 
  },
  modeToggle: {
    flexDirection: 'row',
    justifyContent: 'flex-around',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    flexShrink: 1,
  },
  modeButton: { 
    fontSize: 16, 
    textAlign: 'center',
    color: '#666', 
    paddingVertical: 5, 
    paddingHorizontal: 10, 
    borderRadius: 20,
    flexShrink: 1 
  },
  activeMode: { 
    fontWeight: 'bold', 
    color: '#fff', 
    backgroundColor: '#007bff' 
  },
  searchContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 10,
    borderRadius: 10, 
    backgroundColor: '#f9f9f9',
    marginVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    gap: 5
  },
  searchInput: { 
    flex: 1, 
    padding: 10, 
    borderRadius: 8, 
    backgroundColor: '#fff', 
    borderWidth: 1, 
    borderColor: '#ccc',
  },
  resultCard: { 
    flexDirection: 'row', 
    alignItems: 'flex-start', 
    padding: 10, 
    borderBottomWidth: 1, 
    borderColor: '#eee', 
    backgroundColor: '#fff', 
    borderRadius: 10, 
    marginVertical: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1
  },
  resultDetailBox: {
    alignItems: 'flex-start',
    justifyContent: 'center',
    borderRadius: 10,
    flex: 1,
    flexWrap: 'wrap',
  },
  avatar: {
    width: 50, 
    height: 50, 
    borderRadius: 25, 
    marginRight: 15, 
    borderWidth: 1, 
    borderColor: '#ccc' 
  },
  Rating: {
    color: '#666', 
    marginTop: 5,
    gap: 5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    flexWrap: 'wrap',
  },
  resultName: { 
    fontWeight: 'bold', 
    fontSize: 16 
  },
  fullName: { 
    color: '#666' 
  },
  resultDetails: { 
    color: '#666', 
    marginTop: 5 
  },
  modalHeader: { 
    flexDirection: 'row', 
    justifyContent: 'center', 
    alignItems: 'flex-end', 
    paddingVertical: 10, 
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderColor: '#ddd' 
  },
  modalTitle: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    alignContent: 'center'
  },
  modalContent: {
    flex: 1, 
    padding: 10,
    position: 'relative' 
  },
  label: { 
    fontWeight: 'bold', 
    marginTop: 10 
  },
  input: { 
    padding: 10,
    marginTop: 10, 
    backgroundColor: '#fff',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
  },
  menuMedia: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 10,
    marginTop: 10,
  },
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
    gap: 10,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    backgroundColor: '#e5f4f1',
  },
  actionText: {
    marginLeft: 5,
    fontSize: 14,
    fontWeight: 'bold',
  },
  dropdown: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
  },
  dropdownContainer: {
    marginTop: 10,
  },
  applyButton: {
    marginTop: 20,
    paddingVertical: 15,
    paddingHorizontal: 30,
    backgroundColor: '#007bff',
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  navbar: { 
    height: 60, 
    borderTopWidth: 1, 
    borderTopColor: '#ccc', 
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 5
  },
});