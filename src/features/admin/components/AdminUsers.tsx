import React, { useEffect, useMemo, useState } from 'react';
import {
    Alert,
    ActivityIndicator,
    FlatList,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    useWindowDimensions,
    View,
} from 'react-native';
import { Colors } from '../../../core/theme/Colors';
import { MaterialIcons } from '@expo/vector-icons';
import { apiClient } from '../../../core/api/apiClient';

type UserData = {
    id: string;
    name: string;
    username: string;
};

export default function AdminUsers() {
    const { width } = useWindowDimensions();
    const isWide = width >= 1180;

    const [users, setUsers] = useState<UserData[]>([]);
    const [name, setName] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [search, setSearch] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [statusMessage, setStatusMessage] = useState('');
    const [statusType, setStatusType] = useState<'success' | 'error' | ''>('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            const response = await apiClient.get('/api/admin/users');
            const apiUsers = (response.data?.users ?? []) as Array<Record<string, unknown>>;
            const normalizedUsers = apiUsers
                .filter((entry) => String(entry.username ?? '').toLowerCase() !== 'admin')
                .map((entry) => ({
                    id: String(entry._id ?? ''),
                    name: String(entry.name ?? 'Unknown User'),
                    username: String(entry.username ?? '').toLowerCase(),
                }))
                .filter((entry) => entry.id && entry.username);
            setUsers(normalizedUsers);
        } catch (error: any) {
            const message = error?.response?.data?.error || 'Failed to load users from server.';
            setStatusType('error');
            setStatusMessage(message);
        }
    };

    const resetForm = () => {
        setName('');
        setUsername('');
        setPassword('');
        setEditingId(null);
    };

    const handleSaveUser = async () => {
        const trimmedName = name.trim();
        const trimmedUsername = username.trim().toLowerCase();

        if (!trimmedName || !trimmedUsername) {
            Alert.alert('Error', 'Name and username are required.');
            return;
        }
        if (trimmedUsername === 'admin') {
            Alert.alert('Reserved username', 'The username "admin" is reserved for the system administrator.');
            return;
        }
        if (trimmedUsername.length < 4) {
            Alert.alert('Invalid username', 'Username must be at least 4 characters.');
            return;
        }
        if (!editingId && password.trim().length < 6) {
            Alert.alert('Invalid password', 'Password must be at least 6 characters for new users.');
            return;
        }

        try {
            setIsSubmitting(true);
            setStatusMessage('');
            if (editingId) {
                const updatePayload: Record<string, string> = {
                    name: trimmedName,
                    username: trimmedUsername,
                };
                if (password.trim()) {
                    updatePayload.password = password.trim();
                }
                await apiClient.put(`/api/admin/users/${editingId}`, updatePayload);
            } else {
                await apiClient.post('/api/admin/create_user', {
                    name: trimmedName,
                    username: trimmedUsername,
                    password: password.trim(),
                });
            }
            await loadUsers();
            resetForm();
            setStatusType('success');
            setStatusMessage(editingId ? 'User updated successfully.' : 'User created successfully.');
        } catch (error: any) {
            const message = error?.response?.data?.error || 'Failed to save user account.';
            setStatusType('error');
            setStatusMessage(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEdit = (user: UserData) => {
        setEditingId(user.id);
        setName(user.name);
        setUsername(user.username);
        setPassword('');
    };

    const handleDelete = (id: string) => {
        const deleteUser = async () => {
            try {
                setIsSubmitting(true);
                setStatusMessage('');
                await apiClient.delete(`/api/admin/users/${id}`);
                await loadUsers();
                if (editingId === id) resetForm();
                setStatusType('success');
                setStatusMessage('User deleted successfully.');
            } catch (error: any) {
                const message = error?.response?.data?.error || 'Failed to delete user.';
                setStatusType('error');
                setStatusMessage(message);
            } finally {
                setIsSubmitting(false);
            }
        };

        if (typeof window !== 'undefined' && Platform.OS === 'web') {
            if (window.confirm('Delete this user? This action cannot be undone.')) {
                void deleteUser();
            }
            return;
        }

        Alert.alert('Delete user', 'This action cannot be undone.', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: () => void deleteUser() },
        ]);
    };

    const filteredUsers = useMemo(() => {
        const query = search.trim().toLowerCase();
        if (!query) return users;
        return users.filter(
            (u) => u.name.toLowerCase().includes(query) || u.username.toLowerCase().includes(query)
        );
    }, [search, users]);

    const renderUser = ({ item }: { item: UserData }) => (
        <View style={styles.userCard}>
            <View style={styles.userAvatar}>
                <Text style={styles.userAvatarText}>{item.name.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={styles.userInfo}>
                <Text style={styles.userName}>{item.name}</Text>
                <Text style={styles.userUsername}>@{item.username}</Text>
            </View>
            <View style={styles.userActions}>
                <TouchableOpacity onPress={() => handleEdit(item)} style={styles.actionButton}>
                    <MaterialIcons name="edit" size={18} color={Colors.primaryDark} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(item.id)} style={[styles.actionButton, styles.actionButtonDelete]}>
                    <MaterialIcons name="delete" size={18} color={Colors.statusCritical} />
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
        >
            <View style={styles.headerRow}>
                <View style={styles.headerText}>
                    <Text style={styles.title}>User Management</Text>
                    <Text style={styles.subtitle}>Create, edit, and remove client user accounts.</Text>
                </View>
                <View style={styles.countBadge}>
                    <Text style={styles.countBadgeText}>{users.length} accounts</Text>
                </View>
            </View>

            {!!statusMessage && (
                <View style={[styles.statusBanner, statusType === 'error' ? styles.errorBanner : styles.successBanner]}>
                    <MaterialIcons
                        name={statusType === 'error' ? 'error-outline' : 'check-circle-outline'}
                        size={16}
                        color={statusType === 'error' ? '#c0392b' : '#27ae60'}
                    />
                    <Text style={styles.statusText}>{statusMessage}</Text>
                </View>
            )}

            <View style={[styles.mainGrid, isWide && styles.mainGridWide]}>
                {/* Form Panel */}
                <View style={[styles.formPanel, isWide && styles.formPanelWide]}>
                    <Text style={styles.sectionLabel}>User Provisioning</Text>
                    <Text style={styles.panelTitle}>{editingId ? 'Edit User Profile' : 'Create New Account'}</Text>

                    <Text style={styles.fieldLabel}>Full Name</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g. Juan dela Cruz"
                        value={name}
                        onChangeText={setName}
                    />
                    <Text style={styles.fieldLabel}>Username</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Min. 4 characters, no spaces"
                        value={username}
                        onChangeText={setUsername}
                        autoCapitalize="none"
                    />
                    <Text style={styles.fieldLabel}>{editingId ? 'New Password (optional)' : 'Password'}</Text>
                    <TextInput
                        style={styles.input}
                        placeholder={editingId ? 'Leave blank to keep current' : 'Min. 6 characters'}
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                    />

                    <View style={styles.formActions}>
                        {editingId && (
                            <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={resetForm}>
                                <Text style={styles.buttonText}>Cancel</Text>
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity
                            style={[styles.button, isSubmitting && styles.buttonDisabled]}
                            onPress={handleSaveUser}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <ActivityIndicator color={Colors.textOnDark} />
                            ) : (
                                <View style={styles.buttonInner}>
                                    <MaterialIcons
                                        name={editingId ? 'save' : 'person-add'}
                                        size={16}
                                        color={Colors.textOnDark}
                                    />
                                    <Text style={styles.buttonText}>{editingId ? 'Save Changes' : 'Create User'}</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>

                {/* List Panel */}
                <View style={styles.listPanel}>
                    <View style={styles.listHeader}>
                        <Text style={styles.sectionLabel}>Directory</Text>
                        <Text style={styles.panelTitle}>Registered Users</Text>
                        <Text style={styles.listMeta}>{filteredUsers.length} of {users.length} account(s)</Text>
                        <View style={styles.searchContainer}>
                            <MaterialIcons name="search" size={16} color={Colors.textMuted} />
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Search by name or username"
                                placeholderTextColor={Colors.textMuted}
                                value={search}
                                onChangeText={setSearch}
                            />
                        </View>
                    </View>

                    <FlatList
                        data={filteredUsers}
                        keyExtractor={(item) => item.id}
                        renderItem={renderUser}
                        contentContainerStyle={styles.listContainer}
                        scrollEnabled={false}
                        nestedScrollEnabled
                        ListEmptyComponent={
                            <View style={styles.emptyState}>
                                <MaterialIcons name="people-outline" size={32} color={Colors.textMuted} />
                                <Text style={styles.emptyText}>No users found.</Text>
                            </View>
                        }
                    />
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.transparent,
    },
    scrollContent: {
        paddingBottom: 28,
        gap: 14,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    headerText: {
        flex: 1,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: Colors.textPrimary,
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
        color: Colors.textSecondary,
    },
    countBadge: {
        backgroundColor: Colors.bgMuted,
        borderWidth: 1,
        borderColor: Colors.borderLight,
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 6,
        marginTop: 4,
    },
    countBadgeText: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.primaryDark,
    },
    statusBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        borderRadius: 10,
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderWidth: 1,
    },
    errorBanner: {
        backgroundColor: '#FDECEC',
        borderColor: '#F5B5B5',
    },
    successBanner: {
        backgroundColor: '#EAF8EE',
        borderColor: '#B7DFC2',
    },
    statusText: {
        fontSize: 13,
        color: Colors.textPrimary,
        fontWeight: '600',
        flex: 1,
    },
    mainGrid: {
        gap: 14,
    },
    mainGridWide: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    formPanel: {
        backgroundColor: Colors.bgCard,
        padding: 20,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: Colors.borderLight,
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
    },
    formPanelWide: {
        width: 380,
    },
    sectionLabel: {
        fontSize: 11,
        textTransform: 'uppercase',
        letterSpacing: 0.6,
        color: Colors.textMuted,
        marginBottom: 4,
    },
    panelTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: Colors.textPrimary,
        marginBottom: 16,
    },
    fieldLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.textSecondary,
        marginBottom: 6,
    },
    input: {
        borderWidth: 1,
        borderColor: Colors.borderMuted,
        borderRadius: 10,
        padding: 11,
        marginBottom: 14,
        fontSize: 14,
        backgroundColor: Colors.bgBase,
        color: Colors.textPrimary,
    },
    formActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 10,
        marginTop: 4,
    },
    button: {
        backgroundColor: Colors.primaryDark,
        paddingHorizontal: 18,
        paddingVertical: 11,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonDisabled: {
        backgroundColor: Colors.textMuted,
    },
    cancelButton: {
        backgroundColor: Colors.textMuted,
    },
    buttonInner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    buttonText: {
        color: Colors.textOnDark,
        fontWeight: '700',
        fontSize: 14,
    },
    listPanel: {
        flex: 1,
        minHeight: 200,
        backgroundColor: Colors.bgCard,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: Colors.borderLight,
        padding: 16,
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 2,
    },
    listHeader: {
        marginBottom: 12,
    },
    listMeta: {
        fontSize: 12,
        color: Colors.textSecondary,
        marginBottom: 10,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        borderWidth: 1,
        borderColor: Colors.borderMuted,
        borderRadius: 10,
        paddingHorizontal: 10,
        paddingVertical: 9,
        backgroundColor: Colors.bgBase,
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        color: Colors.textPrimary,
    },
    listContainer: {
        paddingBottom: 8,
        gap: 8,
    },
    userCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.bgBase,
        padding: 12,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: Colors.borderLight,
        gap: 12,
    },
    userAvatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: Colors.bgMuted,
        borderWidth: 1,
        borderColor: Colors.borderLight,
        alignItems: 'center',
        justifyContent: 'center',
    },
    userAvatarText: {
        fontSize: 15,
        fontWeight: '700',
        color: Colors.primaryDark,
    },
    userInfo: {
        flex: 1,
    },
    userName: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.textPrimary,
    },
    userUsername: {
        fontSize: 12,
        color: Colors.textSecondary,
    },
    userActions: {
        flexDirection: 'row',
        gap: 4,
    },
    actionButton: {
        padding: 7,
        borderRadius: 8,
        backgroundColor: Colors.bgMuted,
    },
    actionButtonDelete: {
        backgroundColor: '#FDECEC',
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 32,
        gap: 8,
    },
    emptyText: {
        fontSize: 14,
        color: Colors.textSecondary,
    },
});
