import React, { useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS, OPACITY } from '@/lib/constants';
import { useTheme } from '@/lib/hooks/useTheme';
import { formatCurrency } from '@/lib/utils/date';
import type { Transaction } from '@/types';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface TransactionDetailModalProps {
  transaction: Transaction | null;
  visible: boolean;
  onClose: () => void;
}

const TransactionDetailModal: React.FC<TransactionDetailModalProps> = ({
  transaction,
  visible,
  onClose,
}) => {
  const { theme } = useTheme();
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          damping: 25,
          stiffness: 200,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: SCREEN_HEIGHT,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  if (!transaction) return null;

  const isDeposit = transaction.type === 'DEPOSIT';
  const amountColor = isDeposit ? theme.colors.success : theme.colors.error;
  const amountPrefix = isDeposit ? '+' : '-';
  const iconName = isDeposit ? 'arrow-down-circle' : 'arrow-up-circle';
  const iconBgColor = isDeposit ? `${theme.colors.success}15` : `${theme.colors.error}15`;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.modalContainer}>
        <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
          <TouchableOpacity style={styles.overlayTouch} activeOpacity={1} onPress={onClose} />
        </Animated.View>

        <Animated.View
          style={[
            styles.bottomSheet,
            {
              backgroundColor: theme.colors.surface,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.handleContainer}>
            <View style={[styles.handle, { backgroundColor: theme.colors.border }]} />
          </View>

          <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
            <View style={[styles.iconContainer, { backgroundColor: iconBgColor }]}>
              <Ionicons name={iconName} size={28} color={amountColor} />
            </View>
            <Text style={[styles.title, { color: theme.colors.text }]}>Transaction Details</Text>
            <TouchableOpacity 
              onPress={onClose} 
              style={[styles.closeButton, { backgroundColor: `${theme.colors.textSecondary}${OPACITY.light}` }]} 
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={22} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={[styles.amountSection, { borderBottomColor: theme.colors.border }]}>
            <Text style={[styles.amountLabel, { color: theme.colors.textSecondary }]}>Amount</Text>
            <Text style={[styles.amountValue, { color: amountColor }]}>
              {amountPrefix}
              {formatCurrency(transaction.amount)}
            </Text>
          </View>

          <ScrollView style={styles.detailsSection} showsVerticalScrollIndicator={false}>
            <DetailCard
              icon="pricetag"
              label="Type"
              value={transaction.type}
              valueColor={amountColor}
              theme={theme}
            />
            <DetailCard
              icon="document-text"
              label="Description"
              value={transaction.description || (isDeposit ? 'Deposit' : 'Withdrawal')}
              theme={theme}
            />
            <DetailCard
              icon="calendar"
              label="Date & Time"
              value={new Date(transaction.createdAt).toLocaleString('en-US', {
                dateStyle: 'medium',
                timeStyle: 'short',
              })}
              theme={theme}
            />
            <DetailCard
              icon="finger-print"
              label="Transaction ID"
              value={transaction.id}
              isMonospace
              theme={theme}
            />
            <DetailCard
              icon="time"
              label="Status"
              value="Completed"
              valueColor={theme.colors.success}
              theme={theme}
            />
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
};

interface DetailCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  valueColor?: string;
  isMonospace?: boolean;
  theme: any;
}

const DetailCard: React.FC<DetailCardProps> = ({ icon, label, value, valueColor, isMonospace, theme }) => (
  <View style={[styles.detailCard, { backgroundColor: `${theme.colors.primary}${OPACITY.subtle}` }]}>
    <View style={[styles.detailIconContainer, { backgroundColor: theme.colors.surface }]}>
      <Ionicons name={icon} size={20} color={theme.colors.primary} />
    </View>
    <View style={styles.detailContent}>
      <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>{label}</Text>
      <Text
        style={[
          styles.detailValue,
          { color: theme.colors.text },
          valueColor && { color: valueColor },
          isMonospace && styles.monospace,
        ]}
        numberOfLines={2}
      >
        {value}
      </Text>
    </View>
  </View>
);

export default TransactionDetailModal;

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  overlayTouch: {
    flex: 1,
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: BORDER_RADIUS.xxl + 4,
    borderTopRightRadius: BORDER_RADIUS.xxl + 4,
    paddingBottom: Platform.OS === 'ios' ? 34 : SPACING.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 20,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.sm + 2,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
    borderBottomWidth: 1,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm + 2,
  },
  title: {
    fontSize: FONT_SIZE.xl,
    fontWeight: FONT_WEIGHT.bold,
  },
  closeButton: {
    position: 'absolute',
    right: SPACING.md,
    top: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  amountSection: {
    alignItems: 'center',
    paddingVertical: SPACING.lg + 4,
    borderBottomWidth: 1,
  },
  amountLabel: {
    fontSize: FONT_SIZE.xs + 1,
    fontWeight: FONT_WEIGHT.medium,
    marginBottom: SPACING.xs + 2,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  amountValue: {
    fontSize: 32,
    fontWeight: FONT_WEIGHT.extrabold,
    letterSpacing: -1,
  },
  detailsSection: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  detailCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: SPACING.md + 2,
    borderRadius: BORDER_RADIUS.md + 2,
    marginBottom: SPACING.sm + 2,
  },
  detailIconContainer: {
    width: 36,
    height: 36,
    borderRadius: BORDER_RADIUS.sm + 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.medium,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: FONT_SIZE.md + 1,
    fontWeight: FONT_WEIGHT.semibold,
    lineHeight: 22,
  },
  monospace: {
    fontSize: FONT_SIZE.xs + 1,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
});
