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
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopColor: COLORS.cardHighlight,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: COLORS.primaryGlow,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
        },
        tabBarIcon: ({ color, size, focused }) => {
          const icons = { Home: 'home', Search: 'search', Browse: 'explore' };
          return <MaterialIcons name={icons[route.name] || 'home'} size={focused ? 24 : 22} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home"   component={HomeScreen}   />
      <Tab.Screen name="Search" component={SearchScreen} />
      <Tab.Screen name="Browse" component={BrowseScreen} />
    </Tab.Navigator>
  );
}

// TV uses a single flat stack (no bottom tabs on TV)
function TVNavigator() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="Home"   component={HomeScreen}   />
      <Stack.Screen name="Search" component={SearchScreen} />
      <Stack.Screen name="Browse" component={BrowseScreen} />
      <Stack.Screen name="TorrentDetail" component={TorrentDetailScreen} />
      <Stack.Screen name="Player" component={PlayerScreen}
        options={{ presentation: 'fullScreenModal' }}
      />
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer
      theme={{
        dark: true,
        colors: {
          primary: COLORS.primary,
          background: COLORS.bg,
          card: COLORS.surface,
          text: COLORS.text,
          border: COLORS.border,
          notification: COLORS.accent,
        },
      }}
    >
      {isTV ? (
        <TVNavigator />
      ) : (
        <Stack.Navigator screenOptions={screenOptions}>
          <Stack.Screen name="Tabs" component={TabNavigator} />
          <Stack.Screen name="TorrentDetail" component={TorrentDetailScreen} />
          <Stack.Screen name="Player" component={PlayerScreen}
            options={{ presentation: 'fullScreenModal' }}
          />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
}
