import { StatusBar } from 'expo-status-bar';
import { AppProviders } from './src/providers/app-providers';

export default function App() {
  return (
    <>
      <AppProviders />
      <StatusBar style="auto" />
    </>
  );
}
