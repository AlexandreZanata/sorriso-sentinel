import { type ReactNode } from 'react';
import { ScrollView, StyleSheet, View, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

export interface ScreenShellProps {
  header?: ReactNode;
  children: ReactNode;
  scrollable?: boolean;
  contentStyle?: ViewStyle;
}

export function ScreenShell({
  header,
  children,
  scrollable = false,
  contentStyle,
}: ScreenShellProps) {
  const body = scrollable ? (
    <ScrollView contentContainerStyle={[styles.content, contentStyle]}>
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.content, contentStyle]}>{children}</View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      {header ? <View style={styles.header}>{header}</View> : null}
      {body}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  header: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  content: {
    flexGrow: 1,
    padding: spacing.md,
  },
});
