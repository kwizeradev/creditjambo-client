import React from 'react';
import { StyleSheet, View } from 'react-native';
import ActionButton from '@/components/ActionButton';
import { SPACING } from '@/lib/constants';

interface ActionButtonsProps {
  onDeposit: () => void;
  onWithdraw: () => void;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({ onDeposit, onWithdraw }) => {
  return (
    <View style={styles.container}>
      <ActionButton title="Deposit" icon="add-circle" onPress={onDeposit} variant="primary" />
      <View style={styles.spacer} />
      <ActionButton title="Withdraw" icon="remove-circle" onPress={onWithdraw} variant="secondary" />
    </View>
  );
};

export default ActionButtons;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginBottom: SPACING.xxxl,
  },
  spacer: {
    width: SPACING.lg,
  },
});
