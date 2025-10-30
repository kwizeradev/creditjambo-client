import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, LOW_BALANCE_THRESHOLD, SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS } from '@/lib/constants';
import { formatCurrency } from '@/lib/utils/date';

interface LowBalanceAlertProps {
  balance: string | number;
}

const LowBalanceAlert: React.FC<LowBalanceAlertProps> = ({ balance }) => {
  const numBalance = typeof balance === 'string' ? parseFloat(balance) : balance;

  if (numBalance >= LOW_BALANCE_THRESHOLD) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Ionicons name="warning" size={24} color={COLORS.warning} />
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>Low Balance Alert</Text>
        <Text style={styles.message}>
          Your balance is below {formatCurrency(LOW_BALANCE_THRESHOLD)}. Consider adding funds to
          your account.
        </Text>
      </View>
    </View>
  );
};

export default LowBalanceAlert;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#FEF3E2',
    borderLeftWidth: 5,
    borderLeftColor: COLORS.warning,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg + 2,
    marginBottom: SPACING.xl,
    shadowColor: COLORS.warning,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  iconContainer: {
    marginRight: SPACING.md + 2,
    paddingTop: 2,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.warning,
    marginBottom: SPACING.sm - 2,
    letterSpacing: 0.1,
  },
  message: {
    fontSize: FONT_SIZE.sm,
    color: '#8B5A00',
    lineHeight: 19,
  },
});
