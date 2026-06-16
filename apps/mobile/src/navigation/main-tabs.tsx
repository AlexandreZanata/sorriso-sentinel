import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { I18N_KEYS } from '../i18n/keys';
import { useTranslation } from '../i18n/i18n-provider';
import { MapScreen } from '../features/map/screens/map-screen';
import { CreateOccurrenceScreen } from '../features/occurrences/screens/create-occurrence-screen';
import { SettingsHomeScreen } from '../features/settings/screens/settings-home-screen';
import type { MainTabParamList } from './linking';

const Tab = createBottomTabNavigator<MainTabParamList>();

export function MainTabs() {
  const { t } = useTranslation();

  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen
        name="Map"
        component={MapScreen}
        options={{ title: t(I18N_KEYS.tabs.map) }}
      />
      <Tab.Screen
        name="Report"
        component={CreateOccurrenceScreen}
        options={{ title: t(I18N_KEYS.tabs.report) }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsHomeScreen}
        options={{ title: t(I18N_KEYS.tabs.settings) }}
      />
    </Tab.Navigator>
  );
}
