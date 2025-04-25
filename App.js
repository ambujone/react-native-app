import React, { useState, useEffect, useCallback, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Alert, TouchableOpacity } from 'react-native';

// Import themed components
import { ThemedText } from './components/ThemedText';
import { ThemedView } from './components/ThemedView';

// Import screens
import OnboardingScreen from './screens/Onboarding';
import ProfileScreen from './screens/Profile';
import HomeScreen from './screens/Home';
import SplashScreen from './screens/SplashScreen';

// Import constants
import { StorageKeys } from './constants/StorageKeys';

// Create a stack navigator
const Stack = createNativeStackNavigator();

export default function App() {
  // App state with more detailed properties
  const [state, setState] = useState({
    isLoading: true,
    isOnboardingCompleted: false,
    error: null,
    userData: null,
  });

  // Create a ref to store the checkOnboardingStatus function
  const checkOnboardingStatusRef = useRef(null);

  // Check if onboarding is completed when the app starts
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      try {
        // Get the onboarding status from AsyncStorage
        const value = await AsyncStorage.getItem(StorageKeys.ONBOARDING_COMPLETE);

        // Try to get user data if available
        let userData = null;
        try {
          const userDataString = await AsyncStorage.getItem(StorageKeys.USER_DATA);
          if (userDataString) {
            userData = JSON.parse(userDataString);
          }
        } catch (userDataError) {
          console.warn('Error reading user data:', userDataError);
        }

        // Update the state based on the stored value
        setState({
          isLoading: false,
          isOnboardingCompleted: value === 'true',
          error: null,
          userData,
        });
      } catch (error) {
        console.error('Error reading onboarding status:', error);
        setState({
          isLoading: false,
          isOnboardingCompleted: false,
          error: 'Failed to load app data. Please try again.',
          userData: null,
        });
      }
    };

    // Store the function in the ref for later use
    checkOnboardingStatusRef.current = checkOnboardingStatus;

    // Call the function to check onboarding status
    checkOnboardingStatus();
  }, []);

  // Handle onboarding completion with user data
  const handleOnboardingComplete = useCallback(async (userData) => {
    try {
      // Save the onboarding status to AsyncStorage
      await AsyncStorage.setItem(StorageKeys.ONBOARDING_COMPLETE, 'true');

      // Save user data if provided
      if (userData) {
        await AsyncStorage.setItem(StorageKeys.USER_DATA, JSON.stringify(userData));
      }

      // Update the state to reflect that onboarding is completed
      setState(prevState => ({
        ...prevState,
        isOnboardingCompleted: true,
        userData,
      }));
    } catch (error) {
      console.error('Error saving onboarding status:', error);
      Alert.alert(
        'Error',
        'Failed to save your information. Please try again.',
        [{ text: 'OK' }]
      );
    }
  }, []);

  // Show splash screen while loading
  if (state.isLoading) {
    return (
      <SafeAreaProvider>
        <StatusBar style="auto" />
        <SplashScreen />
      </SafeAreaProvider>
    );
  }

  // Show error screen if there was an error loading data
  if (state.error) {
    return (
      <SafeAreaProvider>
        <StatusBar style="auto" />
        <ThemedView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <ThemedText type="title" style={{ marginBottom: 20 }}>Error</ThemedText>
          <ThemedText style={{ textAlign: 'center', marginBottom: 30 }}>{state.error}</ThemedText>
          <TouchableOpacity
            style={{
              backgroundColor: '#FF8C00',
              padding: 15,
              borderRadius: 10,
              width: '100%',
              alignItems: 'center',
            }}
            onPress={() => {
              setState(prevState => ({ ...prevState, isLoading: true, error: null }));
              setTimeout(() => {
                // Retry loading after a short delay
                if (checkOnboardingStatusRef.current) {
                  checkOnboardingStatusRef.current();
                }
              }, 1000);
            }}
          >
            <ThemedText style={{ color: 'white', fontWeight: 'bold' }}>Retry</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="auto" />
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            animation: 'slide_from_right',
            contentStyle: { backgroundColor: 'transparent' },
          }}
        >
          {state.isOnboardingCompleted ? (
            // User has completed onboarding, show the Home and Profile screens
            <>
              <Stack.Screen
                name="Home"
                component={HomeScreen}
                initialParams={{ userData: state.userData }}
              />
              <Stack.Screen
                name="Profile"
                component={ProfileScreen}
                initialParams={{ userData: state.userData }}
              />
            </>
          ) : (
            // User has not completed onboarding, show the Onboarding screen
            <Stack.Screen name="Onboarding">
              {(props) => (
                <OnboardingScreen
                  {...props}
                  onComplete={handleOnboardingComplete}
                />
              )}
            </Stack.Screen>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
