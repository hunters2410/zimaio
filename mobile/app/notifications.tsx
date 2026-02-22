import { StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Text, View } from '@/components/Themed';
import { useState, useEffect } from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useTheme } from '@/contexts/ThemeContext';
import Colors from '@/constants/Colors';
import { supabase } from '@/lib/supabase';

interface Notification {
    id: string;
    user_id: string;
    type: 'info' | 'success' | 'warning' | 'error';
    title: string;
    message: string;
    data?: any;
    is_read: boolean;
    created_at: string;
}

export default function NotificationsScreen() {
    const { theme } = useTheme();
    const colors = Colors[theme];
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [userId, setUserId] = useState<string | null>(null);

    useEffect(() => {
        fetchUserAndNotifications();
    }, []);

    const fetchUserAndNotifications = async () => {
        try {
            // Get current user
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                setLoading(false);
                return;
            }

            setUserId(user.id);

            // Fetch notifications for this user
            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;

            setNotifications(data || []);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (id: string) => {
        try {
            // Update in database
            await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('id', id);

            // Update local state
            setNotifications(prev =>
                prev.map(n => n.id === id ? { ...n, is_read: true } : n)
            );
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInMs = now.getTime() - date.getTime();
        const diffInMins = Math.floor(diffInMs / 60000);
        const diffInHours = Math.floor(diffInMs / 3600000);
        const diffInDays = Math.floor(diffInMs / 86400000);

        if (diffInMins < 1) return 'Just now';
        if (diffInMins < 60) return `${diffInMins}m ago`;
        if (diffInHours < 24) return `${diffInHours}h ago`;
        if (diffInDays < 7) return `${diffInDays}d ago`;
        return date.toLocaleDateString();
    };

    const getIconName = (type: string): any => {
        switch (type) {
            case 'success': return 'check-circle';
            case 'warning': return 'exclamation-triangle';
            case 'error': return 'times-circle';
            default: return 'bell';
        }
    };

    const getIconColor = (type: string, isRead: boolean) => {
        if (isRead) return colors.textSecondary;

        switch (type) {
            case 'success': return '#10b981';
            case 'warning': return '#f59e0b';
            case 'error': return '#ef4444';
            default: return colors.primary;
        }
    };

    const renderItem = ({ item }: { item: Notification }) => (
        <TouchableOpacity
            style={[
                styles.item,
                { backgroundColor: colors.card, shadowColor: colors.text },
                !item.is_read && {
                    backgroundColor: theme === 'dark' ? 'rgba(34, 197, 94, 0.1)' : '#f0fdf4',
                    borderLeftWidth: 4,
                    borderLeftColor: getIconColor(item.type, false)
                }
            ]}
            onPress={() => !item.is_read && markAsRead(item.id)}
        >
            <View style={[styles.iconContainer, { backgroundColor: colors.background }]}>
                <FontAwesome
                    name={getIconName(item.type)}
                    size={20}
                    color={getIconColor(item.type, item.is_read)}
                />
            </View>
            <View style={styles.content}>
                <View style={styles.header}>
                    <Text style={[
                        styles.title,
                        { color: colors.text },
                        !item.is_read && { color: colors.primary, fontWeight: '700' }
                    ]}>
                        {item.title}
                    </Text>
                    <Text style={[styles.date, { color: colors.textSecondary }]}>
                        {formatDate(item.created_at)}
                    </Text>
                </View>
                <Text style={[styles.message, { color: colors.textSecondary }]} numberOfLines={2}>
                    {item.message}
                </Text>
            </View>
            {!item.is_read && <View style={[styles.dot, { backgroundColor: getIconColor(item.type, false) }]} />}
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                        Loading notifications...
                    </Text>
                </View>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <FlatList
                data={notifications}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.list}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <FontAwesome name="bell-slash" size={40} color={colors.textSecondary} />
                        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                            {userId ? 'No notifications yet' : 'Sign in to see notifications'}
                        </Text>
                        {!userId && (
                            <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
                                Please log in to view your notifications
                            </Text>
                        )}
                    </View>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10,
    },
    loadingText: {
        fontSize: 14,
        fontWeight: '600',
    },
    list: {
        padding: 16,
    },
    item: {
        flexDirection: 'row',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        alignItems: 'center',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    iconContainer: {
        marginRight: 16,
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    content: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
        flex: 1,
    },
    date: {
        fontSize: 12,
        marginLeft: 8,
    },
    message: {
        fontSize: 14,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginLeft: 8,
    },
    empty: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 100,
    },
    emptyText: {
        marginTop: 16,
        fontSize: 16,
        fontWeight: '600',
    },
    emptySubtext: {
        marginTop: 8,
        fontSize: 14,
    },
});
