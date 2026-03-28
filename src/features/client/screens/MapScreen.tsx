import React, { useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
} from 'react-native';
import MapView, { Polygon, PROVIDER_DEFAULT } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, withAlpha } from '../../../core/theme/Colors';
import AnimatedScreen from '../../../components/AnimatedScreen';

// ─── Bagumbayan Norte boundary ─────────────────────────────────────────────
const POLYGON_COORDS = [
    { latitude: 13.639946, longitude: 123.18605 },
    { latitude: 13.639746, longitude: 123.186042 },
    { latitude: 13.639624, longitude: 123.186104 },
    { latitude: 13.639583, longitude: 123.186164 },
    { latitude: 13.639477, longitude: 123.186185 },
    { latitude: 13.639312, longitude: 123.186163 },
    { latitude: 13.639305, longitude: 123.186187 },
    { latitude: 13.639015, longitude: 123.186148 },
    { latitude: 13.63778, longitude: 123.186446 },
    { latitude: 13.637516, longitude: 123.186657 },
    { latitude: 13.637235, longitude: 123.186741 },
    { latitude: 13.637047, longitude: 123.186912 },
    { latitude: 13.635599, longitude: 123.187014 },
    { latitude: 13.63548, longitude: 123.187152 },
    { latitude: 13.635138, longitude: 123.187302 },
    { latitude: 13.634979, longitude: 123.187031 },
    { latitude: 13.635984, longitude: 123.186348 },
    { latitude: 13.635321, longitude: 123.185343 },
    { latitude: 13.634036, longitude: 123.184861 },
    { latitude: 13.63417, longitude: 123.183931 },
    { latitude: 13.632624, longitude: 123.179475 },
    { latitude: 13.633045, longitude: 123.179304 },
    { latitude: 13.636007, longitude: 123.181771 },
    { latitude: 13.637085, longitude: 123.18137 },
    { latitude: 13.639804, longitude: 123.185132 },
    { latitude: 13.639946, longitude: 123.18605 },
];

// Lock region to Bagumbayan Norte
const INITIAL_REGION = {
    latitude: 13.6363,
    longitude: 123.1832,
    latitudeDelta: 0.0082,
    longitudeDelta: 0.0082,
};

// Lat/lng hard limits (cannot pan outside these)
const MIN_LAT = 13.6315;
const MAX_LAT = 13.6410;
const MIN_LNG = 123.1780;
const MAX_LNG = 123.1880;

// ─── Noise zone heatmap data ──────────────────────────────────────────────
// Each zone represents a hotspot. Radius is in metres.
type NoiseZone = {
    id: string;
    latitude: number;
    longitude: number;
    radius: number;      // base radius in metres
    noiseLevel: number;  // dB
    label: string;
};

const NOISE_ZONES: NoiseZone[] = [
    // North – busy road junction
    { id: 'z1', latitude: 13.6392, longitude: 123.1856, radius: 110, noiseLevel: 78, label: 'Road Junction' },
    // Upper-center – commercial strip
    { id: 'z2', latitude: 13.6377, longitude: 123.1847, radius: 140, noiseLevel: 66, label: 'Commercial Strip' },
    // East wall – market area
    { id: 'z3', latitude: 13.6360, longitude: 123.1858, radius: 90, noiseLevel: 73, label: 'Market Area' },
    // Center – mixed residential
    { id: 'z4', latitude: 13.6361, longitude: 123.1838, radius: 120, noiseLevel: 54, label: 'Residential Center' },
    // Center-west – calmer zone
    { id: 'z5', latitude: 13.6372, longitude: 123.1822, radius: 130, noiseLevel: 43, label: 'Park Vicinity' },
    // Center-south – mixed zone
    { id: 'z6', latitude: 13.6345, longitude: 123.1843, radius: 100, noiseLevel: 50, label: 'Mixed Zone' },
    // Southwest – quiet
    { id: 'z7', latitude: 13.6348, longitude: 123.1820, radius: 105, noiseLevel: 38, label: 'Quiet Zone A' },
    // Far south – very quiet
    { id: 'z8', latitude: 13.6334, longitude: 123.1803, radius: 95, noiseLevel: 33, label: 'Quiet Zone B' },
];

// ─── Color helpers ────────────────────────────────────────────────────────
function getHeatColor(db: number): string {
    if (db >= 70) return Colors.noiseCritical; // critical  – red
    if (db >= 55) return Colors.noiseElevated; // elevated  – orange
    if (db >= 45) return Colors.statusWarning; // moderate  – amber
    return Colors.noiseNormal;                 // normal    – green
}

