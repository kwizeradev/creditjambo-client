import { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getAccessToken } from '@/services/storage.service';
import { COLORS } from '@/constants/configs';
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync();

export default function Index() {
  const router = useRouter();
  const [status, setStatus] = useState('Initializing...');
  const [isReady, setIsReady] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    startLoadingSequence();
  }, []);

  const startLoadingSequence = async () => {
    try {
      await SplashScreen.hideAsync();

      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start();

      setStatus('Initializing...');
      await new Promise(resolve => setTimeout(resolve, 1200));

      setStatus('Checking authentication...');
      await new Promise(resolve => setTimeout(resolve, 800));

      const token = await getAccessToken();

      setStatus('Loading user data...');
      await new Promise(resolve => setTimeout(resolve, 700));

      if (token) {
        setStatus('Welcome back!');
        await new Promise(resolve => setTimeout(resolve, 800));
        setIsReady(true);
        router.replace('/(app)');
      } else {
        setStatus('Getting started...');
        await new Promise(resolve => setTimeout(resolve, 800));
        setIsReady(true);
        router.replace('/auth/sign-in');
      }
    } catch (error) {
      console.error('Error during initialization:', error);
      setStatus('Redirecting...');
      await new Promise(resolve => setTimeout(resolve, 500));
      setIsReady(true);
      router.replace('/auth/sign-in');
    }
  };

  if (isReady) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <View style={styles.logoContainer}>
          <Ionicons name="wallet" size={64} color="#ffffff" />
        </View>

        <Text style={styles.title}>Credit Jambo</Text>
        <Text style={styles.subtitle}>Savings Management</Text>

        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#ffffff" />
          <Text style={styles.statusText}>{status}</Text>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    marginBottom: 32,
    padding: 20,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#ffffff',
    opacity: 0.9,
    textAlign: 'center',
    marginBottom: 48,
  },
  loadingContainer: {
    alignItems: 'center',
    gap: 12,
  },
  statusText: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.8,
    textAlign: 'center',
  },
});
