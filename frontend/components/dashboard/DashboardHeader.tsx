import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS, OPACITY } from '@/lib/constants';
import { getGreeting } from '@/lib/utils/date';

interface DashboardHeaderProps {
  userName: string;
  onLogout: () => void;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ userName, onLogout }) => {
  return (
    <View style={styles.container}>
      <View>
        <Text style={styles.greeting}>{getGreeting()}</Text>
        <Text style={styles.userName}>{userName}</Text>
      </View>
      <TouchableOpacity style={styles.logoutButton} onPress={onLogout} activeOpacity={0.7}>
        <Ionicons name="log-out-outline" size={24} color={COLORS.error} />
      </TouchableOpacity>
    </View>
  );
};

export default DashboardHeader;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.xxxl - 4,
  },
  greeting: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    marginBottom: 6,
    fontWeight: FONT_WEIGHT.regular,
  },
  userName: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  logoutButton: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.xl + 2,
    backgroundColor: `${COLORS.error}${OPACITY.medium}`,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
