import { Link } from 'expo-router';
import { StyleSheet, TouchableOpacity } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function HomeScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const tintColor = Colors[colorScheme].tint;

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>
        Welcome to Stack Navigator
      </ThemedText>
      
      <ThemedText style={styles.description}>
        This is an example of a screen in a native stack navigator.
      </ThemedText>
      
      <Link href="/(stack)/profile" asChild>
        <TouchableOpacity 
          style={[styles.button, { backgroundColor: tintColor }]}
          activeOpacity={0.8}
        >
          <ThemedText style={styles.buttonText}>Go to Profile</ThemedText>
        </TouchableOpacity>
      </Link>
      
      <Link href="/(stack)/details" asChild>
        <TouchableOpacity 
          style={[styles.button, { backgroundColor: tintColor }]}
          activeOpacity={0.8}
        >
          <ThemedText style={styles.buttonText}>Go to Details</ThemedText>
        </TouchableOpacity>
      </Link>
      
      <Link href="/(tabs)" asChild>
        <TouchableOpacity 
          style={[styles.button, { backgroundColor: '#666' }]}
          activeOpacity={0.8}
        >
          <ThemedText style={styles.buttonText}>Go to Tabs</ThemedText>
        </TouchableOpacity>
      </Link>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  description: {
    textAlign: 'center',
    marginBottom: 30,
  },
  button: {
    width: '100%',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 15,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
