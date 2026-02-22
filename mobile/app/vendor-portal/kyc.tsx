import { useState, useEffect } from 'react';
import { StyleSheet, Alert, TouchableOpacity, ScrollView, Image, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Text, View } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';
import { supabase } from '@/lib/supabase';
import * as DocumentPicker from 'expo-document-picker';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function VendorKYCScreen() {
    const { theme } = useTheme();
    const colors = Colors[theme];
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [kycData, setKycData] = useState<any>(null);
    const [status, setStatus] = useState<'none' | 'pending' | 'approved' | 'rejected'>('none');
    const [existingDocs, setExistingDocs] = useState<any[]>([]);

    useEffect(() => {
        fetchKYCStatus();
    }, []);

    const fetchKYCStatus = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        try {
            const { data } = await supabase
                .from('vendor_profiles')
                .select('kyc_status, kyc_details')
                .eq('user_id', user.id)
                .maybeSingle();

            if (data) {
                setStatus(data.kyc_status as any || 'none');
                setKycData(data.kyc_details);
                setExistingDocs(data.kyc_details?.documents || []);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const pickDocument = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['image/*', 'application/pdf'],
                copyToCacheDirectory: true
            });

            if (result.canceled) return;

            const file = result.assets[0];
            uploadDocument(file);
        } catch (error) {
            Alert.alert('Error', 'Failed to pick document');
        }
    };

    const uploadDocument = async (file: any) => {
        try {
            setSubmitting(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: vendor } = await supabase
                .from('vendor_profiles')
                .select('id')
                .eq('user_id', user.id)
                .single();

            if (!vendor) throw new Error('Vendor profile not found');

            const fileName = `${vendor.id}/${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
            const filePath = `kyc/${fileName}`;

            // Read file content
            const response = await fetch(file.uri);
            const blob = await response.blob();
            // Or ArrayBuffer if needed, standard supabase-js works with Blob in RN usually

            const { error: uploadError } = await supabase.storage
                .from('shop-assets')
                .upload(filePath, blob as any);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('shop-assets')
                .getPublicUrl(filePath);

            const newDoc = {
                name: file.name,
                url: publicUrl,
                path: filePath,
                type: file.mimeType,
                size: file.size,
                submitted_at: new Date().toISOString()
            };

            const updatedDocs = [...existingDocs, newDoc];
            setExistingDocs(updatedDocs);

            // Update profile with intermediate doc list? 
            // The web app waits for "Submit" button to update `kyc_details`.
            // But here we might want to just keep local state until "Submit All".

        } catch (error: any) {
            Alert.alert('Upload Error', error.message);
        } finally {
            setSubmitting(false);
        }
    };

    const removeDoc = (index: number) => {
        setExistingDocs(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmitKYC = async () => {
        if (existingDocs.length === 0) {
            Alert.alert('Error', 'Please upload at least one document (ID, Business Reg, etc.)');
            return;
        }

        setSubmitting(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const details = {
                // For simplicity in mobile, we aren't asking for detailed text fields yet, 
                // but the web app does (full_name, id_number etc).
                // Let's assume user profile has name.
                // We'll just submit documents for now as "General Submission".
                submitted_at: new Date().toISOString(),
                documents: existingDocs,
                storage_path: existingDocs[0]?.path ? existingDocs[0].path.split('/').slice(0, -1).join('/') : 'kyc'
            };

            const { error } = await supabase
                .from('vendor_profiles')
                .update({
                    kyc_status: 'pending',
                    kyc_details: details
                })
                .eq('user_id', user.id);

            if (error) throw error;

            setStatus('pending');
            Alert.alert('Success', 'KYC Documents submitted for review!');
            router.back();

        } catch (error: any) {
            Alert.alert('Error', error.message);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return (
        <View style={styles.center}><ActivityIndicator color={colors.primary} /></View>
    );

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
            <ScrollView contentContainerStyle={{ padding: 20 }}>
                <View style={styles.header}>
                    <Text style={[styles.title, { color: colors.text }]}>KYC Verification</Text>
                    <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                        {status === 'pending' ? 'Your documents are under review.' :
                            status === 'approved' ? 'Your identity is verified.' :
                                'Upload documents to verify your business.'}
                    </Text>
                    <View style={[styles.statusBadge, {
                        backgroundColor: status === 'approved' ? colors.success + '20' :
                            status === 'pending' ? colors.primary + '20' : colors.danger + '20'
                    }]}>
                        <Text style={{
                            color: status === 'approved' ? colors.success :
                                status === 'pending' ? colors.primary : colors.danger,
                            fontWeight: 'bold', textTransform: 'uppercase'
                        }}>{status}</Text>
                    </View>
                </View>

                {status !== 'approved' && status !== 'pending' && (
                    <View style={styles.uploadSection}>
                        <TouchableOpacity onPress={pickDocument} style={[styles.uploadBtn, { borderColor: colors.border, backgroundColor: colors.card }]}>
                            <FontAwesome name="cloud-upload" size={30} color={colors.primary} />
                            <Text style={[{ color: colors.text, marginTop: 10, fontWeight: 'bold' }]}>Select Document</Text>
                            <Text style={{ color: colors.textSecondary, fontSize: 12 }}>ID, Passport, Business Reg</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {existingDocs.length > 0 && (
                    <View style={styles.docsList}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Uploaded Documents</Text>
                        {existingDocs.map((doc, index) => (
                            <View key={index} style={[styles.docItem, { backgroundColor: colors.card }]}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                                    <FontAwesome name="file-text-o" size={20} color={colors.primary} style={{ marginRight: 10 }} />
                                    <View style={{ flex: 1 }}>
                                        <Text style={{ color: colors.text, fontWeight: 'bold' }} numberOfLines={1}>{doc.name}</Text>
                                        <Text style={{ color: colors.textSecondary, fontSize: 10 }}>{(doc.size / 1024).toFixed(1)} KB</Text>
                                    </View>
                                </View>
                                {status === 'none' || status === 'rejected' ? (
                                    <TouchableOpacity onPress={() => removeDoc(index)}>
                                        <FontAwesome name="trash-o" size={20} color={colors.danger} />
                                    </TouchableOpacity>
                                ) : (
                                    <FontAwesome name="check-circle" size={20} color={colors.success} />
                                )}
                            </View>
                        ))}
                    </View>
                )}

                {(status === 'none' || status === 'rejected') && existingDocs.length > 0 && (
                    <TouchableOpacity
                        style={[styles.button, { backgroundColor: colors.primary }]}
                        onPress={handleSubmitKYC}
                        disabled={submitting}
                    >
                        {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Submit Verification</Text>}
                    </TouchableOpacity>
                )}

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { marginBottom: 30, alignItems: 'center' },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
    subtitle: { textAlign: 'center', fontSize: 14, marginBottom: 12 },
    statusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
    uploadSection: { marginBottom: 30 },
    uploadBtn: {
        borderWidth: 2, borderStyle: 'dashed', borderRadius: 20,
        height: 150, justifyContent: 'center', alignItems: 'center'
    },
    docsList: { marginBottom: 30 },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 10 },
    docItem: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        padding: 12, borderRadius: 12, marginBottom: 8
    },
    button: {
        padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 10
    },
    buttonText: {
        color: '#fff', fontSize: 16, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1
    },
});
