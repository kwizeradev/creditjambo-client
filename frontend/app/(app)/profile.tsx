import React, { useCallback } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert, Switch } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { SPACING, FONT_SIZE, FONT_WEIGHT } from '@/lib/constants';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/lib/hooks/useTheme';
import Card from '@/components/Card';
import GradientBackground from '@/components/GradientBackground';

export default function ProfileScreen(): React.ReactElement {
  const { theme, themeMode, setThemePreference } = useTheme();
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

  const handleMenuPress = useCallback((item: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert('Coming Soon', `${item} feature will be available soon!`);
  }, []);

  const handleThemeToggle = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newMode = themeMode === 'light' ? 'dark' : 'light';
    await setThemePreference(newMode);
  }, [themeMode, setThemePreference]);


  const menuItems = [
    { icon: 'wallet-outline', title: 'Account Balance', subtitle: 'View balance details', action: 'balance' },
    { icon: 'receipt-outline', title: 'Transaction History', subtitle: 'View all transactions', action: 'transactions' },
    { icon: 'notifications-outline', title: 'Notifications', subtitle: 'Manage preferences', action: 'notifications' },
    { icon: 'shield-checkmark-outline', title: 'Security', subtitle: 'Password & device management', action: 'security' },
    { icon: 'help-circle-outline', title: 'Help & Support', subtitle: 'Get assistance', action: 'support' },
  ];


  return (
    <GradientBackground style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.header, { color: theme.colors.text }]}>Profile</Text>

          <Card style={styles.userCard} variant="elevated">
            <View style={styles.avatarContainer}>
              <LinearGradient
                colors={[theme.colors.primary, theme.colors.primaryDark]}
                style={styles.avatar}
              >
                <Text style={styles.avatarText}>
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </Text>
              </LinearGradient>
            </View>
            <Text style={[styles.userName, { color: theme.colors.text }]}>{user?.name || 'User'}</Text>
            <Text style={[styles.userEmail, { color: theme.colors.textSecondary }]}>{user?.email}</Text>
            <View style={[styles.badge, { backgroundColor: `${theme.colors.success}15` }]}>
              <Ionicons name="shield-checkmark" size={14} color={theme.colors.success} />
              <Text style={[styles.badgeText, { color: theme.colors.success }]}>Verified Account</Text>
            </View>
          </Card>

          <Card style={styles.menuCard} padding="small">
            <View>
              <View style={styles.menuItem}>
                <View style={[styles.menuIconContainer, { backgroundColor: `${theme.colors.primary}12` }]}>
                  <Ionicons name={themeMode === 'dark' ? 'moon' : 'sunny'} size={22} color={theme.colors.primary} />
                </View>
                <View style={styles.menuContent}>
                  <Text style={[styles.menuTitle, { color: theme.colors.text }]}>Dark Mode</Text>
                  <Text style={[styles.menuSubtitle, { color: theme.colors.textSecondary }]}>
                    {themeMode === 'dark' ? 'Enabled' : 'Disabled'}
                  </Text>
                </View>
                <Switch
                  value={themeMode === 'dark'}
                  onValueChange={handleThemeToggle}
                  trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                  thumbColor="#ffffff"
                />
              </View>
              <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
            </View>
            {menuItems.map((item, index) => (
              <View key={item.title}>
                <TouchableOpacity 
                  style={styles.menuItem} 
                  activeOpacity={0.7}
                  onPress={() => handleMenuPress(item.title)}
                >
                  <View style={[styles.menuIconContainer, { backgroundColor: `${theme.colors.primary}12` }]}>
                    <Ionicons name={item.icon as any} size={22} color={theme.colors.primary} />
                  </View>
                  <View style={styles.menuContent}>
                    <Text style={[styles.menuTitle, { color: theme.colors.text }]}>{item.title}</Text>
                    <Text style={[styles.menuSubtitle, { color: theme.colors.textSecondary }]}>{item.subtitle}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
                </TouchableOpacity>
                {index < menuItems.length - 1 && <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />}
              </View>
            ))}
          </Card>

          <TouchableOpacity 
            style={[styles.logoutButton, { backgroundColor: `${theme.colors.error}12` }]} 
            onPress={handleLogout} 
            activeOpacity={0.8}
          >
            <Ionicons name="log-out-outline" size={20} color={theme.colors.error} />
            <Text style={[styles.logoutText, { color: theme.colors.error }]}>Sign Out</Text>
          </TouchableOpacity>

          <Text style={[styles.version, { color: theme.colors.textSecondary }]}>Version 1.0.0</Text>
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
    marginBottom: SPACING.xxl,
    letterSpacing: -0.5,
  },
  userCard: {
    alignItems: 'center',
    paddingVertical: 32,
    marginBottom: 20,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '600',
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
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 13,
  },
  divider: {
    height: 1,
    marginLeft: 72,
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
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 15,
    marginBottom: 12,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    marginBottom: 20,
    gap: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
  },
  version: {
    fontSize: 13,
    textAlign: 'center',
  },
});
