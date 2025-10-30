import React from 'react';

import { StyleSheet, Text, View } from 'react-native';

import { COLORS } from '@/lib/constants';
import type {
  PasswordRequirement,
  PasswordStrength as PasswordStrengthType,
} from '@/types/auth';
import { Ionicons } from '@expo/vector-icons';

interface PasswordStrengthProps {
  strength: PasswordStrengthType;
  showRequirements?: boolean;
}

const STRENGTH_SEGMENTS = [1, 2, 3, 4, 5];
const REQUIREMENT_ICON_SIZE = 16;

function getRequirementIconName(
  isMet: boolean
): keyof typeof Ionicons.glyphMap {
  return isMet ? 'checkmark-circle' : 'close-circle';
}

function getRequirementColor(isMet: boolean): string {
  return isMet ? COLORS.success : COLORS.textSecondary;
}

function getSegmentColor(
  segment: number,
  score: number,
  strengthColor: string
): string {
  return segment <= score ? strengthColor : COLORS.border;
}

interface StrengthBarProps {
  score: number;
  color: string;
}

function StrengthBar({ score, color }: StrengthBarProps): React.ReactElement {
  return (
    <View style={styles.strengthBar}>
      {STRENGTH_SEGMENTS.map(segment => (
        <View
          key={segment}
          style={[
            styles.strengthSegment,
            { backgroundColor: getSegmentColor(segment, score, color) },
          ]}
        />
      ))}
    </View>
  );
}

interface RequirementItemProps {
  requirement: PasswordRequirement;
}

function RequirementItem({
  requirement,
}: RequirementItemProps): React.ReactElement {
  const iconName = getRequirementIconName(requirement.met);
  const color = getRequirementColor(requirement.met);

  return (
    <View style={styles.requirement}>
      <Ionicons
        name={iconName}
        size={REQUIREMENT_ICON_SIZE}
        color={color}
        style={styles.requirementIcon}
      />
      <Text style={[styles.requirementText, { color }]}>
        {requirement.text}
      </Text>
    </View>
  );
}

interface RequirementsListProps {
  requirements: PasswordRequirement[];
}

function RequirementsList({
  requirements,
}: RequirementsListProps): React.ReactElement {
  return (
    <View style={styles.requirements}>
      {requirements.map((requirement, index) => (
        <RequirementItem key={index} requirement={requirement} />
      ))}
    </View>
  );
}

function PasswordStrength({
  strength,
  showRequirements = false,
}: PasswordStrengthProps): React.ReactElement | null {
  if (!strength.label) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>Password Strength</Text>
        <Text style={[styles.value, { color: strength.color }]}>
          {strength.label}
        </Text>
      </View>

      <StrengthBar score={strength.score} color={strength.color} />

      {showRequirements && (
        <RequirementsList requirements={strength.requirements} />
      )}
    </View>
  );
}

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
