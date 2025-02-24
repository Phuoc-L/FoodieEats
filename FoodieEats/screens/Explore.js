import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, Image, StyleSheet, Modal, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import NavigationBar from './Navigation';
import DropDownPicker from 'react-native-dropdown-picker';

export default function Explore() {
  const [searchMode, setSearchMode] = useState('users'); // 'users' or 'restaurants'
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

  const handleSearch = async () => {
    if (!searchQuery) return;
    try {
      const endpoint = searchMode === 'users' ? '/api/users/search' : '/api/restaurants/search';
      const params = {
        query: searchQuery,
        sortBy: sortField || undefined,
        sortOrder: sortOrder || 'asc',
        ...(searchMode === 'users' ? {
          minFollowers: minFollowers || undefined,
          maxFollowers: maxFollowers || undefined,
          minPosts: minPosts || undefined,
          maxPosts: maxPosts || undefined,
        } : {
          minRating: minRating || undefined,
          maxRating: maxRating || undefined,
        }),
      };

      const response = await axios.get(process.env.EXPO_PUBLIC_API_URL + endpoint, { params });
      setResults(response.data.restaurants || response.data.users);
      Keyboard.dismiss();
    } catch (error) {
      console.error(`Error fetching ${searchMode}:`, error.response?.data || error.message);
    }
  };

  const handleModeToggle = (mode) => {
    setSearchMode(mode);
    setResults([]);
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
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
          </View>
        </View>

        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder={`Search ${searchMode}...`}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <TouchableOpacity onPress={() => { setFiltersVisible(true); Keyboard.dismiss(); }}>
            <Ionicons name="options" size={30} color="black" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleSearch}>
            <Ionicons name="search" size={30} color="black" />
          </TouchableOpacity>
        </View>

        <FlatList data={results} keyExtractor={(item) => item._id} renderItem={({ item, index }) => (
          <TouchableOpacity onPress={() => navigation.navigate(searchMode === 'users' ? 'Profile' : 'Restaurant', { id: item._id })}>
            <View style={styles.resultCard}>
              {searchMode === 'users' && (<Image source={{ uri: item.profile.avatar_url || 'https://via.placeholder.com/50' }} style={styles.avatar} />)}
              <View>
                <View style={styles.restaurantRating}>
                  <Text style={styles.resultName}>{item.name || item.username}</Text>
                  {searchMode === 'restaurants' && (
                    <Text>
                      <Ionicons name="star" size={16} color="gold" /> {item.average_rating?.toFixed(1) || 'N/A'}
                    </Text>
                  )}
                </View>
                <Text style={styles.fullName}>{item.first_name || item.location} {item.last_name}</Text>
                {searchMode === 'users' && (<Text style={styles.resultDetails}> {item.profile.bio} </Text> )}
              </View>
            </View>
          </TouchableOpacity>
        )}/>

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

        <View style={styles.navbar}>
          <NavigationBar />
        </View>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#fff', 
    padding: 10 
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
    width: 110,
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
    marginRight: 10
  },
  resultCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 15, 
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
  avatar: { 
    width: 50, 
    height: 50, 
    borderRadius: 25, 
    marginRight: 15, 
    borderWidth: 1, 
    borderColor: '#ccc' 
  },
  restaurantRating: {
    color: '#666', 
    gap: 5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
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
    padding: 10 
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