import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, OPACITY } from '@/lib/constants';

interface GradientBackgroundProps extends ViewProps {
  children: React.ReactNode;
}

const GradientBackground: React.FC<GradientBackgroundProps> = ({ children, style, ...props }) => {
  const gradientColors = [
    `${COLORS.primary}${OPACITY.subtle}`,
    COLORS.background,
    COLORS.surface,
  ] as const;

  return (
    <View style={[styles.container, style]} {...props}>
      <LinearGradient colors={gradientColors} style={styles.gradient}>
        {children}
      </LinearGradient>
    </View>
  );
};

export default GradientBackground;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
});
