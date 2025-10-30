import React, { useCallback } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { COLORS, SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS, OPACITY } from '@/lib/constants';
import { useAuth } from '@/contexts/AuthContext';
import Card from '@/components/Card';
import GradientBackground from '@/components/GradientBackground';

export default function ProfileScreen(): React.ReactElement {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = useCallback(() => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
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
    ]);
  }, [logout, router]);

  const menuItems = [
    { icon: 'person-outline', title: 'Personal Information', subtitle: 'Update your details' },
    { icon: 'shield-checkmark-outline', title: 'Security', subtitle: 'Password & 2FA' },
    { icon: 'notifications-outline', title: 'Notifications', subtitle: 'Manage preferences' },
    { icon: 'help-circle-outline', title: 'Help & Support', subtitle: 'Get assistance' },
    { icon: 'document-text-outline', title: 'Terms & Privacy', subtitle: 'Legal information' },
  ];

  return (
    <GradientBackground style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.header}>Profile</Text>

          {/* User Info Card */}
          <Card style={styles.userCard} variant="elevated">
            <View style={styles.avatarContainer}>
              <LinearGradient
                colors={[COLORS.primary, COLORS.primaryDark]}
                style={styles.avatar}
              >
                <Text style={styles.avatarText}>
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </Text>
              </LinearGradient>
            </View>
            <Text style={styles.userName}>{user?.name || 'User'}</Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
            <View style={styles.badge}>
              <Ionicons name="shield-checkmark" size={14} color={COLORS.success} />
              <Text style={styles.badgeText}>Verified Account</Text>
            </View>
          </Card>

          {/* Menu Items */}
          <Card style={styles.menuCard} padding="small">
            {menuItems.map((item, index) => (
              <View key={item.title}>
                <TouchableOpacity style={styles.menuItem} activeOpacity={0.7}>
                  <View style={styles.menuIconContainer}>
                    <Ionicons name={item.icon as any} size={22} color={COLORS.primary} />
                  </View>
                  <View style={styles.menuContent}>
                    <Text style={styles.menuTitle}>{item.title}</Text>
                    <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
                </TouchableOpacity>
                {index < menuItems.length - 1 && <View style={styles.divider} />}
              </View>
            ))}
          </Card>

          {/* Logout Button */}
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.8}>
            <Ionicons name="log-out-outline" size={20} color={COLORS.error} />
            <Text style={styles.logoutText}>Sign Out</Text>
          </TouchableOpacity>

          <Text style={styles.version}>Version 1.0.0</Text>
        </ScrollView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.xxl,
    paddingTop: 60,
    paddingBottom: 100,
  },
  header: {
    fontSize: FONT_SIZE.xxxl,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.text,
    marginBottom: SPACING.xxl,
    letterSpacing: -0.5,
  },
  userCard: {
    alignItems: 'center',
    paddingVertical: 32,
    marginBottom: 20,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#ffffff',
  },
  userName: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 15,
    color: COLORS.textSecondary,
    marginBottom: 12,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${COLORS.success}15`,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.success,
  },
  menuCard: {
    padding: 0,
    marginBottom: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${COLORS.primary}12`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginLeft: 72,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${COLORS.error}12`,
    paddingVertical: 16,
    borderRadius: 16,
    marginBottom: 20,
    gap: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.error,
  },
  version: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});
