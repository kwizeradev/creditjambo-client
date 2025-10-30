import React from 'react';
import { StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS, ICON_SIZE } from '@/lib/constants';
import { formatCurrency } from '@/lib/utils/date';

interface BalanceCardProps {
  balance: string | number;
  isLoading?: boolean;
  lastUpdated?: string;
}

const BalanceCard: React.FC<BalanceCardProps> = ({ balance, isLoading, lastUpdated }) => {
  return (
    <LinearGradient
      colors={['#10b981', '#059669', '#047857']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Ionicons name="wallet" size={24} color="#ffffff" />
        </View>
        <Text style={styles.label}>Available Balance</Text>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ffffff" />
        </View>
      ) : (
        <>
          <Text style={styles.balance}>{formatCurrency(balance)}</Text>
          {lastUpdated && (
            <View style={styles.footer}>
              <Ionicons name="time-outline" size={14} color="rgba(255, 255, 255, 0.8)" />
              <Text style={styles.lastUpdated}>
                Updated {new Date(lastUpdated).toLocaleTimeString()}
              </Text>
            </View>
          )}
        </>
      )}

      <View style={styles.circle1} />
      <View style={styles.circle2} />
    </LinearGradient>
  );
};

export default BalanceCard;

const styles = StyleSheet.create({
  card: {
    borderRadius: BORDER_RADIUS.xxl,
    padding: SPACING.xxxl + 4,
    marginBottom: SPACING.xl,
    minHeight: 200,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xxl,
  },
  iconContainer: {
    width: ICON_SIZE.xl,
    height: ICON_SIZE.xl,
    borderRadius: ICON_SIZE.xl / 2,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md + 2,
  },
  label: {
    fontSize: FONT_SIZE.md,
    color: 'rgba(255, 255, 255, 0.95)',
    fontWeight: FONT_WEIGHT.medium,
    letterSpacing: 0.2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  balance: {
    fontSize: ICON_SIZE.lg,
    fontWeight: FONT_WEIGHT.extrabold,
    color: '#ffffff',
    marginBottom: SPACING.md,
    letterSpacing: -1.5,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  lastUpdated: {
    fontSize: FONT_SIZE.xs + 1,
    color: 'rgba(255, 255, 255, 0.75)',
    marginLeft: SPACING.sm - 2,
    fontWeight: FONT_WEIGHT.regular,
  },
  circle1: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    top: -50,
    right: -30,
  },
  circle2: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    bottom: -30,
    left: -20,
  },
});
