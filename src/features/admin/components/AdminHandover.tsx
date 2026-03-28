import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { Colors } from '../../../core/theme/Colors';
import { MaterialIcons } from '@expo/vector-icons';
import { apiClient } from '../../../core/api/apiClient';

type AdminAccount = {
    username: string;
    holderName: string;
};

export default function AdminHandover() {
    const [adminAccount, setAdminAccount] = useState<AdminAccount>({
        username: 'admin',
        holderName: 'Administrator',
    });
    const [adminHolderName, setAdminHolderName] = useState('');
    const [currentAdminPassword, setCurrentAdminPassword] = useState('');
    const [newAdminPassword, setNewAdminPassword] = useState('');
    const [confirmAdminPassword, setConfirmAdminPassword] = useState('');
    const [statusMessage, setStatusMessage] = useState('');
    const [statusType, setStatusType] = useState<'success' | 'error' | ''>('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        loadAdminAccount();
    }, []);

    const loadAdminAccount = async () => {
        try {
            const response = await apiClient.get('/api/admin/account');
            const account = response.data?.admin;
            if (!account) return;
            const normalized = {
                username: String(account.username ?? 'admin'),
                holderName: String(account.holder_name ?? 'Administrator'),
            };
            setAdminAccount(normalized);
            setAdminHolderName(normalized.holderName);
        } catch (error: any) {
            Alert.alert('Load error', error?.response?.data?.error || 'Failed to load admin account details.');
        }
    };

    const handleUpdateAdminAccount = async () => {
        const trimmedHolder = adminHolderName.trim();

        if (!currentAdminPassword || !newAdminPassword || !confirmAdminPassword) {
            Alert.alert('Missing fields', 'Please complete all password fields.');
            return;
        }
        if (newAdminPassword.length < 6) {
            Alert.alert('Weak password', 'New admin password must be at least 6 characters.');
            return;
        }
        if (newAdminPassword !== confirmAdminPassword) {
            Alert.alert('Mismatch', 'New password and confirmation do not match.');
            return;
        }
        if (!trimmedHolder) {
            Alert.alert('Missing name', 'Please enter the incoming administrator name.');
            return;
        }

        try {
            setIsSubmitting(true);
            setStatusMessage('');
            await apiClient.put('/api/admin/account', {
                current_password: currentAdminPassword,
                new_password: newAdminPassword,
                holder_name: trimmedHolder,
            });
            setCurrentAdminPassword('');
            setNewAdminPassword('');
            setConfirmAdminPassword('');
            await loadAdminAccount();
            setStatusType('success');
            setStatusMessage('Admin account updated and handed over successfully.');
            Alert.alert('Success', 'Admin account password has been changed and handed over.');
        } catch (error: any) {
            const message = error?.response?.data?.error || 'Failed to update admin account.';
            setStatusType('error');
            setStatusMessage(message);
            Alert.alert('Update failed', message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
        >
            <View style={styles.headerRow}>
                <Text style={styles.title}>Admin Account Handover</Text>
                <Text style={styles.subtitle}>
                    Transfer admin credentials when passing control to the next administrator.
                </Text>
            </View>

            <View style={styles.infoRow}>
                <View style={styles.infoCard}>
                    <View style={styles.infoIconWrap}>
                        <MaterialIcons name="admin-panel-settings" size={22} color={Colors.primaryDark} />
                    </View>
                    <View style={styles.infoBody}>
                        <Text style={styles.infoLabel}>Fixed Admin Username</Text>
                        <Text style={styles.infoValue}>{adminAccount.username}</Text>
                    </View>
                </View>
                <View style={styles.infoCard}>
                    <View style={styles.infoIconWrap}>
                        <MaterialIcons name="person-pin" size={22} color={Colors.primaryDark} />
                    </View>
                    <View style={styles.infoBody}>
                        <Text style={styles.infoLabel}>Current Admin Holder</Text>
                        <Text style={styles.infoValue}>{adminAccount.holderName}</Text>
                    </View>
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

            <View style={styles.formCard}>
                <Text style={styles.sectionLabel}>Handover Form</Text>
                <Text style={styles.cardTitle}>Update & Transfer Admin Access</Text>
                <Text style={styles.cardSubTitle}>
                    Complete all fields to perform the handover. The incoming administrator name will be recorded.
                </Text>

                <Text style={styles.fieldLabel}>Incoming Administrator Name</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Full name of the new admin holder"
                    value={adminHolderName}
                    onChangeText={setAdminHolderName}
                />

                <Text style={styles.fieldLabel}>Current Password</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Enter current admin password"
                    secureTextEntry
                    value={currentAdminPassword}
                    onChangeText={setCurrentAdminPassword}
                />

                <Text style={styles.fieldLabel}>New Password</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Minimum 6 characters"
                    secureTextEntry
                    value={newAdminPassword}
                    onChangeText={setNewAdminPassword}
                />

                <Text style={styles.fieldLabel}>Confirm New Password</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Re-enter new admin password"
                    secureTextEntry
                    value={confirmAdminPassword}
                    onChangeText={setConfirmAdminPassword}
                />

                <TouchableOpacity
                    style={[styles.button, isSubmitting && styles.buttonDisabled]}
                    onPress={handleUpdateAdminAccount}
                    disabled={isSubmitting}
                >
                    {isSubmitting ? (
                        <ActivityIndicator color={Colors.textOnDark} />
                    ) : (
                        <View style={styles.buttonInner}>
                            <MaterialIcons name="swap-horiz" size={18} color={Colors.textOnDark} />
                            <Text style={styles.buttonText}>Perform Handover</Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>

            <View style={styles.warningCard}>
                <MaterialIcons name="warning" size={18} color="#e67e22" />
                <Text style={styles.warningText}>
                    This action is irreversible. The current password will be invalidated immediately. Ensure the new holder has received the updated credentials before proceeding.
                </Text>
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
        paddingBottom: 32,
        gap: 14,
    },
    headerRow: {
        marginBottom: 4,
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
        lineHeight: 20,
    },
    infoRow: {
        flexDirection: 'row',
        gap: 12,
        flexWrap: 'wrap',
    },
    infoCard: {
        flex: 1,
        minWidth: 200,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.bgCard,
        borderWidth: 1,
        borderColor: Colors.borderLight,
        borderRadius: 12,
        padding: 14,
        gap: 12,
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 1,
    },
    infoIconWrap: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: Colors.bgMuted,
        alignItems: 'center',
        justifyContent: 'center',
    },
    infoBody: {
        flex: 1,
    },
    infoLabel: {
        fontSize: 11,
        color: Colors.textMuted,
        marginBottom: 2,
    },
    infoValue: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.textPrimary,
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
    formCard: {
        backgroundColor: Colors.bgCard,
        borderWidth: 1,
        borderColor: Colors.borderLight,
        borderRadius: 14,
        padding: 20,
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
    },
    sectionLabel: {
        fontSize: 11,
        textTransform: 'uppercase',
        letterSpacing: 0.6,
        color: Colors.textMuted,
        marginBottom: 4,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.textPrimary,
        marginBottom: 4,
    },
    cardSubTitle: {
        fontSize: 13,
        color: Colors.textSecondary,
        lineHeight: 20,
        marginBottom: 20,
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
        padding: 12,
        marginBottom: 14,
        fontSize: 14,
        backgroundColor: Colors.bgBase,
        color: Colors.textPrimary,
    },
    button: {
        backgroundColor: Colors.primaryDark,
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 4,
    },
    buttonDisabled: {
        backgroundColor: Colors.textMuted,
    },
    buttonInner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    buttonText: {
        color: Colors.textOnDark,
        fontWeight: 'bold',
        fontSize: 15,
    },
    warningCard: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
        backgroundColor: '#FFF8F0',
        borderWidth: 1,
        borderColor: '#FDDCB5',
        borderRadius: 12,
        padding: 14,
    },
    warningText: {
        flex: 1,
        fontSize: 13,
        color: '#7d4a00',
        lineHeight: 20,
    },
});
