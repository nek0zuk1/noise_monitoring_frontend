import React, { useContext, useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Animated,
    Vibration,
    Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, getNoiseLevelColor, getNoiseLevelLabel } from '../../../core/theme/Colors';
import AnimatedScreen from '../../../components/AnimatedScreen';
import { AuthContext } from '../../../core/auth/AuthContext';
import { apiClient } from '../../../core/api/apiClient';

type SensorData = {
    id: string;
    name: string;
    status: 'active' | 'inactive' | 'maintenance';
    noiseLevel: number;
    decibels: number;
    classLabel: string;
    confidence: number;
    indicator: string;
    location: string;
    lastUpdate: string;
};

const INITIAL_SENSORS: SensorData[] = [
    {
        id: '1',
        name: 'Main Street Sensor',
        status: 'active',
        noiseLevel: 45,
        decibels: 45,
        classLabel: 'Normal_Conversation',
        confidence: 94.2,
        indicator: 'Normal',
        location: 'Main Street, Naga City',
        lastUpdate: 'Live',
    },
    {
        id: '2',
        name: 'City Center Sensor',
        status: 'maintenance',
        noiseLevel: 60,
        decibels: 60,
        classLabel: 'Vehicle',
        confidence: 88.7,
        indicator: 'Elevated',
        location: 'City Center, Naga City',
        lastUpdate: '5m ago',
    },
    {
        id: '3',
        name: 'Park Area Sensor',
        status: 'active',
        noiseLevel: 35,
        decibels: 35,
        classLabel: 'Birds',
        confidence: 91.5,
        indicator: 'Normal',
        location: 'Central Park, Naga City',
        lastUpdate: 'Live',
    },
    {
        id: '4',
        name: 'Mall Zone Sensor',
        status: 'inactive',
        noiseLevel: 0,
        decibels: 0,
        classLabel: 'Unknown',
        confidence: 0,
        indicator: 'No Data',
        location: 'SM City Naga',
        lastUpdate: '10m ago',
    },
];

