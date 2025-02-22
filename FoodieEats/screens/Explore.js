import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, Image, StyleSheet, Modal, Button, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import NavigationBar from './Navigation';
import DropDownPicker from 'react-native-dropdown-picker';

export default function Explore() {
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [minFollowers, setMinFollowers] = useState('');
  const [maxFollowers, setMaxFollowers] = useState('');
  const [minPosts, setMinPosts] = useState('');
  const [maxPosts, setMaxPosts] = useState('');
  const [showPrivate, setShowPrivate] = useState(false);
  const [sortField, setSortField] = useState('');
  const [sortOrder, setSortOrder] = useState('asc');
  const [sortOpen, setSortOpen] = useState(false);
  const [orderOpen, setOrderOpen] = useState(false);
  const navigation = useNavigation();

  const handleSearch = async () => {
    if (!searchQuery) return;
    try {
      const response = await axios.get(process.env.EXPO_PUBLIC_API_URL + '/api/users/search', {
        params: { 
          query: searchQuery,
          minFollowers,
          maxFollowers,
          minPosts,
          maxPosts,
          showPrivate,
          sortBy: sortField,
          sortOrder,
        },
      });
      setUsers(response.data.users);
      setSearchVisible(false);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Explore</Text>
          {searchVisible ? (
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search users..."
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              <TouchableOpacity onPress={handleSearch}>
                <Ionicons name="checkmark" size={24} color="black" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setFiltersVisible(true)}>
                <Ionicons name="options" size={24} color="black" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity onPress={() => setSearchVisible(true)}>
              <Ionicons name="search" size={24} color="black" />
            </TouchableOpacity>
          )}
        </View>

        <FlatList
          data={users}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => navigation.navigate('Profile', { userId: item._id })}>
              <View style={styles.userCard}>
                <Image source={{ uri: item.profile.avatar_url || 'https://via.placeholder.com/50' }} style={styles.avatar} />
                <View>
                  <Text style={styles.username}>{item.username}</Text>
                  <Text style={styles.fullName}>{item.first_name} {item.last_name}</Text>
                  <Text style={styles.bio}>{item.profile.bio}</Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
        />

        <Modal visible={filtersVisible} animationType="slide">
          <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <SafeAreaView style={styles.container}>
              <View style={styles.modalContent}>
                <Text style={styles.label}>Min Followers</Text>
                <TextInput style={styles.input} keyboardType="numeric" value={minFollowers} onChangeText={setMinFollowers} />
                
                <Text style={styles.label}>Max Followers</Text>
                <TextInput style={styles.input} keyboardType="numeric" value={maxFollowers} onChangeText={setMaxFollowers} />
                
                <Text style={styles.label}>Min Posts</Text>
                <TextInput style={styles.input} keyboardType="numeric" value={minPosts} onChangeText={setMinPosts} />
                
                <Text style={styles.label}>Max Posts</Text>
                <TextInput style={styles.input} keyboardType="numeric" value={maxPosts} onChangeText={setMaxPosts} />
                
                <Text style={styles.label}>Sort By</Text>
                <DropDownPicker
                  open={sortOpen}
                  value={sortField}
                  items={[
                    { label: 'Followers', value: 'followers_count' },
                    { label: 'Posts', value: 'posts_count' },
                    { label: 'Username', value: 'username' },
                  ]}
                  setOpen={setSortOpen}
                  setValue={setSortField}
                  style={{ zIndex: 3000 }}
                  containerStyle={{ zIndex: 3000 }}
                />

                <Text style={styles.label}>Sort Order</Text>
                <DropDownPicker
                  open={orderOpen}
                  value={sortOrder}
                  items={[
                    { label: 'Ascending', value: 'asc' },
                    { label: 'Descending', value: 'desc' },
                  ]}
                  setOpen={setOrderOpen}
                  setValue={setSortOrder}
                  style={{ zIndex: 2000 }}
                  containerStyle={{ zIndex: 2000 }}
                />

                <View style={styles.checkboxContainer}>
                  <Text>Show Private Profiles</Text>
                  <Button title={showPrivate ? "Yes" : "No"} onPress={() => setShowPrivate(!showPrivate)} />
                </View>
                
                <Button title="Apply Filters" onPress={() => { setFiltersVisible(false); handleSearch(); }} />
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
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  title: { fontSize: 24, fontWeight: 'bold' },
  searchInput: { flex: 1, marginLeft: 10, padding: 8, borderBottomWidth: 1, borderColor: '#ccc' },
  userCard: { flexDirection: 'row', padding: 15, borderBottomWidth: 1, borderColor: '#eee' },
  avatar: { width: 50, height: 50, borderRadius: 25, marginRight: 15, borderWidth: 1, borderColor: '#ccc' },
  username: { fontWeight: 'bold', fontSize: 16 },
  fullName: { color: '#666' },
  bio: { marginTop: 5, color: '#888' },
  navbar: { height: 60, borderTopWidth: 1, borderTopColor: '#ccc' },
  modalContent: { padding: 20 },
  label: { fontWeight: 'bold', marginTop: 10 },
  input: { borderWidth: 1, padding: 10, marginBottom: 10, borderRadius: 5 },
  checkboxContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 20 },
});
