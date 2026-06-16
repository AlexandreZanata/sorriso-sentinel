import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { I18N_KEYS } from '../i18n/keys';
import { useTranslation } from '../i18n/i18n-provider';
import { MapScreen } from '../features/map/screens/map-screen';
import { CreateOccurrenceScreen } from '../features/occurrences/screens/create-occurrence-screen';
import { SettingsHomeScreen } from '../features/settings/screens/settings-home-screen';
import type { MainTabParamList } from './linking';
import { colors } from '../ui/theme/colors';

const Tab = createBottomTabNavigator<MainTabParamList>();

export function MainTabs() {
  const { t } = useTranslation();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarIcon: ({ color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'ellipse';

          if (route.name === 'Map') {
            iconName = 'map-outline';
          }

          if (route.name === 'Report') {
            iconName = 'add-circle-outline';
          }

          if (route.name === 'Settings') {
            iconName = 'settings-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
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