const normalizeLastUpdate = (value: unknown): string => {
    if (typeof value !== 'string' || !value.trim()) {
        return 'N/A';
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        return value;
    }

    return parsed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const normalizeSensor = (sensor: Record<string, unknown>): SensorData => ({
    id: String(sensor.id ?? ''),
    name: String(sensor.name ?? 'Unnamed Sensor'),
    status: (['active', 'inactive', 'maintenance'].includes(String(sensor.status))
        ? String(sensor.status)
        : 'inactive') as SensorData['status'],
    noiseLevel: Number(sensor.noiseLevel ?? 0),
    decibels: Number(sensor.decibels ?? sensor.noiseLevel ?? 0),
    classLabel: String(sensor.class ?? 'Unknown'),
    confidence: Number(sensor.confidence ?? 0),
    indicator: String(sensor.indicator ?? 'Unknown'),
    location: String(sensor.location ?? 'Unknown location'),
    lastUpdate: normalizeLastUpdate(sensor.lastUpdate),
});

const STATUS_COLORS: Record<string, string> = {
    active: Colors.statusActive,
    inactive: Colors.statusCritical,
    maintenance: Colors.statusWarning,
};

export default function DashboardScreen() {
    const { logout } = useContext(AuthContext);
    const insets = useSafeAreaInsets();
    const [sensors, setSensors] = useState<SensorData[]>(INITIAL_SENSORS);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [avgDb, setAvgDb] = useState(45);
    const [systemLevel, setSystemLevel] = useState<'Normal' | 'Elevated' | 'Critical'>('Normal');
    const [lastUpdated, setLastUpdated] = useState(new Date().toLocaleTimeString());
    const [activeTab, setActiveTab] = useState('24h');

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const headerScale = useRef(new Animated.Value(0.97)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
            Animated.spring(headerScale, { toValue: 1, useNativeDriver: true, bounciness: 4 }),
        ]).start();
    }, []);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        let cancelled = false;

        const fetchSensors = async () => {
            try {
                const response = await apiClient.get('/api/sensors');
                const apiSensors = (response.data?.sensors ?? []) as Array<Record<string, unknown>>;
                const normalized = apiSensors
                    .filter((sensor) => sensor && sensor.id)
                    .map(normalizeSensor);

                if (!cancelled && normalized.length > 0) {
                    setSensors(normalized);
                }
            } catch (error) {
                console.warn('Unable to fetch sensors', error);
            }
        };

        void fetchSensors();
        const interval = setInterval(() => {
            void fetchSensors();
        }, 5000);

        return () => {
            cancelled = true;
            clearInterval(interval);
        };
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            const h = new Date().getHours();
            const isNight = h >= 22 || h < 7;
            
            // Random dB between 30 and 80
            const db = Math.floor(Math.random() * 50 + 30);
            const level = getNoiseLevelLabel(db, true, isNight);

            setSystemLevel(level as any);
            setAvgDb(db);
            setLastUpdated(new Date().toLocaleTimeString());
        }, 4000);
        return () => clearInterval(interval);
    }, []);

    // ── Vibration alert ──────────────────────────────────────────────────────
    const prevLevelRef = useRef<'Normal' | 'Elevated' | 'Critical'>('Normal');
    useEffect(() => {
        const prev = prevLevelRef.current;
        prevLevelRef.current = systemLevel;

        // Only vibrate when escalating (not on first render or de-escalation)
        if (systemLevel === prev) return;

        if (systemLevel === 'Critical') {
            // Urgent: 3 strong pulses  [wait, vibrate, pause, vibrate, pause, vibrate]
            Vibration.vibrate([0, 400, 150, 400, 150, 600]);
        } else if (systemLevel === 'Elevated') {
            // Warning: soft double tap
            Vibration.vibrate([0, 200, 120, 200]);
        } else {
            // Back to normal – cancel any ongoing vibration
            Vibration.cancel();
        }
    }, [systemLevel]);

    const getGreeting = () => {
        const h = currentTime.getHours();
        if (h < 12) return 'Good Morning';
        if (h < 18) return 'Good Afternoon';
        return 'Good Evening';
    };

    const headerColor =
        systemLevel === 'Critical' ? Colors.noiseCritical
            : systemLevel === 'Elevated' ? Colors.noiseElevated
                : Colors.primary;

    const isNight = currentTime.getHours() >= 22 || currentTime.getHours() < 7;
    const activeSensors = sensors.filter(s => s.status === 'active').length;

    const handleLogout = () => {
        Alert.alert('Log out', 'Sign out from mobile now?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Log out',
                style: 'destructive',
                onPress: () => {
                    void logout();
                },
            },
        ]);
    };

    return (
        <AnimatedScreen>
            <ScrollView
                style={styles.page}
                contentContainerStyle={{ paddingBottom: 110 }}
                showsVerticalScrollIndicator={false}
            >
                {/* ── Header ── */}
                <Animated.View
                    style={[styles.header, { paddingTop: insets.top + 16, backgroundColor: headerColor }, { transform: [{ scale: headerScale }] }]}
                >
                    {/* subtle overlay */}
                    <View style={[StyleSheet.absoluteFillObject, { backgroundColor: Colors.transparentBlack12 }]} />

                    <View style={styles.headerTop}>
                        <View style={styles.headerLeft}>
                            <Text style={styles.greeting}>{getGreeting()}</Text>
                            <Text style={styles.dateText}>
                                {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                            </Text>
                        </View>
                        <View style={styles.headerRight}>
                            <TouchableOpacity
                                style={styles.logoutIconButton}
                                onPress={handleLogout}
                                activeOpacity={0.8}
                                accessibilityLabel="Log out"
                            >
                                <MaterialIcons name="logout" size={16} color={Colors.textOnDarkSub} />
                            </TouchableOpacity>
                            <Text style={styles.clockText}>
                                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.statusCard}>
                        <View style={[styles.statusIconBg, { backgroundColor: Colors.transparentWhite22 }]}>
                            <MaterialIcons
                                name={systemLevel === 'Normal' ? 'check-circle' : systemLevel === 'Elevated' ? 'warning' : 'error'}
                                size={28} color={Colors.textOnDark}
                            />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.statusTitle}>System: {systemLevel}</Text>
                            <Text style={styles.statusSub}>
                                Avg {avgDb} dB • Updated {lastUpdated}
                            </Text>
                        </View>
                        <View style={[styles.alarmBadge, { opacity: systemLevel === 'Normal' ? 0 : 1 }]}>
                            <MaterialIcons name="notifications-active" size={14} color={headerColor} />
                        </View>
                    </View>
                </Animated.View>

                <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
                    <View style={styles.kpiStrip}>
                        <View style={styles.kpiPill}>
                            <Text style={styles.kpiPillLabel}>Active</Text>
                            <Text style={styles.kpiPillValue}>{activeSensors}</Text>
                        </View>
                        <View style={styles.kpiPill}>
                            <Text style={styles.kpiPillLabel}>Average</Text>
                            <Text style={styles.kpiPillValue}>{avgDb} dB</Text>
                        </View>
                        <View style={styles.kpiPill}>
                            <Text style={styles.kpiPillLabel}>Last Sync</Text>
                            <Text style={styles.kpiPillValue}>{lastUpdated}</Text>
                        </View>
                    </View>

                    {/* ── Sensor Network Header ── */}
                    <View style={styles.sectionHeader}>
                        <View style={styles.sectionTitleRow}>
                            <MaterialIcons name="sensors" size={18} color={Colors.primary} />
                            <Text style={styles.sectionTitle}>Sensor Network</Text>
                        </View>
                        <View style={styles.tabGroup}>
                            {['24h', '7d', '30d'].map((t) => (
                                <TouchableOpacity
                                    key={t}
                                    style={[styles.tab, activeTab === t && styles.tabActive]}
                                    onPress={() => setActiveTab(t)}
                                >
                                    <Text style={[styles.tabLabel, activeTab === t && styles.tabLabelActive]}>{t}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* ── Sensor Cards ── */}
                    <View style={styles.sensorList}>
                        {sensors.map((item) => {
                            const dotColor = STATUS_COLORS[item.status];
                            const noiseColor = getNoiseLevelColor(item.noiseLevel, item.status === 'active', isNight);
                            return (
                                <View key={item.id} style={styles.sensorCard}>
                                    <View style={styles.cardMain}>
                                        <View style={[styles.statusDot, { backgroundColor: dotColor, shadowColor: dotColor }]} />
                                        <View style={styles.sensorInfo}>
                                            <Text style={styles.sensorName}>{item.name}</Text>
                                            <View style={styles.locationRow}>
                                                <MaterialIcons name="location-on" size={11} color={Colors.textMuted} />
                                                <Text style={styles.locationText}> {item.location}</Text>
                                            </View>
                                        </View>
                                        <View style={[styles.noiseBadge, { backgroundColor: noiseColor + '1A' }]}>
                                            <Text style={[styles.noiseValue, { color: noiseColor }]}>
                                                {item.status === 'active' ? `${item.noiseLevel} dB` : '--'}
                                            </Text>
                                            <Text style={[styles.noiseLabel, { color: noiseColor }]}>
                                                {getNoiseLevelLabel(item.noiseLevel, item.status === 'active', isNight)}
                                            </Text>
                                        </View>
                                    </View>

                                    <View style={styles.classificationRow}>
                                        <MaterialIcons name="graphic-eq" size={13} color={Colors.textMuted} />
                                        <Text style={styles.classificationText}>
                                            Class: {item.classLabel}
                                        </Text>
                                    </View>

                                    <View style={styles.classificationRow}>
                                        <MaterialIcons name="check-circle" size={13} color={Colors.textMuted} />
                                        <Text style={styles.classificationText}>
                                            Confidence: {item.confidence > 0 ? `${item.confidence.toFixed(1)}%` : 'N/A'}
                                        </Text>
                                    </View>

                                    <View style={styles.classificationRow}>
                                        <MaterialIcons name="volume-up" size={13} color={Colors.textMuted} />
                                        <Text style={styles.classificationText}>
                                            Decibel: {item.status === 'active' ? `${item.decibels.toFixed(1)} dB` : 'N/A'}
                                        </Text>
                                    </View>

                                    <View style={styles.classificationRow}>
                                        <MaterialIcons name="insights" size={13} color={Colors.textMuted} />
                                        <Text style={styles.classificationText}>
                                            Indicator: {item.indicator}
                                        </Text>
                                    </View>

                                    <View style={styles.cardFooter}>
                                        <MaterialIcons name="schedule" size={13} color={Colors.textMuted} />
                                        <Text style={styles.metaText}>Last update</Text>
                                        <Text style={styles.updateTime}>{item.lastUpdate}</Text>
                                    </View>
                                </View>
                            );
                        })}
                    </View>

                    {/* ── Health Tips ── */}
                    <View style={styles.tipsCard}>
                        <View style={styles.tipsHeader}>
                            <MaterialIcons name="health-and-safety" size={18} color={Colors.primary} />
                            <Text style={styles.tipsTitle}>Health Tips</Text>
                        </View>
                        {[
                            { icon: 'hearing' as const, text: 'Use ear protection in areas with noise above 85 dB.' },
                            { icon: 'timer' as const, text: 'Limit exposure to loud noise to prevent hearing fatigue.' },
                            { icon: 'bedtime' as const, text: 'Noise levels above 55 dB at night disturb sleep quality.' },
                        ].map((tip) => (
                            <View key={tip.text} style={styles.tip}>
                                <View style={styles.tipIcon}>
                                    <MaterialIcons name={tip.icon} size={16} color={Colors.primary} />
                                </View>
                                <Text style={styles.tipText}>{tip.text}</Text>
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
        paddingHorizontal: 20, paddingBottom: 24,
        borderBottomLeftRadius: 32, borderBottomRightRadius: 32,
        overflow: 'hidden',
        shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.18, shadowRadius: 20, elevation: 10,
        marginBottom: 4,
    },
    headerTop: {
        flexDirection: 'row', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: 22,
    },
    headerLeft: {
        justifyContent: 'center',
    },
    greeting: { fontSize: 22, fontWeight: '700', color: Colors.textOnDark, marginTop: 45},
    dateText: { fontSize: 13, color: Colors.textOnDarkSub, marginTop: 3 },
    clockText: { fontSize: 30, fontWeight: '200', color: Colors.textOnDark },
    headerRight: { alignItems: 'flex-end', gap: 8 },
    logoutIconButton: {
        width: 30,
        height: 30,
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: Colors.transparentWhite22,
        backgroundColor: Colors.transparentWhite12,
    },

    statusCard: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        backgroundColor: Colors.transparentWhite16,
        borderRadius: 18, padding: 14,
        borderWidth: 1, borderColor: Colors.transparentWhite22,
    },
    statusIconBg: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
    statusTitle: { fontSize: 15, fontWeight: '700', color: Colors.textOnDark },
    statusSub: { fontSize: 12, color: Colors.textOnDarkSub, marginTop: 2 },
    alarmBadge: {
        width: 28, height: 28, borderRadius: 14,
        backgroundColor: Colors.bgCard, alignItems: 'center', justifyContent: 'center',
    },

    content: { paddingHorizontal: 20, marginTop: 20 },
    kpiStrip: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 14,
    },
    kpiPill: {
        flex: 1,
        backgroundColor: Colors.bgCard,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.borderLight,
        paddingVertical: 8,
        paddingHorizontal: 10,
    },
    kpiPillLabel: {
        fontSize: 10,
        textTransform: 'uppercase',
        color: Colors.textMuted,
        letterSpacing: 0.5,
        fontWeight: '700',
    },
    kpiPillValue: {
        marginTop: 4,
        fontSize: 12,
        color: Colors.textPrimary,
        fontWeight: '800',
    },
    sectionHeader: {
        flexDirection: 'row', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: 14,
    },
    sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
    sectionTitle: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary },

    tabGroup: {
        flexDirection: 'row', backgroundColor: Colors.borderLight,
        borderRadius: 20, padding: 3,
    },
    tab: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 17 },
    tabActive: {
        backgroundColor: Colors.bgCard,
        shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1, shadowRadius: 3, elevation: 2,
    },
    tabLabel: { fontSize: 11, fontWeight: '600', color: Colors.textMuted },
    tabLabelActive: { color: Colors.textPrimary },

    sensorList: { gap: 12, marginBottom: 24 },
    sensorCard: {
        backgroundColor: Colors.bgCard, borderRadius: 18, padding: 16,
        shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04, shadowRadius: 10, elevation: 2,
    },
    cardMain: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    statusDot: {
        width: 10, height: 10, borderRadius: 5, marginRight: 12,
        shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.7, shadowRadius: 4, elevation: 2,
    },
    sensorInfo: { flex: 1 },
    sensorName: { fontWeight: '700', color: Colors.textPrimary, fontSize: 14, marginBottom: 3 },
    locationRow: { flexDirection: 'row', alignItems: 'center' },
    locationText: { fontSize: 11, color: Colors.textMuted },
    noiseBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, alignItems: 'center', minWidth: 62 },
    noiseValue: { fontWeight: '800', fontSize: 14 },
    noiseLabel: { fontSize: 10, fontWeight: '600', marginTop: 1 },

    classificationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
        gap: 6,
    },
    classificationText: {
        fontSize: 12,
        color: Colors.textSecondary,
        fontWeight: '600',
    },

    cardFooter: {
        flexDirection: 'row', alignItems: 'center',
        borderTopWidth: 1, borderTopColor: Colors.borderLight, paddingTop: 10,
    },
    metaText: { fontSize: 11, color: Colors.textMuted, marginLeft: 3 },
    updateTime: { marginLeft: 'auto', fontSize: 11, color: Colors.textMuted, fontStyle: 'italic' },

    tipsCard: {
        backgroundColor: Colors.bgCard, borderRadius: 18, padding: 18,
        marginBottom: 8,
        shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04, shadowRadius: 10, elevation: 2,
    },
    tipsHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
    tipsTitle: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
    tip: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    tipIcon: {
        width: 32, height: 32, borderRadius: 10, backgroundColor: Colors.bgMuted,
        alignItems: 'center', justifyContent: 'center', marginRight: 12,
    },
    tipText: { fontSize: 13, color: Colors.textSecondary, flex: 1, lineHeight: 19 },
});
