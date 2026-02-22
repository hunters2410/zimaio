import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Stack } from 'expo-router';

export default function DBTestScreen() {
    const [testing, setTesting] = useState(false);
    const [result, setResult] = useState<string>('');

    const testConnection = async () => {
        setTesting(true);
        setResult('Testing connection...');

        try {
            console.log('Starting DB test...');

            // Test 1: Simple query
            const { data, error, status } = await supabase
                .from('shipping_methods')
                .select('*')
                .limit(1);

            console.log('Query result:', { data, error, status });

            if (error) {
                setResult(`❌ Error: ${error.message}\nCode: ${error.code}\nDetails: ${error.details || 'N/A'}`);
            } else {
                setResult(`✅ Connection successful!\nFound ${data?.length || 0} records\nStatus: ${status}`);
            }
        } catch (err: any) {
            console.error('Test error:', err);
            setResult(`❌ Exception: ${err.message || JSON.stringify(err)}`);
        } finally {
            setTesting(false);
        }
    };

    const testAuth = async () => {
        setTesting(true);
        setResult('Testing auth...');

        try {
            const { data: { session }, error } = await supabase.auth.getSession();

            if (error) {
                setResult(`❌ Auth Error: ${error.message}`);
            } else if (session) {
                setResult(`✅ User logged in: ${session.user.email}`);
            } else {
                setResult(`ℹ️ No active session`);
            }
        } catch (err: any) {
            setResult(`❌ Exception: ${err.message}`);
        } finally {
            setTesting(false);
        }
    };

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ title: 'Database Test' }} />

            <Text style={styles.title}>Supabase Connection Test</Text>
            <Text style={styles.subtitle}>URL: https://mnkncdqalkamhmtfcykm.supabase.co</Text>

            <TouchableOpacity
                style={styles.button}
                onPress={testConnection}
                disabled={testing}
            >
                <Text style={styles.buttonText}>Test Database Connection</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.button, styles.secondaryButton]}
                onPress={testAuth}
                disabled={testing}
            >
                <Text style={styles.buttonText}>Test Auth Session</Text>
            </TouchableOpacity>

            {testing && (
                <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 20 }} />
            )}

            {result && (
                <View style={styles.resultBox}>
                    <Text style={styles.resultText}>{result}</Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#fff',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 10,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 12,
        color: '#666',
        marginBottom: 30,
        textAlign: 'center',
    },
    button: {
        backgroundColor: '#007AFF',
        padding: 15,
        borderRadius: 8,
        marginBottom: 15,
    },
    secondaryButton: {
        backgroundColor: '#34C759',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    resultBox: {
        marginTop: 20,
        padding: 15,
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    resultText: {
        fontSize: 14,
        fontFamily: 'monospace',
    },
});
