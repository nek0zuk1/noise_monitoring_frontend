import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../../../core/theme/Colors';
import AnimatedScreen from '../../../components/AnimatedScreen';

export default function AboutScreen() {
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
                <View style={[styles.hero, { paddingTop: insets.top + 44 }]}>
                    <View style={styles.badge}>
                        <MaterialIcons name="info" size={12} color={Colors.primaryPale} />
                        <Text style={styles.badgeText}>System Overview</Text>
                    </View>
                    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
                        <Text style={styles.heroTitle}>About ZonoTrack</Text>
                        <Text style={styles.heroSub}>
                            Learn more about the Bagumbayan Norte Noise Monitoring initiative.
                        </Text>
                    </Animated.View>
                </View>

                {/* ── Content ── */}
                <Animated.View style={[styles.contentContainer, { opacity: fadeAnim }]}>
                    <View style={styles.card}>
                        <Text style={styles.sectionTitle}>Mission</Text>
                        <Text style={styles.content}>
                            The Bagumbayan Norte Noise Monitoring System is a community-driven initiative
                            designed to track, analyze, and manage environmental noise pollution in our barangay.
                        </Text>
                    </View>
                    <View style={styles.card}>
                        <Text style={styles.sectionTitle}>How It Works</Text>
                        <Text style={styles.content}>
                            By deploying a network of real-time sound sensors, our goal is to foster a quieter,
                            healthier environment for all residents through actionable data and community awareness.
                        </Text>
                    </View>
                    <View style={styles.metaCard}>
                        <MaterialIcons name="shield" size={16} color={Colors.primaryMid} />
                        <Text style={styles.metaText}>Your reports and submitted proof help improve response and local policy decisions.</Text>
                    </View>
                </Animated.View>
            </ScrollView>
        </AnimatedScreen>
    );
}

const styles = StyleSheet.create({
    page: {
        flex: 1,
        backgroundColor: Colors.bgBase,
    },
    // Hero style (copied from HomeScreen)
    hero: {
        backgroundColor: Colors.primaryDark,
        paddingHorizontal: 24,
        paddingBottom: 40,
        borderBottomLeftRadius: 36,
        borderBottomRightRadius: 36,
        overflow: 'hidden',
        shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.22, shadowRadius: 20, elevation: 10,
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: Colors.transparentWhite12,
        alignSelf: 'flex-start',
        borderRadius: 999,
        paddingHorizontal: 12,
        paddingVertical: 6,
        marginBottom: 14,
    },
    badgeText: {
        fontSize: 11,
        color: Colors.primaryPale,
        fontWeight: '700',
    },
    heroTitle: {
        fontSize: 32, fontWeight: '800', color: Colors.textOnDark,
        lineHeight: 38, marginBottom: 10,
        textShadowColor: Colors.transparentBlack15,
        textShadowOffset: { width: 0, height: 3 }, textShadowRadius: 8,
    },
    heroSub: {
        fontSize: 14, color: Colors.textOnDarkSub, lineHeight: 22,
    },

    contentContainer: {
        paddingHorizontal: 24,
        marginTop: 18,
    },
    card: {
        backgroundColor: Colors.bgCard,
        borderRadius: 16,
        padding: 20,
        marginBottom: 12,
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 3,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '800',
        color: Colors.primaryDark,
        marginBottom: 10,
        textTransform: 'uppercase',
        letterSpacing: 0.6,
    },
    content: {
        fontSize: 15,
        color: Colors.textSecondary,
        lineHeight: 24,
    },
    metaCard: {
        borderRadius: 12,
        backgroundColor: Colors.bgMuted,
        borderWidth: 1,
        borderColor: Colors.borderLight,
        paddingHorizontal: 14,
        paddingVertical: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    metaText: {
        flex: 1,
        fontSize: 12,
        lineHeight: 18,
        color: Colors.textSecondary,
    },
    version: {
        fontSize: 13,
        color: Colors.textMuted,
        fontWeight: '600',
        marginTop: 8,
        textAlign: 'center',
    }
});
