import { useRouter } from 'expo-router';
import { StyleSheet, TouchableOpacity } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function DetailsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const tintColor = Colors[colorScheme].tint;

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>
        Details Screen
      </ThemedText>
      
      <ThemedText style={styles.description}>
        This is the details screen in the stack navigator.
      </ThemedText>
      
      <TouchableOpacity 
        style={[styles.button, { backgroundColor: tintColor }]}
        activeOpacity={0.8}
        onPress={() => router.back()}
      >
        <ThemedText style={styles.buttonText}>Go Back</ThemedText>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.button, { backgroundColor: tintColor }]}
        activeOpacity={0.8}
        onPress={() => router.push('/(stack)')}
      >
        <ThemedText style={styles.buttonText}>Go to Home</ThemedText>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.button, { backgroundColor: '#666' }]}
        activeOpacity={0.8}
        onPress={() => router.push('/(tabs)')}
      >
        <ThemedText style={styles.buttonText}>Go to Tabs</ThemedText>
      </TouchableOpacity>
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
