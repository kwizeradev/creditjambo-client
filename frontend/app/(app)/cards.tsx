import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, ICON_SIZE, FONT_SIZE, FONT_WEIGHT, SPACING, OPACITY } from '@/lib/constants';
import GradientBackground from '@/components/GradientBackground';

export default function CardsScreen(): React.ReactElement {
  return (
    <GradientBackground style={styles.container}>
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Ionicons name="card-outline" size={80} color={COLORS.primary} />
          </View>
          <Text style={styles.title}>Virtual Cards</Text>
          <Text style={styles.message}>
            Create and manage virtual cards for secure online payments. Coming soon!
          </Text>
        </View>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xxxl + 8,
  },
  iconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: `${COLORS.primary}${OPACITY.medium}`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xxl,
  },
  title: {
    fontSize: FONT_SIZE.xxl - 2,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  message: {
    fontSize: FONT_SIZE.lg - 1,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
});
