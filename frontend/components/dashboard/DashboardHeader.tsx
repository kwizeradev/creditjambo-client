import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS, OPACITY } from '@/lib/constants';
import { getGreeting } from '@/lib/utils/date';
import { useTheme } from '@/lib/hooks/useTheme';

interface DashboardHeaderProps {
  userName: string;
  onLogout: () => void;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ userName, onLogout }) => {
  const { theme } = useTheme();
  
  return (
    <View style={styles.container}>
      <View>
        <Text style={[styles.greeting, { color: theme.colors.text }]}>{getGreeting()}</Text>
        <Text style={[styles.userName, { color: theme.colors.text }]}>{userName}</Text>
      </View>
      <TouchableOpacity 
        style={[styles.logoutButton, { backgroundColor: `${theme.colors.error}${OPACITY.medium}` }]} 
        onPress={onLogout} 
        activeOpacity={0.7}
      >
        <Ionicons name="log-out-outline" size={24} color={theme.colors.error} />
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
    marginBottom: 6,
    fontWeight: FONT_WEIGHT.regular,
  },
  userName: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: FONT_WEIGHT.bold,
    letterSpacing: -0.5,
  },
  logoutButton: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.xl + 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
