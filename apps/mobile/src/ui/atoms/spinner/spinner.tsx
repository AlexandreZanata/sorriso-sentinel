import { ActivityIndicator, type ActivityIndicatorProps } from 'react-native';
import { colors } from '../../theme/colors';

export function Spinner(props: Omit<ActivityIndicatorProps, 'color'>) {
  return <ActivityIndicator color={colors.primary} {...props} />;
}
