import React, { useState, useCallback } from 'react';
import { StyleSheet, View, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
  const [isResetting, setIsResetting] = useState(false);

  // Get user data from route params
  const userData = route.params?.userData || {};
  const { firstName, email } = userData || {};

  // Function to reset onboarding and go back to onboarding screen
  const resetOnboarding = useCallback(async () => {
    // Show confirmation dialog
    Alert.alert(
      'Reset Onboarding',
      'Are you sure you want to reset the onboarding process? This will log you out.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsResetting(true);

              // Remove both onboarding status and user data
              await Promise.all([
                AsyncStorage.removeItem(StorageKeys.ONBOARDING_COMPLETE),
                AsyncStorage.removeItem(StorageKeys.USER_DATA),
              ]);

              // Force app reload to show onboarding
              if (navigation) {
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'Onboarding' }],
                });
              }
            } catch (error) {
              console.error('Error resetting onboarding status:', error);
              Alert.alert('Error', 'Failed to reset onboarding. Please try again.');
              setIsResetting(false);
            }
          },
        },
      ]
    );
  }, [navigation]);
  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.header}>
        <ThemedText type="title" style={styles.headerTitle}>Profile</ThemedText>
      </View>

      <View style={styles.content}>
        <View style={styles.card}>
          <ThemedText type="subtitle" style={styles.cardTitle}>Personal Information</ThemedText>

          <View style={styles.infoRow}>
            <ThemedText type="defaultSemiBold">Name:</ThemedText>
            <ThemedText>{firstName || 'Not provided'}</ThemedText>
          </View>

          <View style={styles.infoRow}>
            <ThemedText type="defaultSemiBold">Email:</ThemedText>
            <ThemedText>{email || 'Not provided'}</ThemedText>
          </View>
        </View>

        <ThemedText style={styles.description}>
          You've successfully completed the onboarding process and are now logged in.
        </ThemedText>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: tintColor }]}
          onPress={resetOnboarding}
          disabled={isResetting}
          activeOpacity={0.8}
        >
          {isResetting ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <ThemedText style={styles.buttonText}>Reset Onboarding</ThemedText>
          )}
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 24,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  card: {
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  description: {
    textAlign: 'center',
    marginBottom: 40,
    fontSize: 16,
    lineHeight: 24,
    opacity: 0.8,
  },
  button: {
    width: '100%',
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 'auto',
    marginBottom: 20,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
