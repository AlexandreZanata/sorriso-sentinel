import { StyleSheet, View } from 'react-native';
import { spacing } from '../../theme/spacing';
import { Button } from '../../atoms/button';
import { Spinner } from '../../atoms/spinner';
import { Text } from '../../atoms/text';

export interface SessionBootstrapGateProps {
  loading: boolean;
  errorMessage: string | null;
  loadingLabel: string;
  retryLabel: string;
  onRetry: () => void;
}

export function SessionBootstrapGate({
  loading,
  errorMessage,
  loadingLabel,
  retryLabel,
  onRetry,
}: SessionBootstrapGateProps) {
  return (
    <View style={styles.container}>
      <Text variant="title" style={styles.title}>
        {loadingLabel}
      </Text>
      {loading ? <Spinner size="large" /> : null}
      {errorMessage ? (
        <Text variant="body" color="danger" style={styles.error}>
          {errorMessage}
        </Text>
      ) : null}
      {errorMessage ? (
        <Button label={retryLabel} onPress={onRetry} style={styles.button} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    gap: spacing.md,
  },
  title: {
    textAlign: 'center',
  },
  error: {
    textAlign: 'center',
  },
  button: {
    alignSelf: 'stretch',
  },
});
