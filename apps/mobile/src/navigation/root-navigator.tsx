import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StyleSheet } from 'react-native';
import { ScreenShell } from '../ui/templates/screen-shell';
import { Spinner } from '../ui/atoms/spinner';
import { SessionBootstrapScreen } from '../features/bootstrap/screens/session-bootstrap-screen';
import { useSession } from '../session/session-context';
import { MainTabs } from './main-tabs';
import type { RootStackParamList } from './linking';

const Stack = createNativeStackNavigator<RootStackParamList>();

function LoadingScreen() {
  return (
    <ScreenShell contentStyle={styles.centered}>
      <Spinner size="large" />
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export function RootNavigator() {
  const { sessionToken, isReady } = useSession();

  if (!isReady) {
    return <LoadingScreen />;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {sessionToken ? (
        <Stack.Screen name="Main" component={MainTabs} />
      ) : (
        <Stack.Screen name="Bootstrap" component={SessionBootstrapScreen} />
      )}
    </Stack.Navigator>
  );
}
