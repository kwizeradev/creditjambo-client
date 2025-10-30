import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants/configs';
import type { PasswordStrength as PasswordStrengthType } from '@/types/auth';

interface PasswordStrengthProps {
  strength: PasswordStrengthType;
  showRequirements?: boolean;
}

const PasswordStrength: React.FC<PasswordStrengthProps> = ({
  strength,
  showRequirements = false,
}) => {
  if (!strength.label) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>Password Strength</Text>
        <Text style={[styles.value, { color: strength.color }]}>
          {strength.label}
        </Text>
      </View>

      <View style={styles.strengthBar}>
        {[1, 2, 3, 4, 5].map(segment => (
          <View
            key={segment}
            style={[
              styles.strengthSegment,
              {
                backgroundColor:
                  segment <= strength.score ? strength.color : COLORS.border,
              },
            ]}
          />
        ))}
      </View>

      {showRequirements && (
        <View style={styles.requirements}>
          {strength.requirements.map((requirement, index) => (
            <View key={index} style={styles.requirement}>
              <Ionicons
                name={requirement.met ? 'checkmark-circle' : 'close-circle'}
                size={16}
                color={requirement.met ? COLORS.success : COLORS.textSecondary}
                style={styles.requirementIcon}
              />
              <Text
                style={[
                  styles.requirementText,
                  {
                    color: requirement.met
                      ? COLORS.success
                      : COLORS.textSecondary,
                  },
                ]}
              >
                {requirement.text}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  value: {
    fontSize: 14,
    fontWeight: '600',
  },
  strengthBar: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 12,
  },
  strengthSegment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  requirements: {
    gap: 6,
  },
  requirement: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  requirementIcon: {
    marginRight: 8,
  },
  requirementText: {
    fontSize: 13,
    flex: 1,
  },
});

export default PasswordStrength;
