import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Image,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { StorageKeys } from '@/constants/StorageKeys';
import { initDatabase, hasMenuData, saveMenuItems, getMenuItems } from '@/utils/database';

/**
 * Home screen component displaying the Little Lemon menu
 * @param {Object} props - Component props
 * @param {Object} props.navigation - React Navigation navigation object
 */
export default function Home({ navigation }) {
  const colorScheme = useColorScheme() ?? 'light';
  const tintColor = Colors[colorScheme].tint;

  // State for user data and menu items
  const [userData, setUserData] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [filteredMenuItems, setFilteredMenuItems] = useState([]);
  const [activeCategory, setActiveCategory] = useState('All');

  // Categories for filtering
  const categories = ['All', 'Starters', 'Mains', 'Desserts', 'Drinks'];

  // Load user data from storage
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const userDataString = await AsyncStorage.getItem(StorageKeys.USER_DATA);
        if (userDataString) {
          setUserData(JSON.parse(userDataString));
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    };

    loadUserData();
  }, []);

  // Initialize database and load menu data
  useEffect(() => {
    const initializeAndLoadData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        try {
          // Initialize the database
          console.log('Initializing database...');
          await initDatabase();
          console.log('Database initialized successfully');

          // Check if we already have menu data
          const hasData = await hasMenuData();
          console.log('Has existing menu data:', hasData);

          if (hasData) {
            // Load data from SQLite
            console.log('Loading menu data from SQLite');
            const items = await getMenuItems();
            console.log(`Loaded ${items.length} items from SQLite`);
            setMenuItems(items);
            setFilteredMenuItems(items);
          } else {
            // Fetch data from API
            console.log('Fetching menu data from API');
            await fetchMenuDataFromAPI();
          }
        } catch (dbError) {
          console.error('Database error:', dbError);
          // If there's a database error, fall back to API
          console.log('Falling back to API due to database error');
          await fetchMenuDataFromAPI();
        }
      } catch (error) {
        console.error('Error initializing and loading data:', error);
        setError('Failed to load menu data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    initializeAndLoadData();
  }, []);

  // Fetch menu data from the API
  const fetchMenuDataFromAPI = async () => {
    try {
      // Fetch data from API
      console.log('Making API request...');
      const response = await fetch(
        'https://raw.githubusercontent.com/Meta-Mobile-Developer-PC/Working-With-Data-API/main/capstone.json'
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      console.log('API data received:', data ? 'success' : 'null');

      if (data && data.menu) {
        // Process menu items to add proper image URLs
        const processedMenuItems = data.menu.map((item, index) => ({
          ...item,
          id: index + 1, // Ensure each item has a unique ID
          image: item.image
            ? `https://github.com/Meta-Mobile-Developer-PC/Working-With-Data-API/blob/main/images/${item.image}?raw=true`
            : null
        }));

        console.log(`Processed ${processedMenuItems.length} menu items`);

        // Try to save to SQLite, but don't fail if it doesn't work
        try {
          console.log('Attempting to save to SQLite...');
          await saveMenuItems(processedMenuItems);
          console.log('Successfully saved to SQLite');
        } catch (dbError) {
          console.error('Error saving to SQLite (continuing anyway):', dbError);
          // Continue even if saving to database fails
        }

        // Update state
        setMenuItems(processedMenuItems);
        setFilteredMenuItems(processedMenuItems);
        console.log('Menu items set in state');
      } else {
        throw new Error('Invalid data format');
      }
    } catch (error) {
      console.error('Error fetching menu data from API:', error);
      setError('Failed to load menu data. Please try again.');
      throw error; // Re-throw to be caught by the caller
    }
  };

  // Filter menu items based on search text and category
  useEffect(() => {
    if (menuItems.length === 0) return;

    let filtered = [...menuItems];

    // Filter by search text
    if (searchText) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(searchText.toLowerCase()) ||
        item.description.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    // Filter by category
    if (activeCategory !== 'All') {
      filtered = filtered.filter(item =>
        item.category && item.category.toLowerCase() === activeCategory.toLowerCase()
      );
    }

    setFilteredMenuItems(filtered);
  }, [searchText, activeCategory, menuItems]);

  // Generate initials for avatar placeholder
  const getInitials = useCallback(() => {
    if (!userData) return '';

    const firstInitial = userData.firstName ? userData.firstName.charAt(0).toUpperCase() : '';
    const lastInitial = userData.lastName ? userData.lastName.charAt(0).toUpperCase() : '';
    return `${firstInitial}${lastInitial}`;
  }, [userData]);

  // Navigate to profile screen
  const navigateToProfile = () => {
    navigation.navigate('Profile');
  };

  // Render category item
  const renderCategoryItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.categoryItem,
        activeCategory === item && { backgroundColor: tintColor }
      ]}
      onPress={() => setActiveCategory(item)}
    >
      <ThemedText
        style={[
          styles.categoryText,
          activeCategory === item && styles.activeCategoryText
        ]}
      >
        {item}
      </ThemedText>
    </TouchableOpacity>
  );

  // Render menu item
  const renderMenuItem = ({ item }) => (
    <View style={styles.menuItem}>
      <View style={styles.menuItemContent}>
        <ThemedText type="subtitle" style={styles.menuItemTitle}>{item.name}</ThemedText>
        <ThemedText style={styles.menuItemDescription} numberOfLines={2}>{item.description}</ThemedText>
        <ThemedText style={styles.menuItemPrice}>${parseFloat(item.price).toFixed(2)}</ThemedText>
      </View>
      {item.image && (
        <Image
          source={{ uri: item.image }}
          style={styles.menuItemImage}
          resizeMode="cover"
          defaultSource={require('@/assets/images/react-logo.png')} // Fallback image
        />
      )}
    </View>
  );

  // Retry fetching data
  const retryFetchData = async () => {
    setIsLoading(true);
    try {
      await fetchMenuDataFromAPI();
    } catch (error) {
      console.error('Error retrying fetch:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Image
          source={require('@/assets/images/react-logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <ThemedText type="title" style={styles.logoText}>Little Lemon</ThemedText>

        <TouchableOpacity onPress={navigateToProfile} style={styles.avatarContainer}>
          {userData && userData.profileImage ? (
            <Image source={{ uri: userData.profileImage }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: tintColor }]}>
              <ThemedText style={styles.avatarInitials}>{getInitials()}</ThemedText>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Hero Section */}
      <View style={styles.heroSection}>
        <View style={styles.heroContent}>
          <ThemedText type="title" style={styles.heroTitle}>Little Lemon</ThemedText>
          <ThemedText style={styles.heroSubtitle}>Chicago</ThemedText>
          <ThemedText style={styles.heroDescription}>
            We are a family owned Mediterranean restaurant, focused on traditional recipes served with a modern twist.
          </ThemedText>
        </View>
        <Image
          source={require('@/assets/images/react-logo.png')}
          style={styles.heroImage}
          resizeMode="cover"
        />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search menu items..."
          value={searchText}
          onChangeText={setSearchText}
          clearButtonMode="while-editing"
        />
      </View>

      {/* Categories */}
      <View style={styles.categoriesContainer}>
        <ThemedText type="subtitle" style={styles.categoriesTitle}>ORDER FOR DELIVERY</ThemedText>
        <FlatList
          horizontal
          data={categories}
          renderItem={renderCategoryItem}
          keyExtractor={(item) => item}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesList}
        />
      </View>

      {/* Content */}
      <View style={styles.content}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={tintColor} />
            <ThemedText style={styles.loadingText}>Loading menu...</ThemedText>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <ThemedText style={styles.errorText}>{error}</ThemedText>
            <TouchableOpacity
              style={[styles.retryButton, { backgroundColor: tintColor }]}
              onPress={retryFetchData}
            >
              <ThemedText style={styles.retryButtonText}>Retry</ThemedText>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={filteredMenuItems}
            renderItem={renderMenuItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.menuList}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <ThemedText style={styles.emptyText}>No menu items available</ThemedText>
            }
          />
        )}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  logo: {
    width: 40,
    height: 40,
  },
  logoText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 20,
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },

  // Hero Section
  heroSection: {
    flexDirection: 'row',
    backgroundColor: '#495E57',
    padding: 16,
    alignItems: 'center',
  },
  heroContent: {
    flex: 1,
    marginRight: 16,
  },
  heroTitle: {
    fontSize: 28,
    color: '#F4CE14',
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 20,
    color: 'white',
    marginBottom: 8,
  },
  heroDescription: {
    fontSize: 14,
    color: 'white',
    opacity: 0.8,
  },
  heroImage: {
    width: 100,
    height: 100,
    borderRadius: 12,
  },

  // Search Bar
  searchContainer: {
    padding: 16,
    paddingBottom: 8,
  },
  searchInput: {
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
  },

  // Categories
  categoriesContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  categoriesTitle: {
    fontSize: 18,
    marginBottom: 12,
    fontWeight: 'bold',
  },
  categoriesList: {
    paddingBottom: 8,
  },
  categoryItem: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    borderRadius: 16,
    backgroundColor: '#EDEFEE',
  },
  categoryText: {
    fontSize: 16,
  },
  activeCategoryText: {
    color: 'white',
    fontWeight: 'bold',
  },

  // Content
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    textAlign: 'center',
    marginBottom: 20,
    fontSize: 16,
    color: '#FF3B30',
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  menuList: {
    paddingVertical: 8,
  },
  menuItem: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#EDEFEE',
  },
  menuItemContent: {
    flex: 1,
    marginRight: 16,
  },
  menuItemTitle: {
    fontSize: 18,
    marginBottom: 8,
    fontWeight: 'bold',
  },
  menuItemDescription: {
    fontSize: 14,
    marginBottom: 8,
    opacity: 0.8,
    lineHeight: 20,
  },
  menuItemPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#495E57',
  },
  menuItemImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
    opacity: 0.6,
  },
});
