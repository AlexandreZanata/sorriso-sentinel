import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  type PressableProps,
} from 'react-native';
import { colors, type SemanticColor } from '../../theme/colors';
import { radii } from '../../theme/radii';
import { spacing } from '../../theme/spacing';
import { Text } from '../text';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';

export interface ButtonProps extends Omit<PressableProps, 'children'> {
  label: string;
  variant?: ButtonVariant;
  loading?: boolean;
}

const VARIANTS: Record<
  ButtonVariant,
  { container: object; textColor: SemanticColor; spinnerColor: string }
> = {
  primary: {
    container: { backgroundColor: colors.primary },
    textColor: 'textOnPrimary',
    spinnerColor: colors.textOnPrimary,
  },
  secondary: {
    container: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    textColor: 'textPrimary',
    spinnerColor: colors.primary,
  },
  ghost: {
    container: { backgroundColor: 'transparent' },
    textColor: 'primary',
    spinnerColor: colors.primary,
  },
};

export function Button({
  label,
  variant = 'primary',
  loading = false,
  disabled,
  style,
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const variantStyle = VARIANTS[variant];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        variantStyle.container,
        pressed && !isDisabled ? styles.pressed : null,
        isDisabled ? styles.disabled : null,
        style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={variantStyle.spinnerColor} />
      ) : (
        <Text variant="body" color={variantStyle.textColor} style={styles.label}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.9,
  },
  disabled: {
    opacity: 0.5,
  },
});
