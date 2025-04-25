import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator } from 'react-native';

import { ThemedView } from '@/components/ThemedView';
import Onboarding from '@/screens/Onboarding';
import { isOnboardingComplete as checkOnboardingStatus, setOnboardingComplete as markOnboardingComplete } from '@/utils/onboarding';

export default function App() {
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if the user has completed onboarding
    const checkStatus = async () => {
      try {
        const completed = await checkOnboardingStatus();
        setOnboardingComplete(completed);
      } catch (error) {
        console.error('Error checking onboarding status:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkStatus();
  }, []);

  // Show a loading screen while checking onboarding status
  if (isLoading) {
    return (
      <ThemedView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </ThemedView>
    );
  }

  // If onboarding is complete, redirect to the tabs
  if (onboardingComplete) {
    return <Redirect href="/(tabs)" />;
  }

  // Otherwise, show the onboarding screen
  return (
    <Onboarding
      onComplete={async () => {
        await markOnboardingComplete();
        setOnboardingComplete(true);
      }}
    />
  );
}
