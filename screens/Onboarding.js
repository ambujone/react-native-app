import React, { useState, useEffect } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, View, Image } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

/**
 * Onboarding screen component
 * @param {Object} props - Component props
 * @param {Function} props.onComplete - Callback function to call when onboarding is complete
 * @param {Object} [props.navigation] - React Navigation navigation object (optional)
 */
export default function Onboarding({ onComplete, navigation = null }) {
  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [isFirstNameValid, setIsFirstNameValid] = useState(false);
  const [isEmailValid, setIsEmailValid] = useState(false);
  const colorScheme = useColorScheme() ?? 'light';
  const tintColor = Colors[colorScheme].tint;

  // Validate first name
  useEffect(() => {
    // First name should not be empty and should contain only letters
    const nameRegex = /^[A-Za-z]+$/;
    setIsFirstNameValid(firstName.trim() !== '' && nameRegex.test(firstName));
  }, [firstName]);

  // Validate email
  useEffect(() => {
    // Email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    setIsEmailValid(emailRegex.test(email));
  }, [email]);

  const handleNext = () => {
    // Create user data object
    const userData = {
      firstName,
      email,
      completedAt: new Date().toISOString(),
    };

    // Log the user information
    console.log('Next button pressed with:', userData);

    // Call the onComplete callback to navigate to the main app
    if (onComplete) {
      onComplete(userData);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <ThemedText type="title" style={styles.logoText}>Little Lemon</ThemedText>
          <Image
            source={require('@/assets/images/react-logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        <ThemedText style={styles.subtitle}>Let's get to know you</ThemedText>
      </View>

      <View style={styles.inputContainer}>
        <ThemedText type="defaultSemiBold">First Name</ThemedText>
        <TextInput
          style={[
            styles.input,
            { borderColor: isFirstNameValid ? tintColor : (firstName.length > 0 ? '#FF0000' : tintColor) },
            { color: Colors[colorScheme].text }
          ]}
          placeholder="Enter your first name"
          placeholderTextColor={Colors[colorScheme].icon}
          value={firstName}
          onChangeText={setFirstName}
          autoCapitalize="words"
          autoComplete="name"
          returnKeyType="next"
          accessibilityLabel="First name input"
          accessibilityHint="Enter your first name using only letters"
        />
        {!isFirstNameValid && firstName.length > 0 && (
          <ThemedText style={styles.errorText}>
            First name must contain only letters
          </ThemedText>
        )}

        <ThemedText type="defaultSemiBold" style={styles.inputLabel}>
          Email
        </ThemedText>
        <TextInput
          style={[
            styles.input,
            { borderColor: isEmailValid ? tintColor : (email.length > 0 ? '#FF0000' : tintColor) },
            { color: Colors[colorScheme].text }
          ]}
          placeholder="Enter your email"
          placeholderTextColor={Colors[colorScheme].icon}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          returnKeyType="done"
          textContentType="emailAddress"
          accessibilityLabel="Email input"
          accessibilityHint="Enter your email address"
          onSubmitEditing={isFirstNameValid && isEmailValid ? handleNext : undefined}
        />
        {!isEmailValid && email.length > 0 && (
          <ThemedText style={styles.errorText}>
            Please enter a valid email address
          </ThemedText>
        )}
      </View>

      <TouchableOpacity
        style={[
          styles.button,
          {
            backgroundColor: isFirstNameValid && isEmailValid ? tintColor : '#CCCCCC',
          }
        ]}
        onPress={handleNext}
        disabled={!isFirstNameValid || !isEmailValid}
        activeOpacity={0.8}
        accessibilityLabel="Next button"
        accessibilityHint="Complete onboarding and proceed to the app"
        accessibilityRole="button"
        accessibilityState={{ disabled: !isFirstNameValid || !isEmailValid }}>
        <ThemedText style={styles.buttonText}>Next</ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 32,
  },
  header: {
    marginTop: 60,
    marginBottom: 40,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  logoText: {
    fontSize: 28,
  },
  logo: {
    width: 50,
    height: 50,
  },
  subtitle: {
    marginTop: 8,
    fontSize: 18,
  },
  inputContainer: {
    marginBottom: 40,
  },
  inputLabel: {
    marginTop: 24,
    marginBottom: 8,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    marginTop: 8,
  },
  errorText: {
    color: '#FF0000',
    fontSize: 14,
    marginTop: 5,
  },
  button: {
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 'auto',
    marginBottom: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
