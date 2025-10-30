import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '@/lib/hooks/useTheme';

export default function ThemedStatusBar() {
  const { theme } = useTheme();
  
  return <StatusBar style={theme.colors.statusBarStyle} animated />;
}
