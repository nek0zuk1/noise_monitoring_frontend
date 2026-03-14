import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../core/theme/Colors';

import DashboardScreen from '../features/client/screens/DashboardScreen';
import MapScreen from '../features/client/screens/MapScreen';
import UploadProofScreen from '../features/client/screens/UploadProofScreen';

const Tab = createBottomTabNavigator();

type IconName = React.ComponentProps<typeof MaterialIcons>['name'];

const TABS: { name: string; icon: IconName; label: string; hideTabBar?: boolean }[] = [
    { name: 'Dashboard', icon: 'sensors', label: 'Monitor' },
    { name: 'Map', icon: 'map', label: 'Map' },
    { name: 'UploadProof', icon: 'assignment', label: 'Report' },
];

const SCREENS: Record<string, React.ComponentType<any>> = {
    Dashboard: DashboardScreen,
    Map: MapScreen,
    UploadProof: UploadProofScreen,
};

export function ClientNavigator() {
    const insets = useSafeAreaInsets();

    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarStyle: {
                    height: 60 + Math.max(insets.bottom, 0),
                    paddingBottom: Math.max(insets.bottom, 6),
                    paddingTop: 6,
                    borderTopWidth: 1,
                    borderTopColor: Colors.borderMuted,
                    borderRadius: 0,
                    backgroundColor: Colors.tabBar,
                },
                tabBarActiveTintColor: Colors.tabActive,
                tabBarInactiveTintColor: Colors.tabInactive,
                tabBarLabelStyle: {
                    fontSize: 11,
                    fontWeight: '700',
                    marginTop: -2,
                },
                tabBarItemStyle: {
                    paddingVertical: 6,
                },
                tabBarIcon: ({ color, size, focused }) => {
                    const tab = TABS.find((t) => t.name === route.name);
                    return (
                        <MaterialIcons
                            name={tab?.icon ?? 'circle'}
                            size={focused ? size + 2 : size}
                            color={color}
                        />
                    );
                },
            })}
        >
            {TABS.map((tab) => (
                <Tab.Screen
                    key={tab.name}
                    name={tab.name}
                    component={SCREENS[tab.name]}
                    options={{
                        tabBarLabel: tab.label,
                        ...(tab.hideTabBar && { tabBarStyle: { display: 'none' } }),
                    }}
                />
            ))}
        </Tab.Navigator>
    );
}
