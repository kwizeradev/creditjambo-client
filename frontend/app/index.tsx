import { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { getAccessToken } from '../services/storage.service';
import { showDepositNotification } from '../services/notifications.service';
import { COLORS } from '../constants/configs';

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = await getAccessToken();
      
      // Wait a bit for better UX
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      if (token) {
        router.replace('/(app)');
      } else {
        router.replace('/auth/sign-in');
      }
    } catch (error) {
      console.error('Error checking auth:', error);
      router.replace('/auth/sign-in');
    }
  };

  const testNotification = async () => {
    await showDepositNotification('500', '1500');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Credit Jambo</Text>
      <Text style={styles.subtitle}>Savings Management</Text>
      <ActivityIndicator size="large" color="#ffffff" style={styles.loader} />
      
      {/* Test button - remove later */}
      <TouchableOpacity 
        style={styles.testButton} 
        onPress={testNotification}
      >
        <Text style={styles.testButtonText}>Test Notification</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#ffffff',
    opacity: 0.9,
  },
  loader: {
    marginTop: 32,
  },
  testButton: {
    position: 'absolute',
    bottom: 50,
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  testButtonText: {
    color: COLORS.primary,
    fontWeight: '600',
  },
});