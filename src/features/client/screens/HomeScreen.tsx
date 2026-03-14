import React, { useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Colors, withAlpha } from '../../../core/theme/Colors';
import { AuthContext } from '../../../core/auth/AuthContext';
import AnimatedScreen from '../../../components/AnimatedScreen';

const FEATURES = [
    {
        screen: 'Dashboard',
        icon: 'sensors' as const,
        color: Colors.primaryLight,
        bg: Colors.bgMuted,
        title: 'Real-time Monitoring',
        desc: 'Live decibel levels from sensors across Bagumbayan Norte.',
    },
    {
        screen: 'Map',
        icon: 'map' as const,
        color: Colors.statusWarning,
        bg: Colors.bgOrangeMuted,
        title: 'Interactive Map',
        desc: 'Geospatial view of sensors locked to Bagumbayan Norte.',
    },
    {
        screen: 'UploadProof',
        icon: 'add-a-photo' as const,
        color: Colors.chartBlue,
        bg: Colors.bgBlueMuted,
        title: 'Upload Proof',
        desc: 'Upload images as proof of noise activity in the area.',
    },
    {
        screen: 'About',
        icon: 'info' as const,
        color: Colors.primaryMid,
        bg: Colors.borderLight,
        title: 'About the System',
        desc: 'Learn about the Bagumbayan Norte Noise Monitoring initiative.',
    },
];

export default function HomeScreen() {
    const navigation = useNavigation<any>();
    const { logout, user } = React.useContext(AuthContext);
    const insets = useSafeAreaInsets();

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(28)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
            Animated.timing(slideAnim, { toValue: 0, duration: 900, useNativeDriver: true }),
        ]).start();
    }, [fadeAnim, slideAnim]);

    return (
        <AnimatedScreen>
            <ScrollView
                style={styles.page}
                contentContainerStyle={{ paddingBottom: 110 }}
                showsVerticalScrollIndicator={false}
            >
                {/* ── Hero ── */}
                <View style={[styles.hero, { paddingTop: insets.top + 44 }]}>
                    <View style={styles.heroBadge}>
                        <MaterialIcons name="place" size={12} color={Colors.primaryPale} />
                        <Text style={styles.heroBadgeText}>Naga City, Camarines Sur</Text>
                    </View>
                    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
                        <Text style={styles.heroTitle}>
                            {`Hello, ${user?.name || 'Citizen'}\nWelcome to Bagumbayan Norte Noise Monitoring System`}
                        </Text>
                        <Text style={styles.heroSub}>
                            Real-time environmental sound tracking, advanced analytics, and community-aware alerts for a quieter, healthier barangay.
                        </Text>
                    </Animated.View>
                </View>

                <View style={styles.summaryRow}>
                    <View style={styles.summaryCard}>
                        <MaterialIcons name="sensors" size={16} color={Colors.primaryDark} />
                        <Text style={styles.summaryLabel}>Sensors</Text>
                        <Text style={styles.summaryValue}>12 Active</Text>
                    </View>
                    <View style={styles.summaryCard}>
                        <MaterialIcons name="graphic-eq" size={16} color={Colors.statusWarning} />
                        <Text style={styles.summaryLabel}>Avg Noise</Text>
                        <Text style={styles.summaryValue}>55 dB</Text>
                    </View>
                </View>

                {/* ── Feature Cards ── */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Features</Text>
                    {FEATURES.map((f, i) => (
                        <View key={f.screen}>
                            <TouchableOpacity
                                style={styles.featureCard}
                                activeOpacity={0.82}
                                onPress={() => navigation.navigate(f.screen)}
                            >
                                <View style={[styles.featureIcon, { backgroundColor: f.bg }]}>
                                    <MaterialIcons name={f.icon} size={26} color={f.color} />
                                </View>
                                <View style={styles.featureText}>
                                    <Text style={styles.featureTitle}>{f.title}</Text>
                                    <Text style={styles.featureDesc}>{f.desc}</Text>
                                </View>
                                <MaterialIcons name="chevron-right" size={20} color={Colors.textMuted} />
                            </TouchableOpacity>
                        </View>
                    ))}
                </View>
                {/* ── Logout Section ── */}
                <View style={styles.logoutSection}>
                    <TouchableOpacity
                        style={styles.logoutButton}
                        activeOpacity={0.7}
                        onPress={logout}
                    >
                        <MaterialIcons name="logout" size={20} color={Colors.statusCritical} />
                        <Text style={styles.logoutText}>Log Out</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </AnimatedScreen>
    );
}

const styles = StyleSheet.create({
    page: { flex: 1, backgroundColor: Colors.bgBase },

    // Hero
    hero: {
        backgroundColor: Colors.primaryDark,
        paddingHorizontal: 24,
        paddingBottom: 32,
        borderBottomLeftRadius: 36,
        borderBottomRightRadius: 36,
        overflow: 'hidden',
        shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.22, shadowRadius: 20, elevation: 10,
    },
    heroBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        backgroundColor: Colors.transparentWhite12,
        alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 5,
        borderRadius: 20, marginBottom: 20,
    },
    heroBadgeText: { fontSize: 11, color: Colors.primaryPale, fontWeight: '600' },
    heroTitle: {
        fontSize: 34, fontWeight: '800', color: Colors.textOnDark,
        lineHeight: 42, marginBottom: 16,
        textShadowColor: Colors.transparentBlack15,
        textShadowOffset: { width: 0, height: 3 }, textShadowRadius: 8,
    },
    heroSub: {
        fontSize: 14, color: Colors.textOnDarkSub, lineHeight: 22, marginBottom: 28,
    },
    // Features
    section: { paddingHorizontal: 20, marginTop: 24 },
    sectionTitle: {
        fontSize: 18, fontWeight: '700', color: Colors.textPrimary, marginBottom: 14,
    },
    featureCard: {
        backgroundColor: Colors.bgCard, borderRadius: 20,
        flexDirection: 'row', alignItems: 'center',
        padding: 18, marginBottom: 12, gap: 16,
        shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05, shadowRadius: 12, elevation: 3,
    },
    featureIcon: {
        width: 52, height: 52, borderRadius: 16,
        alignItems: 'center', justifyContent: 'center',
    },
    featureText: { flex: 1 },
    featureTitle: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary, marginBottom: 4 },
    featureDesc: { fontSize: 13, color: Colors.textSecondary, lineHeight: 19 },

    summaryRow: {
        marginTop: -18,
        paddingHorizontal: 20,
        flexDirection: 'row',
        gap: 10,
    },
    summaryCard: {
        flex: 1,
        backgroundColor: Colors.bgCard,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: Colors.borderLight,
        paddingHorizontal: 14,
        paddingVertical: 12,
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
        elevation: 3,
    },
    summaryLabel: {
        marginTop: 5,
        fontSize: 11,
        color: Colors.textMuted,
        fontWeight: '600',
    },
    summaryValue: {
        marginTop: 3,
        fontSize: 15,
        color: Colors.textPrimary,
        fontWeight: '800',
    },

    // Logout
    logoutSection: {
        marginTop: 32,
        alignItems: 'center',
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 24,
        backgroundColor: withAlpha(Colors.statusCritical, 0.1),
        borderRadius: 24,
        gap: 8,
    },
    logoutText: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.statusCritical,
    },
});
