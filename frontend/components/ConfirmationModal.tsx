import React, { useEffect, useRef } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  View,
  Pressable,
  Animated,
  Dimensions,
} from 'react-native';
import { SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS } from '@/lib/constants';
import { useTheme } from '@/lib/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';
import { formatCurrency } from '@/lib/utils/date';

interface ConfirmationModalProps {
  visible: boolean;
  title: string;
  amount: string;
  currentBalance: string;
  description?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
  variant?: 'deposit' | 'withdraw';
  showWarning?: boolean;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  visible,
  title,
  amount,
  currentBalance,
  description,
  onConfirm,
  onCancel,
  isLoading = false,
  variant = 'deposit',
  showWarning = false,
}) => {
  const { theme } = useTheme();
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          friction: 9,
          tension: 65,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: SCREEN_HEIGHT,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, slideAnim, overlayOpacity]);

  const newBalance = variant === 'deposit'
    ? parseFloat(currentBalance) + parseFloat(amount || '0')
    : parseFloat(currentBalance) - parseFloat(amount || '0');
  
  const accentColor = variant === 'withdraw' ? theme.colors.error : theme.colors.primary;
  const iconName = variant === 'withdraw' ? 'alert-circle' : 'checkmark-circle';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onCancel}
    >
      <View style={styles.container}>
        <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onCancel} />
        </Animated.View>

        <Animated.View
          style={[
            styles.modal,
            {
              backgroundColor: theme.colors.surface,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={[styles.handle, { backgroundColor: theme.colors.border }]} />

          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Ionicons name={iconName} size={48} color={accentColor} />
            </View>
            <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
            {showWarning && (
              <View style={[styles.warningBanner, { backgroundColor: `${theme.colors.warning}10` }]}>
                <Ionicons name="warning" size={16} color={theme.colors.warning} />
                <Text style={[styles.warningText, { color: theme.colors.warning }]}>Large withdrawal - please confirm</Text>
              </View>
            )}
          </View>

          <View style={styles.content}>
            <View style={styles.amountSection}>
              <Text style={[styles.label, { color: theme.colors.textSecondary }]}>{variant === 'withdraw' ? 'Withdrawal Amount' : 'Deposit Amount'}</Text>
              <Text style={[styles.amount, { color: accentColor }]}>{formatCurrency(amount || '0')}</Text>
            </View>

            {description && (
              <View style={[styles.descriptionSection, { backgroundColor: theme.colors.background }]}>
                <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Description</Text>
                <Text style={[styles.description, { color: theme.colors.text }]}>{description}</Text>
              </View>
            )}

            <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

            <View style={styles.balanceSection}>
              <View style={styles.balanceRow}>
                <Text style={[styles.balanceLabel, { color: theme.colors.textSecondary }]}>Current Balance</Text>
                <Text style={[styles.balanceValue, { color: theme.colors.text }]}>{formatCurrency(currentBalance)}</Text>
              </View>
              <View style={styles.balanceRow}>
                <Text style={[styles.balanceLabel, { color: theme.colors.textSecondary }]}>New Balance</Text>
                <Text style={[styles.balanceValue, styles.newBalance, { color: theme.colors.primary }]}>
                  {formatCurrency(newBalance)}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.actions}>
            <Pressable
              onPress={onCancel}
              style={[
                styles.button, 
                styles.cancelButton, 
                { 
                  backgroundColor: theme.colors.background, 
                  borderColor: theme.colors.border 
                }
              ]}
              disabled={isLoading}
            >
              <Text style={[styles.cancelButtonText, { color: theme.colors.text }]}>Cancel</Text>
            </Pressable>

            <Pressable
              onPress={onConfirm}
              style={[
                styles.button, 
                styles.confirmButton, 
                { 
                  backgroundColor: variant === 'withdraw' ? theme.colors.error : theme.colors.primary,
                  shadowColor: variant === 'withdraw' ? theme.colors.error : theme.colors.primary
                }
              ]}
              disabled={isLoading}
            >
              <Text style={styles.confirmButtonText}>
                {isLoading ? 'Processing...' : (variant === 'withdraw' ? 'Confirm Withdrawal' : 'Confirm Deposit')}
              </Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

export default ConfirmationModal;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modal: {
    borderTopLeftRadius: BORDER_RADIUS.xxl,
    borderTopRightRadius: BORDER_RADIUS.xxl,
    paddingBottom: SPACING.xxxl,
    maxHeight: SCREEN_HEIGHT * 0.85,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: SPACING.md,
    marginBottom: SPACING.xl,
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: SPACING.xxl,
    marginBottom: SPACING.xl,
  },
  iconContainer: {
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: FONT_WEIGHT.bold,
    textAlign: 'center',
  },
  content: {
    paddingHorizontal: SPACING.xxl,
    marginBottom: SPACING.xl,
  },
  amountSection: {
    alignItems: 'center',
    marginBottom: SPACING.xxl,
  },
  label: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.medium,
    marginBottom: SPACING.xs,
  },
  amount: {
    fontSize: FONT_SIZE.xxxl + 8,
    fontWeight: FONT_WEIGHT.extrabold,
    letterSpacing: -1,
  },
  descriptionSection: {
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.lg,
  },
  description: {
    fontSize: FONT_SIZE.md,
    lineHeight: 22,
  },
  divider: {
    height: 1,
    marginVertical: SPACING.lg,
  },
  balanceSection: {
    gap: SPACING.md,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.medium,
  },
  balanceValue: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.semibold,
  },
  newBalance: {
    fontWeight: FONT_WEIGHT.bold,
  },
  actions: {
    flexDirection: 'row',
    gap: SPACING.md,
    paddingHorizontal: SPACING.xxl,
  },
  button: {
    flex: 1,
    paddingVertical: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  cancelButton: {
    borderWidth: 1.5,
  },
  confirmButton: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  cancelButtonText: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.semibold,
  },
  confirmButtonText: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    color: '#ffffff',
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
    marginTop: SPACING.md,
    gap: SPACING.xs,
  },
  warningText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.semibold,
  },
});
