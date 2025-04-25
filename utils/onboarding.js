import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_COMPLETE_KEY = 'onboarding_complete';

export const setOnboardingComplete = async () => {
  try {
    await AsyncStorage.setItem(ONBOARDING_COMPLETE_KEY, 'true');
    return true;
  } catch (error) {
    console.error('Error saving onboarding status:', error);
    return false;
  }
};

export const isOnboardingComplete = async () => {
  try {
    const value = await AsyncStorage.getItem(ONBOARDING_COMPLETE_KEY);
    return value === 'true';
  } catch (error) {
    console.error('Error retrieving onboarding status:', error);
    return false;
  }
};

export const resetOnboarding = async () => {
  try {
    await AsyncStorage.removeItem(ONBOARDING_COMPLETE_KEY);
    return true;
  } catch (error) {
    console.error('Error resetting onboarding status:', error);
    return false;
  }
};
