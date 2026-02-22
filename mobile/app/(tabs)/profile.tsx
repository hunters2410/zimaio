import { StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Text, View } from '@/components/Themed';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import Colors from '@/constants/Colors';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';

export default function ProfileScreen() {
    const router = useRouter();
    const { toggleTheme, theme } = useTheme();
    const colors = Colors[theme];
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);

    const [isVendor, setIsVendor] = useState(false);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            if (session) checkVendorStatus(session.user.id);
            setLoading(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            if (session) {
                checkVendorStatus(session.user.id);
            } else {
                setIsVendor(false);
                setLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const checkVendorStatus = async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('vendor_profiles')
                .select('id')
                .eq('user_id', userId)
                .single();

            if (data && !error) {
                setIsVendor(true);
            } else {
                setIsVendor(false);
            }
        } catch (e) {
            setIsVendor(false);
        }
    };

    const handleVendorAction = () => {
        if (!session) {
            Alert.alert("Login Required", "Please login to start selling.", [
                { text: "Cancel", style: "cancel" },
                { text: "Login", onPress: () => router.push('/login') }
            ]);
            return;
        }

        if (isVendor) {
            router.push('/vendor-portal');
        } else {
            router.push('/vendor-portal/register');
        }
    };

    const handleLogout = async () => {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
            setSession(null);
            setIsVendor(false);
            // Optional: redirect to login or home to force refresh state
            // router.replace('/'); 
        } catch (error) {
            console.error('Error signing out:', error);
            setSession(null); // Force clear local session even if server fails
            setIsVendor(false);
        }
    };

    const confirmLogout = () => {
        Alert.alert(
            "Logout",
            "Are you sure you want to log out?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Logout",
                    style: "destructive",
                    onPress: handleLogout
                }
            ]
        );
    };

    const handleLanguage = () => {
        Alert.alert(
            "Select Language",
            "Choose your preferred language",
            [
                { text: "English", onPress: () => console.log("English selected") },
                { text: "Shona", onPress: () => console.log("Shona selected") },
                { text: "Ndebele", onPress: () => console.log("Ndebele selected") },
                { text: "Cancel", style: "cancel" }
            ]
        );
    };

    const menuItems = [
        {
            icon: 'shopping-cart', // Changed icon to distinguish
            label: isVendor ? 'Vendor Portal' : 'Sell on ZimAIo',
            action: handleVendorAction,
            color: colors.primary, // Highlight this button
            special: true
        },
        {
            icon: 'search',
            label: 'Track Order',
            action: () => router.push('/profile/track-order')
        },
        {
            icon: 'shopping-bag',
            label: 'My Orders',
            action: () => session ? router.push('/orders') : Alert.alert("Login Required", "Please login to view orders.")
        },
        {
            icon: 'dollar',
            label: 'My Wallet',
            action: () => session ? router.push('/profile/wallet') : Alert.alert("Login Required", "Please login to access wallet.")
        },
        {
            icon: 'paint-brush',
            label: `Change Theme (${theme === 'dark' ? 'Dark' : 'Light'})`,
            action: toggleTheme
        },
        {
            icon: 'language',
            label: 'Change Language',
            action: handleLanguage
        },
        {
            icon: 'info-circle',
            label: 'About Us',
            action: () => router.push('/profile/about')
        },
        {
            icon: 'phone',
            label: 'Contact Us',
            action: () => router.push('/profile/contact')
        },
        {
            icon: 'question-circle',
            label: 'Faqs',
            action: () => router.push('/profile/faq')
        },
        { icon: 'shield', label: 'Privacy Policy', action: () => router.push('/profile/privacy') },
        { icon: 'file-text-o', label: 'Term & Conditions', action: () => router.push('/profile/terms') },
        { icon: 'truck', label: 'Shipping Policy', action: () => router.push('/profile/shipping') },
        { icon: 'undo', label: 'Return Policy', action: () => router.push('/profile/return') },
    ];

    if (session) {
        menuItems.push({
            icon: 'sign-out',
            label: 'Logout',
            action: confirmLogout,
            color: colors.danger // Optional custom prop if I handle it
        } as any);
    }

    return (
        <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.contentContainer}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: colors.background }]}>
                <View style={[styles.avatarContainer, { backgroundColor: colors.card, borderColor: colors.text }]}>
                    <FontAwesome name="user" size={40} color={colors.text} />
                </View>
                <View style={[styles.headerTextContainer, { backgroundColor: 'transparent' }]}>
                    {session ? (
                        <>
                            <Text style={[styles.greeting, { color: colors.text }]}>Hello, {session.user.identities?.[0]?.identity_data?.full_name || 'User'}</Text>
                            <Text style={{ color: colors.textSecondary }}>{session.user.email}</Text>
                        </>
                    ) : (
                        <>
                            <Text style={[styles.greeting, { color: colors.text }]}>Hello, Guest</Text>
                            <TouchableOpacity onPress={() => router.push('/login')}>
                                <Text style={[styles.loginLink, { color: colors.danger }]}>Login/Register</Text>
                            </TouchableOpacity>
                        </>
                    )}
                </View>
            </View>

            {/* Menu Items */}
            <View style={[styles.menuContainer, { backgroundColor: 'transparent' }]}>
                {menuItems.map((item, index) => (
                    <TouchableOpacity
                        key={index}
                        style={[styles.menuItem, { backgroundColor: colors.card, shadowColor: colors.text }]}
                        onPress={item.action}
                    >
                        <View style={[styles.menuItemLeft, { backgroundColor: 'transparent' }]}>
                            <View style={[styles.iconContainer, { backgroundColor: 'transparent' }]}>
                                <FontAwesome name={item.icon as any} size={20} color={(item as any).color || colors.danger} />
                            </View>
                            <Text style={[styles.menuItemLabel, { color: (item as any).color || colors.text }]}>{item.label}</Text>
                        </View>
                        <FontAwesome name="angle-right" size={20} color={colors.textSecondary} />
                    </TouchableOpacity>
                ))}
            </View>

            {/* Version / Footer placeholder */}
            <View style={[styles.footer, { backgroundColor: 'transparent' }]}>
                <Text style={[styles.versionText, { color: colors.textSecondary }]}>App Version 1.0.0</Text>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    contentContainer: {
        paddingBottom: 40,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 24,
        paddingTop: 60,
    },
    avatarContainer: {
        width: 70,
        height: 70,
        borderRadius: 35,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        marginRight: 16,
    },
    headerTextContainer: {
        flex: 1,
    },
    greeting: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    loginLink: {
        fontSize: 16,
        fontWeight: '500',
        textDecorationLine: 'underline',
    },
    menuContainer: {
        paddingHorizontal: 16,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderRadius: 12,
        marginBottom: 12,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    menuItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        width: 32,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    menuItemLabel: {
        fontSize: 16,
        fontWeight: '600',
    },
    footer: {
        alignItems: 'center',
        paddingVertical: 20,
    },
    versionText: {
        fontSize: 12,
    },
});
