import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Link, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { Pressable, Image, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

// ... (other imports)

import { CartProvider } from '@/contexts/CartContext';
import { ThemeProvider as CustomThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { FavoritesProvider } from '@/contexts/FavoritesContext';
import { SettingsProvider } from '@/contexts/SettingsContext';

// ... (other imports)

function RootLayoutNav() {
  return (
    <CustomThemeProvider>
      <FavoritesProvider>
        <SettingsProvider>
          <CartProvider>
            <RootLayoutContent />
          </CartProvider>
        </SettingsProvider>
      </FavoritesProvider>
    </CustomThemeProvider>
  );
}

import { supabase } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';
import { Alert } from 'react-native';

function RootLayoutContent() {
  const { theme } = useTheme();
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      setSession(null); // Force local update immediately
    } catch (error) {
      console.error('Error signing out:', error);
      setSession(null); // Force clear even on error
    }
  };

  return (
    <>
      <StatusBar style="auto" />
      <ThemeProvider value={theme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: Colors[theme ?? 'light'].background },
            headerShadowVisible: false,
            headerRight: () => (
              <View style={{ flexDirection: 'row', marginRight: 15, gap: 15 }}>
                <Link href="/favorites" asChild>
                  <Pressable>
                    {({ pressed }) => (
                      <FontAwesome
                        name="heart"
                        size={24}
                        color={Colors[theme ?? 'light'].danger}
                        style={{ opacity: pressed ? 0.5 : 1 }}
                      />
                    )}
                  </Pressable>
                </Link>
                <Link href="/notifications" asChild>
                  <Pressable>
                    {({ pressed }) => (
                      <FontAwesome
                        name="bell"
                        size={24}
                        color={Colors[theme ?? 'light'].primary}
                        style={{ opacity: pressed ? 0.5 : 1 }}
                      />
                    )}
                  </Pressable>
                </Link>
                {session && (
                  <Pressable onPress={handleSignOut}>
                    {({ pressed }) => (
                      <FontAwesome
                        name="sign-out"
                        size={24}
                        color={Colors[theme ?? 'light'].text}
                        style={{ opacity: pressed ? 0.5 : 1 }}
                      />
                    )}
                  </Pressable>
                )}
              </View>
            ),
          }}
        >
          <Stack.Screen
            name="(tabs)"
            options={{
              headerShown: true,
              headerTitle: () => null,
              headerLeft: () => (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 0, paddingLeft: 10 }}>
                  <Image
                    source={require('@/assets/images/logo.png')}
                    style={{ width: 140, height: 45 }}
                    resizeMode="contain"
                  />
                </View>
              ),
            }}
          />
          <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
          <Stack.Screen name="notifications" options={{ presentation: 'modal', title: 'Notifications' }} />
          <Stack.Screen name="favorites" options={{ presentation: 'modal', title: 'My Wishlist' }} />
          <Stack.Screen name="category/[id]" options={{ title: 'Category' }} />
          <Stack.Screen name="profile/about" options={{ presentation: 'modal', title: 'About Us' }} />
          <Stack.Screen name="profile/contact" options={{ presentation: 'modal', title: 'Contact Us' }} />
          <Stack.Screen name="profile/faq" options={{ presentation: 'modal', title: 'FAQ' }} />
          <Stack.Screen name="profile/privacy" options={{ presentation: 'modal', title: 'Privacy Policy' }} />
          <Stack.Screen name="profile/terms" options={{ presentation: 'modal', title: 'Terms & Conditions' }} />
          <Stack.Screen name="profile/shipping" options={{ presentation: 'modal', title: 'Shipping Policy' }} />
          <Stack.Screen name="profile/return" options={{ presentation: 'modal', title: 'Return Policy' }} />
          <Stack.Screen name="profile/track-order" options={{ title: 'Track Order' }} />
          <Stack.Screen name="(auth)/login" options={{ title: 'Sign In' }} />
          <Stack.Screen name="(auth)/signup" options={{ title: 'Create Account' }} />
          <Stack.Screen name="(auth)/forgot-password" options={{ title: 'Reset Password' }} />
        </Stack>
      </ThemeProvider>
    </>
  );
}
