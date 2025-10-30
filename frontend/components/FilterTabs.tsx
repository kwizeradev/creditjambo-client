import React, { useCallback } from 'react';
import { StyleSheet, Text, View, Pressable, Animated } from 'react-native';
import { COLORS, SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS } from '@/lib/constants';
import * as Haptics from 'expo-haptics';

export type FilterOption = {
  id: string;
  label: string;
};

interface FilterTabsProps {
  options: FilterOption[];
  selectedId: string;
  onSelect: (id: string) => void;
}

const FilterTabs: React.FC<FilterTabsProps> = ({ options, selectedId, onSelect }) => {
  const handleSelect = useCallback((id: string) => {
    if (id !== selectedId) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onSelect(id);
    }
  }, [selectedId, onSelect]);

  return (
    <View style={styles.container}>
      {options.map((option) => {
        const isSelected = option.id === selectedId;
        return (
          <Pressable
            key={option.id}
            onPress={() => handleSelect(option.id)}
            style={[styles.tab, isSelected && styles.tabSelected]}
          >
            <Text style={[styles.tabText, isSelected && styles.tabTextSelected]}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};

export default FilterTabs;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.xs,
    gap: SPACING.xs,
  },
  tab: {
    flex: 1,
    paddingVertical: SPACING.sm + 2,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabSelected: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    fontSize: FONT_SIZE.sm + 1,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.textSecondary,
  },
  tabTextSelected: {
    color: '#ffffff',
    fontWeight: FONT_WEIGHT.bold,
  },
});
