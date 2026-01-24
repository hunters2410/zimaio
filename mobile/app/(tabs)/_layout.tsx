import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Link, withLayoutContext } from 'expo-router';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { View, Text } from 'react-native';

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useCart } from '@/contexts/CartContext';

const { Navigator } = createMaterialTopTabNavigator();
export const MaterialTopTabs = withLayoutContext(Navigator);

function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={28} style={{ marginBottom: -3 }} {...props} />;
}


export default function TabLayout() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { cartItems } = useCart();

  return (
    <MaterialTopTabs
      tabBarPosition="bottom"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.tint,
        tabBarInactiveTintColor: colors.tabIconDefault,
        tabBarIndicatorStyle: { height: 0, backgroundColor: 'transparent' },
        tabBarLabelStyle: { textTransform: 'none', fontSize: 10, fontWeight: '600' },
        tabBarStyle: { borderTopWidth: 1, borderColor: colors.border, backgroundColor: colors.background, elevation: 0, shadowOpacity: 0 },
        tabBarContentContainerStyle: { alignItems: 'center' },
        swipeEnabled: true,
        animationEnabled: true,
      }}>
      <MaterialTopTabs.Screen
        name="index"
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color }) => <TabBarIcon name="home" color={color} />,
        }}
      />
      <MaterialTopTabs.Screen
        name="categories"
        options={{
          tabBarLabel: 'Categories',
          tabBarIcon: ({ color }) => <TabBarIcon name="th-large" color={color} />,
        }}
      />
      <MaterialTopTabs.Screen
        name="explore"
        options={{
          tabBarLabel: 'Explore',
          tabBarIcon: ({ color }) => <TabBarIcon name="compass" color={color} />,
        }}
      />
      <MaterialTopTabs.Screen
        name="cart"
        options={{
          tabBarLabel: 'Cart',
          tabBarIcon: ({ color }) => (
            <View>
              <TabBarIcon name="shopping-cart" color={color} />
              {cartItems.length > 0 && (
                <View style={{
                  position: 'absolute',
                  right: -6,
                  top: -3,
                  backgroundColor: '#ef4444',
                  borderRadius: 10,
                  width: 16,
                  height: 16,
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderWidth: 1.5,
                  borderColor: colors.background
                }}>
                  <Text style={{ color: 'white', fontSize: 9, fontWeight: 'bold' }}>
                    {cartItems.length > 9 ? '9+' : cartItems.length}
                  </Text>
                </View>
              )}
            </View>
          ),
        }}
      />
      <MaterialTopTabs.Screen
        name="profile"
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color }) => <TabBarIcon name="user" color={color} />,
        }}
      />
      <MaterialTopTabs.Screen
        name="two"
        options={{
          tabBarItemStyle: { display: 'none' }, // Hide from tab bar
        }}
      />
    </MaterialTopTabs>
  );
}
