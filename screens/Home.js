import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import { debounce } from '@/utils/debounce';

/**
 * Home screen component displaying the Little Lemon menu
 * @param {Object} props - Component props
 * @param {Object} props.navigation - React Navigation navigation object
 */
export default function Home({ navigation }) {
  const colorScheme = useColorScheme() ?? 'light';
  const tintColor = Colors[colorScheme].tint;

  // Initialize selected categories with "All"
  useEffect(() => {
    setSelectedCategories(['All']);
  }, []);

  // State for user data and menu items
  const [userData, setUserData] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [filteredMenuItems, setFilteredMenuItems] = useState([]);
  const [availableCategories, setAvailableCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);

  // Create a debounced search function
  const debouncedSearch = useRef(
    debounce((text) => {
      setSearchText(text);
    }, 500)
  ).current;

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

  // Initialize and load menu data
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Skip SQLite operations entirely and fetch from API directly
        console.log('Fetching menu data from API directly');
        await fetchMenuDataFromAPI();
      } catch (error) {
        console.error('Error loading data:', error);
        setError('Failed to load menu data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
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
            : null,
          // Ensure category is set
          category: item.category || 'Other'
        }));

        console.log(`Processed ${processedMenuItems.length} menu items`);

        // Extract unique categories
        const uniqueCategories = [...new Set(processedMenuItems.map(item => item.category))];
        console.log('Extracted categories:', uniqueCategories);

        // Skip SQLite operations entirely - they're causing issues
        // Just update the state directly
        setMenuItems(processedMenuItems);
        setFilteredMenuItems(processedMenuItems);
        setAvailableCategories(['All', ...uniqueCategories]);
        console.log('Menu items and categories set in state');
      } else {
        throw new Error('Invalid data format');
      }
    } catch (error) {
      console.error('Error fetching menu data from API:', error);
      setError('Failed to load menu data. Please try again.');
      throw error; // Re-throw to be caught by the caller
    }
  };



  // Filter menu items based on search text and selected categories
  useEffect(() => {
    if (menuItems.length === 0) return;

    const filterItems = () => {
      try {
        console.log('Filtering with:', {
          searchText,
          selectedCategories: selectedCategories.includes('All') ? [] : selectedCategories
        });

        // Use in-memory filtering for reliability
        console.log('Using in-memory filtering');
        let filtered = [...menuItems];

        // Filter by search text
        if (searchText) {
          filtered = filtered.filter(item =>
            (item.name && item.name.toLowerCase().includes(searchText.toLowerCase())) ||
            (item.description && item.description.toLowerCase().includes(searchText.toLowerCase()))
          );
        }

        // Filter by categories
        if (selectedCategories.length > 0 && !selectedCategories.includes('All')) {
          filtered = filtered.filter(item =>
            item.category && selectedCategories.includes(item.category)
          );
        }

        setFilteredMenuItems(filtered);
        console.log(`Filtered to ${filtered.length} items in memory`);
      } catch (error) {
        console.error('Error during filtering:', error);
        // If filtering fails, just show all items
        setFilteredMenuItems(menuItems);
      }
    };

    filterItems();
  }, [searchText, selectedCategories, menuItems]);

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

  // Handle category selection
  const handleCategoryPress = useCallback((category) => {
    setSelectedCategories(prev => {
      // If "All" is selected, clear other selections
      if (category === 'All') {
        return ['All'];
      }

      // If another category is selected while "All" is active, remove "All"
      let newSelection = prev.includes('All') && category !== 'All'
        ? prev.filter(cat => cat !== 'All')
        : [...prev];

      // Toggle the selected category
      if (newSelection.includes(category)) {
        // If this is the last category, select "All" instead
        if (newSelection.length === 1) {
          return ['All'];
        }
        // Otherwise, just remove this category
        return newSelection.filter(cat => cat !== category);
      } else {
        // Add the category
        return [...newSelection, category];
      }
    });
  }, []);

  // Render category item
  const renderCategoryItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.categoryItem,
        selectedCategories.includes(item) && { backgroundColor: tintColor }
      ]}
      onPress={() => handleCategoryPress(item)}
    >
      <ThemedText
        style={[
          styles.categoryText,
          selectedCategories.includes(item) && styles.activeCategoryText
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

          {/* Search Bar in Hero Section */}
          <View style={styles.heroSearchContainer}>
            <TextInput
              style={styles.heroSearchInput}
              placeholder="Search menu items..."
              onChangeText={debouncedSearch}
              placeholderTextColor="#EDEFEE"
              clearButtonMode="while-editing"
            />
          </View>
        </View>
        <Image
          source={require('@/assets/images/react-logo.png')}
          style={styles.heroImage}
          resizeMode="cover"
        />
      </View>

      {/* Categories */}
      <View style={styles.categoriesContainer}>
        <ThemedText type="subtitle" style={styles.categoriesTitle}>ORDER FOR DELIVERY</ThemedText>
        <FlatList
          horizontal
          data={availableCategories}
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
    paddingVertical: 24,
    alignItems: 'center',
  },
  heroContent: {
    flex: 1,
    marginRight: 16,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#F4CE14',
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 22,
    color: 'white',
    marginBottom: 12,
  },
  heroDescription: {
    fontSize: 16,
    color: 'white',
    opacity: 0.8,
    marginBottom: 16,
    lineHeight: 22,
  },
  heroImage: {
    width: 120,
    height: 120,
    borderRadius: 12,
  },
  heroSearchContainer: {
    marginTop: 8,
    width: '100%',
  },
  heroSearchInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: 'white',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
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
