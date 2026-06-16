import { StyleSheet, View } from 'react-native';
import { colors } from '../../theme/colors';
import { radii } from '../../theme/radii';
import { spacing } from '../../theme/spacing';
import { Text } from '../text';

export type BadgeTone = 'neutral' | 'success' | 'warning' | 'danger';

const toneStyles: Record<BadgeTone, { bg: string; fg: keyof typeof colors }> = {
  neutral: { bg: colors.surfaceMuted, fg: 'textMuted' },
  success: { bg: '#E8F5E9', fg: 'success' },
  warning: { bg: '#FFF3E0', fg: 'warning' },
  danger: { bg: '#FFEBEE', fg: 'danger' },
};

export interface BadgeProps {
  label: string;
  tone?: BadgeTone;
}

export function Badge({ label, tone = 'neutral' }: BadgeProps) {
  const toneStyle = toneStyles[tone];

  return (
    <View style={[styles.container, { backgroundColor: toneStyle.bg }]}>
      <Text variant="caption" color={toneStyle.fg}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-start',
    borderRadius: radii.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
});
