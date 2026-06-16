import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SessionGate } from '../features/bootstrap/components/session-gate';
import type { RootStackParamList } from './linking';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Main" component={SessionGate} />
    </Stack.Navigator>
  );
}