export default function MapScreen() {
    const insets = useSafeAreaInsets();
    const mapRef = useRef<MapView>(null);

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(28)).current;

    React.useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
            Animated.timing(slideAnim, { toValue: 0, duration: 900, useNativeDriver: true }),
        ]).start();
    }, [fadeAnim, slideAnim]);

    // Clamp region to Bagumbayan Norte bounds
    const handleRegionChange = (region: typeof INITIAL_REGION) => {
        const clamped = { ...region };
        let changed = false;
        if (region.latitude < MIN_LAT) { clamped.latitude = MIN_LAT; changed = true; }
        if (region.latitude > MAX_LAT) { clamped.latitude = MAX_LAT; changed = true; }
        if (region.longitude < MIN_LNG) { clamped.longitude = MIN_LNG; changed = true; }
        if (region.longitude > MAX_LNG) { clamped.longitude = MAX_LNG; changed = true; }
        if (changed) mapRef.current?.animateToRegion(clamped, 100);
    };

    const resetView = () => {
        mapRef.current?.animateToRegion(INITIAL_REGION, 600);
    };

    return (
        <AnimatedScreen>
            <View style={styles.root}>
                {/* Header */}
                <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
                    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
                        <Text style={styles.headerTitle}>Noise Heatmap</Text>
                        <Text style={styles.headerSub}>Bagumbayan Norte • Naga City</Text>
                    </Animated.View>
                    <TouchableOpacity style={styles.resetBtn} onPress={resetView}>
                        <MaterialIcons name="my-location" size={20} color={Colors.primary} />
                    </TouchableOpacity>
                </View>

                {/* Full-screen Map */}
                <Animated.View style={[styles.mapContainer, { opacity: fadeAnim }]}>
                    <MapView
                        ref={mapRef}
                        provider={PROVIDER_DEFAULT}
                        style={styles.map}
                        initialRegion={INITIAL_REGION}
                        camera={{
                            center: {
                                latitude: INITIAL_REGION.latitude,
                                longitude: INITIAL_REGION.longitude,
                            },
                            pitch: 0,
                            heading: 0,
                            altitude: 3000,
                            zoom: 15,
                        }}
                        minZoomLevel={15}
                        maxZoomLevel={19}
                        onRegionChangeComplete={handleRegionChange}
                        showsUserLocation={false}
                        showsCompass={true}
                        showsScale={true}
                        toolbarEnabled={false}
                        scrollEnabled={true}
                        zoomEnabled={true}
                        pitchEnabled={false}
                        rotateEnabled={false}
                    >
                        {/* Bagumbayan Norte boundary polygon */}
                        <Polygon
                            coordinates={POLYGON_COORDS}
                            fillColor={withAlpha(Colors.primaryDark, 0.06)}
                            strokeColor={Colors.primary}
                            strokeWidth={2.5}
                        />


                    </MapView>

                    {/* Legend */}
                    <View style={styles.legendBox}>
                        <Text style={styles.legendTitle}>NOISE LEVEL</Text>
                        {[
                            { color: Colors.noiseCritical, label: 'Critical', sub: '≥ 70 dB' },
                            { color: Colors.noiseElevated, label: 'Elevated', sub: '55–69 dB' },
                            { color: Colors.statusWarning, label: 'Moderate', sub: '45–54 dB' },
                            { color: Colors.noiseNormal, label: 'Normal', sub: '< 45 dB' },
                        ].map((item) => (
                            <View key={item.label} style={styles.legendRow}>
                                <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                                <View>
                                    <Text style={styles.legendLabel}>{item.label}</Text>
                                    <Text style={styles.legendSub}>{item.sub}</Text>
                                </View>
                            </View>
                        ))}
                    </View>

                </Animated.View>
            </View>
        </AnimatedScreen >
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: Colors.bgBase },

    header: {
        backgroundColor: Colors.bgHeader,
        paddingHorizontal: 20,
        paddingBottom: 14,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 6,
        zIndex: 10,
    },
    headerTitle: { fontSize: 20, fontWeight: '700', color: Colors.textOnDark },
    headerSub: { fontSize: 12, color: Colors.textOnDarkSub, marginTop: 2 },
    resetBtn: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: Colors.bgCard,
        alignItems: 'center', justifyContent: 'center',
        shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12, shadowRadius: 4, elevation: 3,
    },

    mapContainer: { flex: 1 },
    map: { ...StyleSheet.absoluteFillObject },

    legendBox: {
        position: 'absolute',
        top: 12, right: 12,
        backgroundColor: withAlpha(Colors.bgCard, 0.95),
        borderRadius: 14,
        paddingVertical: 10,
        paddingHorizontal: 12,
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12, shadowRadius: 8, elevation: 5,
        minWidth: 140,
    },
    legendTitle: {
        fontSize: 9, fontWeight: '800', color: Colors.textMuted,
        letterSpacing: 1.2, marginBottom: 8,
    },
    legendRow: {
        flexDirection: 'row', alignItems: 'center',
        marginBottom: 7, gap: 8,
    },
    legendDot: {
        width: 12, height: 12, borderRadius: 6,
        shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2, shadowRadius: 2, elevation: 2,
    },
    legendLabel: { fontSize: 11, fontWeight: '700', color: Colors.textPrimary },
    legendSub: { fontSize: 9, fontWeight: '500', color: Colors.textSecondary },

    bottomInfoCard: {
        position: 'absolute',
        left: 12,
        right: 12,
        bottom: 18,
        backgroundColor: withAlpha(Colors.bgCard, 0.96),
        borderRadius: 14,
        borderWidth: 1,
        borderColor: Colors.borderLight,
        paddingHorizontal: 14,
        paddingVertical: 12,
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 4,
    },
    bottomInfoTitle: {
        fontSize: 12,
        fontWeight: '800',
        color: Colors.textPrimary,
        marginBottom: 4,
    },
    bottomInfoSub: {
        fontSize: 11,
        lineHeight: 16,
        color: Colors.textSecondary,
    },
});
