import { StyleSheet, Text as RNText, type TextProps as RNTextProps } from 'react-native';
import { colors, type SemanticColor } from '../../theme/colors';
import { typography, type TextVariant } from '../../theme/typography';

export interface TextProps extends RNTextProps {
  variant?: TextVariant;
  color?: SemanticColor;
}

export function Text({
  variant = 'body',
  color = 'textPrimary',
  style,
  ...rest
}: TextProps) {
  return (
    <RNText
      style={[styles.base, typography[variant], { color: colors[color] }, style]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    includeFontPadding: false,
  },
});
