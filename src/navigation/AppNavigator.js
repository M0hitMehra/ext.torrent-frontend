import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS } from '../constants';

import HomeScreen          from '../screens/HomeScreen';
import SearchScreen        from '../screens/SearchScreen';
import BrowseScreen        from '../screens/BrowseScreen';
import TorrentDetailScreen from '../screens/TorrentDetailScreen';
import PlayerScreen        from '../screens/PlayerScreen';
import SettingsScreen      from '../screens/SettingsScreen';
import { useAppSettings, getTheme } from '../utils/settings';

const Stack = createStackNavigator();
const Tab   = createBottomTabNavigator();
const isTV  = Platform.isTV;

const screenOptions = {
  headerShown: false,
  cardStyle: { backgroundColor: COLORS.bg },
  cardStyleInterpolator: ({ current }) => ({
    cardStyle: { opacity: current.progress },
  }),
};

// Bottom tabs (phone layout)
function TabNavigator() {
  const { settings } = useAppSettings();
  const palette = getTheme(settings.mode);
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: palette.surface,
          borderTopColor: palette.border,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: palette.textMuted,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
        },
        tabBarIcon: ({ color, size, focused }) => {
          const icons = { Home: 'home', Search: 'search', Browse: 'explore', Settings: 'settings' };
          return <MaterialIcons name={icons[route.name] || 'home'} size={focused ? 24 : 22} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home"   component={HomeScreen}   />
      <Tab.Screen name="Search" component={SearchScreen} />
      <Tab.Screen name="Browse" component={BrowseScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { settings } = useAppSettings();
  const palette = getTheme(settings.mode);
  const themedScreenOptions = { ...screenOptions, cardStyle: { backgroundColor: palette.bg } };
  return (
    <NavigationContainer
      theme={{
        dark: settings.mode !== 'light',
        colors: {
          primary: COLORS.primary,
          background: palette.bg,
          card: palette.surface,
          text: palette.text,
          border: palette.border,
          notification: COLORS.accent,
        },
      }}
    >
      {isTV ? (
        <Stack.Navigator screenOptions={themedScreenOptions}>
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Search" component={SearchScreen} />
          <Stack.Screen name="Browse" component={BrowseScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
          <Stack.Screen name="TorrentDetail" component={TorrentDetailScreen} />
          <Stack.Screen name="Player" component={PlayerScreen} options={{ presentation: 'fullScreenModal' }} />
        </Stack.Navigator>
      ) : (
        <Stack.Navigator screenOptions={themedScreenOptions}>
          <Stack.Screen name="Tabs" component={TabNavigator} />
          <Stack.Screen name="TorrentDetail" component={TorrentDetailScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
          <Stack.Screen name="Player" component={PlayerScreen}
            options={{ presentation: 'fullScreenModal' }}
          />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
}
