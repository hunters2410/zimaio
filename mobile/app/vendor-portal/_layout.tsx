import { Stack } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import Colors from '@/constants/Colors';

export default function VendorPortalLayout() {
    const { theme } = useTheme();
    const colors = Colors[theme];

    return (
        <Stack
            screenOptions={{
                headerStyle: {
                    backgroundColor: colors.background,
                },
                headerTintColor: colors.text,
                headerShadowVisible: false,
                contentStyle: { backgroundColor: colors.background },
            }}
        >
            <Stack.Screen name="index" options={{ title: 'Vendor Portal' }} />
            <Stack.Screen name="register" options={{ title: 'Join ZimAIo', headerLeft: () => null }} />
            <Stack.Screen name="products/index" options={{ title: 'My Products' }} />
            <Stack.Screen name="products/add" options={{ title: 'Add Product' }} />
            <Stack.Screen name="orders" options={{ title: 'My Orders' }} />
            <Stack.Screen name="wallet" options={{ title: 'My Wallet' }} />
        </Stack>
    );
}
