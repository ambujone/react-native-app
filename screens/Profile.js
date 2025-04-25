import React, { useState, useCallback, useEffect } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  Image,
  ScrollView,
  Switch,
  Platform
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { MaskedTextInput } from 'react-native-mask-text';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { StorageKeys } from '@/constants/StorageKeys';

/**
 * Profile screen component
 * @param {Object} props - Component props
 * @param {Object} props.navigation - React Navigation navigation object
 * @param {Object} props.route - React Navigation route object
 */
export default function Profile({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? 'light';
  const tintColor = Colors[colorScheme].tint;

  // State for loading indicators
  const [isResetting, setIsResetting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Get initial user data from route params
  const initialUserData = route.params?.userData || {};

  // State for form fields
  const [firstName, setFirstName] = useState(initialUserData.firstName || '');
  const [lastName, setLastName] = useState(initialUserData.lastName || '');
  const [email, setEmail] = useState(initialUserData.email || '');
  const [phoneNumber, setPhoneNumber] = useState(initialUserData.phoneNumber || '');
  const [profileImage, setProfileImage] = useState(initialUserData.profileImage || null);

  // State for validation
  const [isFirstNameValid, setIsFirstNameValid] = useState(true);
  const [isLastNameValid, setIsLastNameValid] = useState(true);
  const [isEmailValid, setIsEmailValid] = useState(true);
  const [isPhoneValid, setIsPhoneValid] = useState(true);

  // State for email notification preferences
  const [orderStatuses, setOrderStatuses] = useState(initialUserData.orderStatuses || false);
  const [passwordChanges, setPasswordChanges] = useState(initialUserData.passwordChanges || false);
  const [specialOffers, setSpecialOffers] = useState(initialUserData.specialOffers || false);
  const [newsletter, setNewsletter] = useState(initialUserData.newsletter || false);

  // Load user data from storage on mount
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const userDataString = await AsyncStorage.getItem(StorageKeys.USER_DATA);
        if (userDataString) {
          const userData = JSON.parse(userDataString);
          setFirstName(userData.firstName || '');
          setLastName(userData.lastName || '');
          setEmail(userData.email || '');
          setPhoneNumber(userData.phoneNumber || '');
          setProfileImage(userData.profileImage || null);
          setOrderStatuses(userData.orderStatuses || false);
          setPasswordChanges(userData.passwordChanges || false);
          setSpecialOffers(userData.specialOffers || false);
          setNewsletter(userData.newsletter || false);
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    };

    loadUserData();
  }, []);

  // Validate first name
  useEffect(() => {
    const nameRegex = /^[A-Za-z]+$/;
    setIsFirstNameValid(firstName.trim() === '' || nameRegex.test(firstName));
  }, [firstName]);

  // Validate last name
  useEffect(() => {
    const nameRegex = /^[A-Za-z]*$/;
    setIsLastNameValid(lastName.trim() === '' || nameRegex.test(lastName));
  }, [lastName]);

  // Validate email
  useEffect(() => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    setIsEmailValid(email.trim() === '' || emailRegex.test(email));
  }, [email]);

  // Validate phone number (10 digits for USA)
  useEffect(() => {
    // Check if the phone number has exactly 10 digits (for USA)
    const phoneRegex = /^\(\d{3}\) \d{3}-\d{4}$/;
    setIsPhoneValid(phoneNumber.trim() === '' || phoneRegex.test(phoneNumber));
  }, [phoneNumber]);

  // Check if form is valid
  const isFormValid = isFirstNameValid && isLastNameValid && isEmailValid && isPhoneValid;

  // Function to pick an image from the gallery
  const pickImage = useCallback(async () => {
    try {
      // Request permission to access the media library
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'We need camera roll permissions to change your profile picture.');
        return;
      }

      // Launch the image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        // Format the image data for storage
        const imageUri = result.assets[0].uri;
        const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
        setProfileImage(base64Image);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  }, []);

  // Function to save user data
  const saveChanges = useCallback(async () => {
    if (!isFormValid) {
      Alert.alert('Invalid Input', 'Please correct the errors in the form before saving.');
      return;
    }

    try {
      setIsSaving(true);

      // Create user data object
      const userData = {
        firstName,
        lastName,
        email,
        phoneNumber,
        profileImage,
        orderStatuses,
        passwordChanges,
        specialOffers,
        newsletter,
        updatedAt: new Date().toISOString(),
      };

      // Save user data to AsyncStorage
      await AsyncStorage.setItem(StorageKeys.USER_DATA, JSON.stringify(userData));

      // Show success message
      Alert.alert('Success', 'Your profile has been updated successfully.');
    } catch (error) {
      console.error('Error saving user data:', error);
      Alert.alert('Error', 'Failed to save your profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [
    firstName,
    lastName,
    email,
    phoneNumber,
    profileImage,
    orderStatuses,
    passwordChanges,
    specialOffers,
    newsletter,
    isFormValid
  ]);

  // Function to reset onboarding and go back to onboarding screen (logout)
  const logout = useCallback(async () => {
    // Show confirmation dialog
    Alert.alert(
      'Logout',
      'Are you sure you want to log out? You will need to complete the onboarding process again.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsResetting(true);

              // Remove onboarding status but keep user data
              await AsyncStorage.removeItem(StorageKeys.ONBOARDING_COMPLETE);

              // Force app reload to show onboarding
              if (navigation) {
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'Onboarding' }],
                });
              }
            } catch (error) {
              console.error('Error logging out:', error);
              Alert.alert('Error', 'Failed to log out. Please try again.');
              setIsResetting(false);
            }
          },
        },
      ]
    );
  }, [navigation]);

  // Generate initials for avatar placeholder
  const getInitials = useCallback(() => {
    const firstInitial = firstName ? firstName.charAt(0).toUpperCase() : '';
    const lastInitial = lastName ? lastName.charAt(0).toUpperCase() : '';
    return `${firstInitial}${lastInitial}`;
  }, [firstName, lastName]);
  // Navigate back to Home screen
  const navigateToHome = useCallback(() => {
    navigation.navigate('Home');
  }, [navigation]);

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={navigateToHome} style={styles.backButton}>
          <ThemedText>← Back</ThemedText>
        </TouchableOpacity>
        <ThemedText type="title" style={styles.headerTitle}>Profile</ThemedText>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Profile Image Section */}
        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={pickImage} style={styles.avatarContainer}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: tintColor }]}>
                <ThemedText style={styles.avatarInitials}>{getInitials()}</ThemedText>
              </View>
            )}
            <View style={[styles.editBadge, { backgroundColor: tintColor }]}>
              <ThemedText style={styles.editBadgeText}>Edit</ThemedText>
            </View>
          </TouchableOpacity>
        </View>

        {/* Personal Information Section */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>Personal Information</ThemedText>

          <View style={styles.inputGroup}>
            <ThemedText type="defaultSemiBold" style={styles.inputLabel}>First Name</ThemedText>
            <TextInput
              style={[
                styles.input,
                { borderColor: isFirstNameValid ? tintColor : '#FF0000' },
                { color: Colors[colorScheme].text }
              ]}
              placeholder="Enter your first name"
              placeholderTextColor={Colors[colorScheme].icon}
              value={firstName}
              onChangeText={setFirstName}
              autoCapitalize="words"
            />
            {!isFirstNameValid && (
              <ThemedText style={styles.errorText}>
                First name must contain only letters
              </ThemedText>
            )}
          </View>

          <View style={styles.inputGroup}>
            <ThemedText type="defaultSemiBold" style={styles.inputLabel}>Last Name</ThemedText>
            <TextInput
              style={[
                styles.input,
                { borderColor: isLastNameValid ? tintColor : '#FF0000' },
                { color: Colors[colorScheme].text }
              ]}
              placeholder="Enter your last name"
              placeholderTextColor={Colors[colorScheme].icon}
              value={lastName}
              onChangeText={setLastName}
              autoCapitalize="words"
            />
            {!isLastNameValid && (
              <ThemedText style={styles.errorText}>
                Last name must contain only letters
              </ThemedText>
            )}
          </View>

          <View style={styles.inputGroup}>
            <ThemedText type="defaultSemiBold" style={styles.inputLabel}>Email</ThemedText>
            <TextInput
              style={[
                styles.input,
                { borderColor: isEmailValid ? tintColor : '#FF0000' },
                { color: Colors[colorScheme].text }
              ]}
              placeholder="Enter your email"
              placeholderTextColor={Colors[colorScheme].icon}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {!isEmailValid && email.length > 0 && (
              <ThemedText style={styles.errorText}>
                Please enter a valid email address
              </ThemedText>
            )}
          </View>

          <View style={styles.inputGroup}>
            <ThemedText type="defaultSemiBold" style={styles.inputLabel}>Phone Number</ThemedText>
            <MaskedTextInput
              mask="(999) 999-9999"
              style={[
                styles.input,
                { borderColor: isPhoneValid ? tintColor : '#FF0000' },
                { color: Colors[colorScheme].text }
              ]}
              placeholder="(123) 456-7890"
              placeholderTextColor={Colors[colorScheme].icon}
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
            />
            {!isPhoneValid && phoneNumber.length > 0 && (
              <ThemedText style={styles.errorText}>
                Please enter a valid US phone number
              </ThemedText>
            )}
          </View>
        </View>

        {/* Email Notifications Section */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>Email Notifications</ThemedText>

          <View style={styles.checkboxRow}>
            <ThemedText>Order statuses</ThemedText>
            <Switch
              value={orderStatuses}
              onValueChange={setOrderStatuses}
              trackColor={{ false: '#767577', true: tintColor }}
              thumbColor={Platform.OS === 'android' ? tintColor : '#f4f3f4'}
            />
          </View>

          <View style={styles.checkboxRow}>
            <ThemedText>Password changes</ThemedText>
            <Switch
              value={passwordChanges}
              onValueChange={setPasswordChanges}
              trackColor={{ false: '#767577', true: tintColor }}
              thumbColor={Platform.OS === 'android' ? tintColor : '#f4f3f4'}
            />
          </View>

          <View style={styles.checkboxRow}>
            <ThemedText>Special offers</ThemedText>
            <Switch
              value={specialOffers}
              onValueChange={setSpecialOffers}
              trackColor={{ false: '#767577', true: tintColor }}
              thumbColor={Platform.OS === 'android' ? tintColor : '#f4f3f4'}
            />
          </View>

          <View style={styles.checkboxRow}>
            <ThemedText>Newsletter</ThemedText>
            <Switch
              value={newsletter}
              onValueChange={setNewsletter}
              trackColor={{ false: '#767577', true: tintColor }}
              thumbColor={Platform.OS === 'android' ? tintColor : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: isFormValid ? tintColor : '#CCCCCC' }]}
            onPress={saveChanges}
            disabled={!isFormValid || isSaving}
            activeOpacity={0.8}
          >
            {isSaving ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <ThemedText style={styles.buttonText}>Save Changes</ThemedText>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.logoutButton]}
            onPress={logout}
            disabled={isResetting}
            activeOpacity={0.8}
          >
            {isResetting ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <ThemedText style={styles.buttonText}>Logout</ThemedText>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
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
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 24,
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    width: 50, // Same width as back button for balance
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },

  // Avatar section
  avatarSection: {
    alignItems: 'center',
    marginVertical: 20,
  },
  avatarContainer: {
    position: 'relative',
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'visible',
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    color: 'white',
    fontSize: 40,
    fontWeight: 'bold',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#007AFF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  editBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },

  // Form sections
  section: {
    marginBottom: 24,
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    marginBottom: 16,
    fontSize: 18,
  },

  // Input fields
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    marginBottom: 8,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: 'white',
  },
  errorText: {
    color: '#FF0000',
    fontSize: 14,
    marginTop: 5,
  },

  // Checkbox rows
  checkboxRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },

  // Buttons
  buttonContainer: {
    marginTop: 20,
  },
  button: {
    width: '100%',
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  logoutButton: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
