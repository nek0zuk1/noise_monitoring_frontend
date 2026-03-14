import React, { useRef, useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Animated,
    Dimensions,
    TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../../../core/theme/Colors';
import AnimatedScreen from '../../../components/AnimatedScreen';

const { width } = Dimensions.get('window');

// Mock hourly data for 24h bar chart
const HOURLY_DATA = [
    { hour: '12a', db: 30 }, { hour: '2a', db: 28 }, { hour: '4a', db: 25 },
    { hour: '6a', db: 42 }, { hour: '8a', db: 68 }, { hour: '10a', db: 72 },
    { hour: '12p', db: 65 }, { hour: '2p', db: 70 }, { hour: '4p', db: 74 },
    { hour: '6p', db: 78 }, { hour: '8p', db: 62 }, { hour: '10p', db: 45 },
];

const MAX_DB = 90;

const getBarColor = (db: number) => {
    if (db >= 70) return Colors.noiseCritical;
    if (db >= 55) return Colors.noiseElevated;
    return Colors.noiseNormal;
};

const INSIGHTS = [
    { icon: 'trending-up' as const, color: Colors.noiseCritical, label: 'Peak Hour', value: '6 PM – 8 PM', sub: 'Avg 78 dB' },
    { icon: 'trending-down' as const, color: Colors.noiseNormal, label: 'Quietest', value: '2 AM – 4 AM', sub: 'Avg 26 dB' },
    { icon: 'warning' as const, color: Colors.noiseElevated, label: 'Threshold Exc.', value: '6 hrs today', sub: '> 70 dB' },
    { icon: 'show-chart' as const, color: Colors.chartBlue, label: 'Daily Avg', value: '55 dB', sub: 'Moderate' },
];

export default function AnalyticsScreen() {
    const insets = useSafeAreaInsets();
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const barAnims = useRef(HOURLY_DATA.map(() => new Animated.Value(0))).current;
    const [activeTab, setActiveTab] = useState<'24h' | '7d' | '30d'>('24h');

    useEffect(() => {
        Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
        Animated.stagger(60, barAnims.map((anim) =>
            Animated.spring(anim, { toValue: 1, useNativeDriver: true, tension: 60, friction: 8 })
        )).start();
    }, []);

    return (
        <AnimatedScreen>
            <ScrollView
                style={styles.page}
                contentContainerStyle={{ paddingBottom: 110 }}
                showsVerticalScrollIndicator={false}
            >
                {/* ── Header ── */}
                <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
                    <View style={[StyleSheet.absoluteFillObject, { backgroundColor: Colors.transparentBlack10 }]} />
                    <View style={styles.headerContent}>
                        <View>
                            <Text style={styles.headerTitle}>Analytics</Text>
                            <Text style={styles.headerSub}>Noise trends & insights</Text>
                        </View>
                        <MaterialIcons name="analytics" size={44} color={Colors.transparentWhite75} />
                    </View>
                </View>

                <Animated.View style={[styles.content, { opacity: fadeAnim }]}>

                    {/* ── Tab Selector ── */}
                    <View style={styles.tabRow}>
                        {(['24h', '7d', '30d'] as const).map((t) => (
                            <TouchableOpacity
                                key={t}
                                style={[styles.tabBtn, activeTab === t && styles.tabBtnActive]}
                                onPress={() => setActiveTab(t)}
                                activeOpacity={0.85}
                            >
                                <Text
                                    style={[styles.tabLabel, activeTab === t && styles.tabLabelActive]}
                                >
                                    {t === '24h' ? 'Last 24h' : t === '7d' ? '7 Days' : '30 Days'}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* ── Bar Chart ── */}
                    <View style={styles.chartCard}>
                        <Text style={styles.chartTitle}>Hourly Noise Levels (dB)</Text>

                        {/* dB scale lines */}
                        {[90, 70, 55, 0].map((mark) => (
                            <View
                                key={mark}
                                style={[styles.scaleLine, { bottom: (mark / MAX_DB) * 160 + 36 }]}
                            >
                                <Text style={styles.scaleLabel}>{mark}</Text>
                            </View>
                        ))}

                        {/* Threshold zones */}
                        <View style={styles.barArea}>
                            <View style={[styles.zoneBar, { bottom: (70 / MAX_DB) * 160, height: (20 / MAX_DB) * 160, backgroundColor: Colors.noiseCritical + '0F' }]} />
                            <View style={[styles.zoneBar, { bottom: (55 / MAX_DB) * 160, height: (15 / MAX_DB) * 160, backgroundColor: Colors.noiseElevated + '0F' }]} />

                            {HOURLY_DATA.map((d, i) => (
                                <View key={d.hour} style={styles.barCol}>
                                    <Animated.View
                                        style={[
                                            styles.bar,
                                            {
                                                height: barAnims[i].interpolate({
                                                    inputRange: [0, 1],
                                                    outputRange: [0, (d.db / MAX_DB) * 160],
                                                }),
                                                backgroundColor: getBarColor(d.db),
                                            },
                                        ]}
                                    />
                                    <Text style={styles.barLabel}>{d.hour}</Text>
                                </View>
                            ))}
                        </View>

                        {/* Legend */}
                        <View style={styles.chartLegend}>
                            {[
                                { color: Colors.noiseNormal, label: 'Normal' },
                                { color: Colors.noiseElevated, label: 'Elevated' },
                                { color: Colors.noiseCritical, label: 'Critical' },
                            ].map((l) => (
                                <View key={l.label} style={styles.legendItem}>
                                    <View style={[styles.legendDot, { backgroundColor: l.color }]} />
                                    <Text style={styles.legendLabel}>{l.label}</Text>
                                </View>
                            ))}
                        </View>
                    </View>

                    {/* ── Insights Grid ── */}
                    <Text style={styles.sectionTitle}>Key Insights</Text>
                    <View style={styles.insightsGrid}>
                        {INSIGHTS.map((item) => (
                            <View key={item.label} style={styles.insightCard}>
                                <View style={[styles.insightIcon, { backgroundColor: item.color + '1A' }]}>
                                    <MaterialIcons name={item.icon} size={20} color={item.color} />
                                </View>
                                <Text style={styles.insightLabel}>{item.label}</Text>
                                <Text style={[styles.insightValue, { color: item.color }]}>{item.value}</Text>
                                <Text style={styles.insightSub}>{item.sub}</Text>
                            </View>
                        ))}
                    </View>

                    {/* ── WHO Guide ── */}
                    <View style={styles.whoCard}>
                        <View style={styles.whoHeader}>
                            <MaterialIcons name="info-outline" size={18} color={Colors.primary} />
                            <Text style={styles.whoTitle}>WHO Noise Guidelines</Text>
                        </View>
                        {[
                            { range: '< 55 dB', label: 'Normal', desc: 'Safe for all activities' },
                            { range: '55–70 dB', label: 'Elevated', desc: 'Causes fatigue over time' },
                            { range: '> 70 dB', label: 'Critical', desc: 'Hearing damage risk' },
                            { range: '> 85 dB', label: 'Danger', desc: 'Ear protection required' },
                        ].map((row) => (
                            <View key={row.range} style={styles.whoRow}>
                                <Text style={styles.whoRange}>{row.range}</Text>
                                <Text style={styles.whoLabel}>{row.label}</Text>
                                <Text style={styles.whoDesc}>{row.desc}</Text>
                            </View>
                        ))}
                    </View>
                </Animated.View>
            </ScrollView>
        </AnimatedScreen>
    );
}

const styles = StyleSheet.create({
    page: { flex: 1, backgroundColor: Colors.bgBase },

    header: {
        backgroundColor: Colors.primaryDark, paddingHorizontal: 20, paddingBottom: 50,
        borderBottomLeftRadius: 32, borderBottomRightRadius: 32, overflow: 'hidden',
        shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2, shadowRadius: 20, elevation: 10,
    },
    headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    headerTitle: { fontSize: 26, fontWeight: '800', color: Colors.textOnDark },
    headerSub: { fontSize: 13, color: Colors.textOnDarkSub, marginTop: 4 },

    content: { paddingHorizontal: 20, marginTop: -28 },

    tabRow: {
        flexDirection: 'row', backgroundColor: Colors.bgCard, borderRadius: 16,
        padding: 4, marginBottom: 20,
        shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
    },
    tabBtn: { flex: 1, paddingVertical: 9, borderRadius: 12, alignItems: 'center' },
    tabBtnActive: { backgroundColor: Colors.primary },
    tabLabel: { fontSize: 13, fontWeight: '600', color: Colors.textMuted },
    tabLabelActive: { color: Colors.textOnDark },

    // Chart
    chartCard: {
        backgroundColor: Colors.bgCard, borderRadius: 20, padding: 18, marginBottom: 24,
        shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04, shadowRadius: 10, elevation: 3,
    },
    chartTitle: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary, marginBottom: 12 },
    barArea: {
        flexDirection: 'row', alignItems: 'flex-end',
        height: 196, position: 'relative',
        borderBottomWidth: 2, borderBottomColor: Colors.borderLight,
    },
    scaleLine: {
        position: 'absolute', left: 0, right: 0, height: 1,
        backgroundColor: Colors.borderLight, zIndex: 1,
    },
    scaleLabel: { position: 'absolute', left: 0, top: -10, fontSize: 9, color: Colors.textMuted },
    zoneBar: { position: 'absolute', left: 0, right: 0 },
    barCol: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', paddingHorizontal: 2 },
    bar: { width: '75%', borderRadius: 4, borderBottomLeftRadius: 0, borderBottomRightRadius: 0 },
    barLabel: { fontSize: 8, color: Colors.textMuted, marginTop: 4, textAlign: 'center' },

    chartLegend: { flexDirection: 'row', gap: 16, marginTop: 14, justifyContent: 'center' },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    legendDot: { width: 8, height: 8, borderRadius: 4 },
    legendLabel: { fontSize: 11, color: Colors.textSecondary },

    // Insights
    sectionTitle: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary, marginBottom: 14 },
    insightsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
    insightCard: {
        width: (width - 52) / 2, backgroundColor: Colors.bgCard,
        borderRadius: 18, padding: 16,
        shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04, shadowRadius: 10, elevation: 2,
    },
    insightIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
    insightLabel: { fontSize: 11, color: Colors.textMuted, marginBottom: 4 },
    insightValue: { fontSize: 15, fontWeight: '800' },
    insightSub: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },

    // WHO Card
    whoCard: {
        backgroundColor: Colors.bgCard, borderRadius: 18, padding: 18, marginBottom: 8,
        shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04, shadowRadius: 10, elevation: 2,
    },
    whoHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
    whoTitle: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
    whoRow: {
        flexDirection: 'row', alignItems: 'center', paddingVertical: 8,
        borderBottomWidth: 1, borderBottomColor: Colors.borderLight,
    },
    whoRange: { width: 72, fontSize: 12, fontWeight: '700', color: Colors.textPrimary },
    whoLabel: { width: 68, fontSize: 12, fontWeight: '600', color: Colors.primaryMid },
    whoDesc: { flex: 1, fontSize: 12, color: Colors.textSecondary },
});
