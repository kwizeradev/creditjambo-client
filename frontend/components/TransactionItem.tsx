import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS } from '@/lib/constants';
import { useTheme } from '@/lib/hooks/useTheme';
import { formatCurrency, formatRelativeTime } from '@/lib/utils/date';
import type { Transaction } from '@/types';

interface TransactionItemProps {
  transaction: Transaction;
  onPress: (transaction: Transaction) => void;
}

const TransactionItem: React.FC<TransactionItemProps> = ({ transaction, onPress }) => {
  const { theme } = useTheme();
  const isDeposit = transaction.type === 'DEPOSIT';
  const iconName = isDeposit ? 'arrow-down' : 'arrow-up';
  const iconColor = isDeposit ? theme.colors.success : theme.colors.error;
  const iconBgColor = isDeposit ? `${theme.colors.success}15` : `${theme.colors.error}15`;
  const amountColor = isDeposit ? theme.colors.success : theme.colors.error;
  const amountPrefix = isDeposit ? '+' : '-';

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress(transaction);
  };

  return (
    <TouchableOpacity 
      style={[
        styles.container, 
        { 
          backgroundColor: theme.colors.surface, 
          borderColor: theme.colors.border 
        }
      ]} 
      onPress={handlePress} 
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: iconBgColor }]}>
        <Ionicons name={iconName} size={22} color={iconColor} />
      </View>
      <View style={styles.content}>
        <Text style={[styles.type, { color: theme.colors.text }]} numberOfLines={1}>
          {transaction.description || (isDeposit ? 'Deposit' : 'Withdrawal')}
        </Text>
        <Text style={[styles.date, { color: theme.colors.textSecondary }]}>{formatRelativeTime(transaction.createdAt)}</Text>
      </View>
      <View style={styles.amountContainer}>
        <Text style={[styles.amount, { color: amountColor }]}>
          {amountPrefix}
          {formatCurrency(transaction.amount)}
        </Text>
        <Ionicons name="chevron-forward" size={18} color={theme.colors.textSecondary} style={styles.chevron} />
      </View>
    </TouchableOpacity>
  );
};

export default TransactionItem;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md + 2,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  type: {
    fontSize: FONT_SIZE.md - 1,
    fontWeight: FONT_WEIGHT.semibold,
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  date: {
    fontSize: FONT_SIZE.sm - 1,
    fontWeight: FONT_WEIGHT.regular,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  amount: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    letterSpacing: -0.3,
  },
  chevron: {
    marginLeft: 2,
  },
});
