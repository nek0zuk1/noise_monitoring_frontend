import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Alert, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../../core/theme/Colors';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import AnimatedScreen from '../../../components/AnimatedScreen';
import { apiClient } from '../../../core/api/apiClient';

export default function UploadProofScreen() {
    const insets = useSafeAreaInsets();
    const [imageUri, setImageUri] = useState<string | null>(null);
    const [reportText, setReportText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const pickImage = async () => {
        // Request permissions
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (permissionResult.granted === false) {
            Alert.alert("Permission to access camera roll is required!");
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
        });

        if (!result.canceled) {
            setImageUri(result.assets[0].uri);
        }
    };

    const handleUpload = async () => {
        if (!imageUri && !reportText.trim()) {
            Alert.alert('Missing details', 'Please add an image or write a report.');
            return;
        }

        try {
            setIsSubmitting(true);
            await apiClient.post('/api/reports', {
                report_text: reportText.trim(),
                image_uri: imageUri || '',
                submitted_by: 'mobile_client',
                location: 'Bagumbayan Norte',
            });
            Alert.alert('Submitted', 'Your report was sent to admin successfully.');
            setImageUri(null);
            setReportText('');
        } catch (error: any) {
            const message = error?.response?.data?.error || 'Failed to submit report. Please try again.';
            Alert.alert('Submission failed', message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AnimatedScreen>
            <ScrollView
                style={styles.container}
                contentContainerStyle={{ paddingBottom: 120 }}
            >
                <View style={[styles.hero, { paddingTop: insets.top + 24 }]}>
                    <View style={styles.heroBadge}>
                        <MaterialIcons name="verified" size={12} color={Colors.primaryPale} />
                        <Text style={styles.heroBadgeText}>Evidence Submission</Text>
                    </View>
                    <Text style={styles.headerTitle}>Upload Proof</Text>
                    <Text style={styles.headerDesc}>
                        Submit a clear photo for reported noise activity so admins can verify and respond faster.
                    </Text>
                </View>

                <View style={styles.content}>
                    <View style={styles.tipCard}>
                        <MaterialIcons name="lightbulb" size={18} color={Colors.statusWarning} />
                        <Text style={styles.tipText}>Tip: Include visible landmarks, date context, or source equipment in the photo.</Text>
                    </View>

                    <View style={styles.reportCard}>
                        <Text style={styles.reportLabel}>Incident Summary</Text>
                        <TextInput
                            style={styles.reportInput}
                            placeholder="Describe what happened, where, and when..."
                            placeholderTextColor={Colors.textMuted}
                            multiline
                            value={reportText}
                            onChangeText={setReportText}
                        />
                    </View>

                    <TouchableOpacity style={styles.imagePicker} onPress={pickImage} activeOpacity={0.8}>
                        {imageUri ? (
                            <Image source={{ uri: imageUri }} style={styles.image} />
                        ) : (
                            <View style={styles.placeholderContainer}>
                                <MaterialIcons name="add-a-photo" size={48} color={Colors.textMuted} />
                                <Text style={styles.placeholderText}>Tap to select an image</Text>
                            </View>
                        )}
                    </TouchableOpacity>

                    {(imageUri || reportText.trim().length > 0) && (
                        <TouchableOpacity style={styles.uploadButton} onPress={handleUpload} activeOpacity={0.8} disabled={isSubmitting}>
                            <MaterialIcons name="cloud-upload" size={24} color={Colors.textOnDark} style={{ marginRight: 8 }} />
                            <Text style={styles.uploadButtonText}>{isSubmitting ? 'Submitting...' : 'Submit Report to Admin'}</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </ScrollView>
        </AnimatedScreen>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.bgBase,
    },
    hero: {
        backgroundColor: Colors.primaryDark,
        paddingHorizontal: 24,
        paddingBottom: 36,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.18,
        shadowRadius: 14,
        elevation: 8,
    },
    heroBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: Colors.transparentWhite12,
        borderRadius: 999,
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 6,
        marginBottom: 14,
    },
    heroBadgeText: {
        fontSize: 11,
        color: Colors.primaryPale,
        fontWeight: '700',
    },
    headerTitle: {
        fontSize: 30,
        fontWeight: '800',
        color: Colors.textOnDark,
        marginBottom: 8,
    },
    headerDesc: {
        fontSize: 15,
        color: Colors.textOnDarkSub,
        lineHeight: 22,
    },
    content: {
        paddingHorizontal: 24,
        marginTop: -18,
    },
    tipCard: {
        backgroundColor: Colors.bgCard,
        borderRadius: 14,
        paddingHorizontal: 14,
        paddingVertical: 12,
        flexDirection: 'row',
        gap: 10,
        alignItems: 'center',
        marginBottom: 14,
        borderWidth: 1,
        borderColor: Colors.borderLight,
    },
    tipText: {
        flex: 1,
        fontSize: 12,
        color: Colors.textSecondary,
        lineHeight: 18,
    },
    reportCard: {
        backgroundColor: Colors.bgCard,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: Colors.borderLight,
        padding: 12,
        marginBottom: 12,
    },
    reportLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: Colors.textSecondary,
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    reportInput: {
        minHeight: 88,
        borderWidth: 1,
        borderColor: Colors.borderLight,
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 14,
        color: Colors.textPrimary,
        textAlignVertical: 'top',
        backgroundColor: Colors.bgBase,
    },
    imagePicker: {
        backgroundColor: Colors.bgCard,
        borderRadius: 20,
        height: 320,
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        borderWidth: 1.5,
        borderColor: Colors.borderLight,
        borderStyle: 'dashed',
        marginBottom: 24,
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
        elevation: 3,
    },
    image: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    placeholderContainer: {
        alignItems: 'center',
    },
    placeholderText: {
        marginTop: 12,
        fontSize: 16,
        color: Colors.textSecondary,
    },
    uploadButton: {
        backgroundColor: Colors.primaryDark,
        borderRadius: 16,
        height: 56,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: Colors.primaryDark,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 12,
        elevation: 6,
    },
    uploadButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.textOnDark,
    },
});
