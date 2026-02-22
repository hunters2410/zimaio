import { useState, useEffect } from 'react';
import { StyleSheet, Alert, TextInput, TouchableOpacity, ScrollView, Image, ActivityIndicator, Modal, Linking } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Text, View } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';
import { supabase } from '@/lib/supabase';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function RegisterVendorScreen() {
    const { theme } = useTheme();
    const colors = Colors[theme];
    const router = useRouter();

    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    // Package Selection
    const [packages, setPackages] = useState<any[]>([]);
    const [selectedPackage, setSelectedPackage] = useState<string>('');
    const [showPackageModal, setShowPackageModal] = useState(false);

    // Terms
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
    const [contracts, setContracts] = useState<any[]>([]);

    // Legal Modal
    const [showLegalModal, setShowLegalModal] = useState(false);
    const [legalTitle, setLegalTitle] = useState('');
    const [legalContent, setLegalContent] = useState('');
    const [legalLoading, setLegalLoading] = useState(false);

    useEffect(() => {
        fetchPackages();
        fetchContracts();
    }, []);

    const fetchPackages = async () => {
        try {
            const { data, error } = await supabase
                .from('vendor_packages')
                .select('*')
                .eq('is_active', true)
                .order('sort_order', { ascending: true });

            if (data) {
                setPackages(data);
                const defaultPkg = data.find(p => p.is_default);
                if (defaultPkg) setSelectedPackage(defaultPkg.id);
            }
        } catch (error) {
            console.error('Packages error:', error);
        }
    };

    const fetchContracts = async () => {
        try {
            const { data } = await supabase
                .from('contracts')
                .select('*')
                .in('contract_type', ['vendor_terms', 'vendor_privacy'])
                .eq('is_active', true);
            if (data) setContracts(data);
        } catch (error) {
            console.error('Contracts error:', error);
        }
    };

    const openLegalModal = (type: 'vendor_terms' | 'vendor_privacy', title: string) => {
        setLegalTitle(title);
        const contract = contracts.find(c => c.contract_type === type);
        setLegalContent(contract?.content || 'Protocol content not available.');
        setShowLegalModal(true);
    };

    const handleRegister = async () => {
        if (!fullName || !email || !password) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        if (!selectedPackage) {
            Alert.alert('Error', 'Please select a vendor package');
            return;
        }

        if (!acceptedTerms || !acceptedPrivacy) {
            Alert.alert('Error', 'Please accept the Terms and Privacy Policy');
            return;
        }

        setLoading(true);
        try {
            // 1. Sign Up User
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: fullName,
                        role: 'vendor'
                    }
                }
            });

            if (authError) throw authError;

            if (authData.user) {
                // 2. Create Profile record (Critical for role-based features and login)
                const { error: profileError } = await supabase.from('profiles').upsert({
                    id: authData.user.id,
                    email: email,
                    full_name: fullName,
                    role: 'vendor',
                    is_verified: true,
                    is_active: true
                });

                if (profileError) console.error('Profile Creation Error:', profileError);

                // 3. Create Wallet record
                const { error: walletError } = await supabase.from('wallets').insert({
                    user_id: authData.user.id,
                    balance: 0
                });

                if (walletError) console.error('Wallet Creation Error:', walletError);

                // 4. Create Vendor Subscription
                const currentDate = new Date();
                const periodEnd = new Date(currentDate);
                periodEnd.setMonth(periodEnd.getMonth() + 1);

                const pkg = packages.find(p => p.id === selectedPackage);

                const { error: subError } = await supabase
                    .from('vendor_subscriptions')
                    .insert([{
                        vendor_id: authData.user.id,
                        package_id: selectedPackage,
                        status: pkg?.price_monthly === 0 ? 'active' : 'pending',
                        billing_cycle: 'monthly',
                        current_period_start: currentDate.toISOString(),
                        current_period_end: periodEnd.toISOString(),
                    }]);

                if (subError) console.error('Sub error:', subError);

                // 5. Create Vendor Profile
                const { error: vendorProfileError } = await supabase
                    .from('vendor_profiles')
                    .insert([{
                        user_id: authData.user.id,
                        shop_name: fullName + "'s Shop",
                        shop_description: '',
                        is_approved: true // Matching web app default for new vendors for now
                    }]);

                if (vendorProfileError) console.error('Vendor Profile Error:', vendorProfileError);

                if (authData.session) {
                    // Auto logged in
                    Alert.alert('Success', 'Account created! Let\'s set up your shop.', [
                        { text: 'Continue', onPress: () => router.replace('/vendor-portal/setup') }
                    ]);
                } else {
                    Alert.alert('Success', 'Account created! Please verify your email to activate your vendor account.', [
                        { text: 'Login', onPress: () => router.replace('/login') }
                    ]);
                }
            }
        } catch (error: any) {
            Alert.alert('Registration Failed', error.message);
        } finally {
            setLoading(false);
        }
    };

    const getSelectedPkgName = () => {
        const p = packages.find(pkg => pkg.id === selectedPackage);
        return p ? p.name : 'Select Package';
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
            <Stack.Screen options={{ headerLeft: () => null, title: 'Join ZimAIO' }} />
            <ScrollView contentContainerStyle={{ padding: 20 }}>
                {/* Header Section */}
                <View style={styles.header}>
                    <Text style={[styles.title, { color: colors.text }]}>Start Selling on ZimAIO</Text>
                    <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                        Join thousands of successful vendors and grow your business.
                    </Text>
                </View>

                {/* Benefits / "Why Sell" - simplified for mobile */}
                <View style={[styles.benefitsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={styles.benefitItem}>
                        <FontAwesome name="users" size={20} color="#0891b2" style={{ width: 30 }} />
                        <Text style={[styles.benefitText, { color: colors.text }]}>Reach Millions of Customers</Text>
                    </View>
                    <View style={styles.benefitItem}>
                        <FontAwesome name="line-chart" size={20} color="#0891b2" style={{ width: 30 }} />
                        <Text style={[styles.benefitText, { color: colors.text }]}>Grow Your Business</Text>
                    </View>
                    <View style={styles.benefitItem}>
                        <FontAwesome name="money" size={20} color="#0891b2" style={{ width: 30 }} />
                        <Text style={[styles.benefitText, { color: colors.text }]}>Flexible Payments</Text>
                    </View>
                </View>

                {/* Form */}
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Create Vendor Account</Text>

                <TextInput
                    style={[styles.input, { color: colors.text, backgroundColor: colors.inputBackground, borderColor: colors.border }]}
                    placeholder="Full Name"
                    placeholderTextColor={colors.textSecondary}
                    value={fullName}
                    onChangeText={setFullName}
                />

                <TextInput
                    style={[styles.input, { color: colors.text, backgroundColor: colors.inputBackground, borderColor: colors.border }]}
                    placeholder="Email Address"
                    placeholderTextColor={colors.textSecondary}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                />

                <TextInput
                    style={[styles.input, { color: colors.text, backgroundColor: colors.inputBackground, borderColor: colors.border }]}
                    placeholder="Password"
                    placeholderTextColor={colors.textSecondary}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                />

                {/* Package Select */}
                <TouchableOpacity
                    style={[styles.dropdown, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}
                    onPress={() => setShowPackageModal(true)}
                >
                    <Text style={{ color: colors.text }}>{getSelectedPkgName()}</Text>
                    <FontAwesome name="chevron-down" size={14} color={colors.textSecondary} />
                </TouchableOpacity>

                {/* Terms */}
                <View style={styles.checkboxContainer}>
                    <TouchableOpacity style={styles.checkboxRow} onPress={() => setAcceptedTerms(!acceptedTerms)}>
                        <FontAwesome name={acceptedTerms ? "check-square" : "square-o"} size={20} color={colors.primary} />
                        <Text style={[styles.checkboxText, { color: colors.textSecondary }]}>I agree to the </Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => openLegalModal('vendor_terms', 'Vendor Terms & Conditions')}>
                        <Text style={[styles.linkText, { color: colors.primary }]}>Vendor Terms & Conditions</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.checkboxContainer}>
                    <TouchableOpacity style={styles.checkboxRow} onPress={() => setAcceptedPrivacy(!acceptedPrivacy)}>
                        <FontAwesome name={acceptedPrivacy ? "check-square" : "square-o"} size={20} color={colors.primary} />
                        <Text style={[styles.checkboxText, { color: colors.textSecondary }]}>I accept the </Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => openLegalModal('vendor_privacy', 'Vendor Privacy Policy')}>
                        <Text style={[styles.linkText, { color: colors.primary }]}>Vendor Privacy Policy</Text>
                    </TouchableOpacity>
                </View>

                {/* Submit */}
                <TouchableOpacity
                    style={[styles.button, { backgroundColor: colors.primary, opacity: loading ? 0.7 : 1 }]}
                    onPress={handleRegister}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.buttonText}>Create Vendor Account</Text>
                    )}
                </TouchableOpacity>

                <TouchableOpacity onPress={() => router.push('/login')} style={{ marginTop: 20, alignItems: 'center' }}>
                    <Text style={{ color: colors.textSecondary }}>Already have an account? <Text style={{ color: colors.primary, fontWeight: 'bold' }}>Sign In</Text></Text>
                </TouchableOpacity>

            </ScrollView>

            {/* Package Selection Modal */}
            <Modal visible={showPackageModal} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>Select Package</Text>
                        <ScrollView>
                            {packages.map(pkg => (
                                <TouchableOpacity
                                    key={pkg.id}
                                    style={[
                                        styles.pkgItem,
                                        { backgroundColor: selectedPackage === pkg.id ? colors.primary + '20' : 'transparent' }
                                    ]}
                                    onPress={() => {
                                        setSelectedPackage(pkg.id);
                                        setShowPackageModal(false);
                                    }}
                                >
                                    <View style={{ flex: 1 }}>
                                        <Text style={[styles.pkgName, { color: colors.text }]}>{pkg.name}</Text>
                                        <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                                            {pkg.product_limit > 1000 ? 'Unlimited' : pkg.product_limit} products • {pkg.price_monthly === 0 ? 'Free' : `$${pkg.price_monthly}/mo`}
                                        </Text>
                                    </View>
                                    {selectedPackage === pkg.id && <FontAwesome name="check" size={16} color={colors.primary} />}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                        <TouchableOpacity
                            style={[styles.closeBtn, { backgroundColor: colors.border }]}
                            onPress={() => setShowPackageModal(false)}
                        >
                            <Text style={{ color: colors.text }}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Legal Modal */}
            <Modal visible={showLegalModal} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.card, height: '85%' }]}>
                        <View style={styles.modalHeader}>
                            <View style={styles.legalIconHeader}>
                                <FontAwesome name="file-text" size={20} color={colors.primary} />
                                <Text style={[styles.modalTitle, { color: colors.text, marginLeft: 12, marginBottom: 0 }]}>{legalTitle}</Text>
                            </View>
                            <TouchableOpacity onPress={() => setShowLegalModal(false)}>
                                <FontAwesome name="close" size={20} color={colors.textSecondary} />
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={styles.legalContentScroll} showsVerticalScrollIndicator={false}>
                            <Text style={[styles.legalContentText, { color: colors.text }]}>
                                {legalContent}
                            </Text>
                        </ScrollView>
                        <TouchableOpacity
                            style={[styles.closeBtn, { backgroundColor: colors.primary }]}
                            onPress={() => setShowLegalModal(false)}
                        >
                            <Text style={{ color: '#fff', fontWeight: 'bold' }}>Close Document</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    header: {
        marginBottom: 24,
        alignItems: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        textAlign: 'center',
        fontSize: 14,
        paddingHorizontal: 20,
    },
    benefitsCard: {
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 24,
    },
    benefitItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    benefitText: {
        fontWeight: '600',
        fontSize: 14,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    input: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 14,
        fontSize: 16,
        marginBottom: 16,
    },
    dropdown: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: 12,
        padding: 14,
        marginBottom: 20,
    },
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        marginBottom: 8,
    },
    checkboxRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    checkboxText: {
        marginLeft: 10,
        fontSize: 13,
    },
    linkText: {
        fontSize: 13,
        fontWeight: 'bold',
        textDecorationLine: 'underline',
    },
    button: {
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 10,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        maxHeight: '70%',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 16,
        textAlign: 'center',
    },
    pkgItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderRadius: 12,
        marginBottom: 8,
    },
    pkgName: {
        fontWeight: 'bold',
        fontSize: 16,
        marginBottom: 4,
    },
    closeBtn: {
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 16,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    legalIconHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    legalContentScroll: {
        flex: 1,
    },
    legalContentText: {
        fontSize: 14,
        lineHeight: 22,
        fontWeight: '500',
    }
});
