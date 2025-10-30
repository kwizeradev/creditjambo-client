import React, { useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { COLORS } from '@/lib/constants';
import { useAuth } from '@/contexts/AuthContext';
import Card from '@/components/Card';

export default function Dashboard(): React.ReactElement {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = useCallback(() => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            logout();
            router.replace('/auth/sign-in');
          },
        },
      ]
    );
  }, [logout, router]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[COLORS.background, COLORS.surface]}
        style={styles.gradient}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.greeting}>{getGreeting()}</Text>
              <Text style={styles.userName}>{user?.name || 'User'}</Text>
            </View>
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogout}
              activeOpacity={0.7}
            >
              <Ionicons
                name="log-out-outline"
                size={24}
                color={COLORS.error}
              />
            </TouchableOpacity>
          </View>

          {/* Account Card */}
          <Card style={styles.accountCard} variant="elevated">
            <View style={styles.cardHeader}>
              <View style={styles.iconContainer}>
                <LinearGradient
                  colors={[`${COLORS.primary}20`, `${COLORS.primary}10`]}
                  style={styles.iconGradient}
                >
                  <Ionicons
                    name="person-circle"
                    size={32}
                    color={COLORS.primary}
                  />
                </LinearGradient>
              </View>
              <View style={styles.accountInfo}>
                <Text style={styles.accountLabel}>Account</Text>
                <Text style={styles.accountEmail}>{user?.email}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.statusRow}>
              <View style={styles.statusItem}>
                <Ionicons
                  name="shield-checkmark"
                  size={20}
                  color={COLORS.success}
                />
                <Text style={styles.statusText}>Verified</Text>
              </View>
              <View style={styles.statusItem}>
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color={COLORS.success}
                />
                <Text style={styles.statusText}>Active</Text>
              </View>
            </View>
          </Card>

          {/* Welcome Message */}
          <Card style={styles.welcomeCard}>
            <View style={styles.welcomeContent}>
              <Ionicons
                name="information-circle"
                size={24}
                color={COLORS.primary}
              />
              <Text style={styles.welcomeText}>
                Welcome to Credit Jambo! Your dashboard features are coming soon.
              </Text>
            </View>
          </Card>
        </ScrollView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 32,
  },
  greeting: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  userName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  logoutButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${COLORS.error}10`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountCard: {
    marginBottom: 20,
    padding: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    marginRight: 16,
  },
  iconGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountInfo: {
    flex: 1,
  },
  accountLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  accountEmail: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  divider: {
    height: 1,
    backgroundColor: `${COLORS.text}10`,
    marginBottom: 16,
  },
  statusRow: {
    flexDirection: 'row',
    gap: 24,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
  },
  welcomeCard: {
    padding: 16,
    backgroundColor: `${COLORS.primary}08`,
    borderWidth: 1,
    borderColor: `${COLORS.primary}20`,
  },
  welcomeContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  welcomeText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
});
