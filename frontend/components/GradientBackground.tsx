import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/lib/hooks/useTheme';

interface GradientBackgroundProps extends ViewProps {
  children: React.ReactNode;
}

const GradientBackground: React.FC<GradientBackgroundProps> = ({ children, style, ...props }) => {
  const { theme } = useTheme();
  
  const gradientColors = [
    theme.colors.background,
    theme.colors.background,
    theme.colors.surface,
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
