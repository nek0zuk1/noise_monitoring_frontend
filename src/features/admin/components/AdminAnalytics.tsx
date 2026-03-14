import React from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Colors } from '../../../core/theme/Colors';
import { MaterialIcons } from '@expo/vector-icons';
import { apiClient } from '../../../core/api/apiClient';

type NoiseBucket = {
    label: string;
    avg_decibels: number;
    count: number;
};

type NoisePayload = {
    average_decibels: number;
    total_readings: number;
    noise_summary: {
        Normal: number;
        Elevated: number;
        High: number;
    };
    graph: NoiseBucket[];
};

export default function AdminAnalytics() {
    const [isLoading, setIsLoading] = React.useState(true);
    const [summary, setSummary] = React.useState({ total_reports: 0, pending_reports: 0, reports_today: 0 });
    const [recentReports, setRecentReports] = React.useState<Array<{ report_text?: string; created_at?: string; status?: string }>>([]);
    const [noise24h, setNoise24h] = React.useState<NoisePayload>({
        average_decibels: 0,
        total_readings: 0,
        noise_summary: { Normal: 0, Elevated: 0, High: 0 },
        graph: [],
    });
    const [noise7d, setNoise7d] = React.useState<NoisePayload>({
        average_decibels: 0,
        total_readings: 0,
        noise_summary: { Normal: 0, Elevated: 0, High: 0 },
        graph: [],
    });

    React.useEffect(() => {
        const fetchSummary = async () => {
            try {
                const [reportsRes, noise24Res, noise7Res] = await Promise.all([
                    apiClient.get('/api/admin/reports/summary'),
                    apiClient.get('/api/admin/noise-summary?window=24h'),
                    apiClient.get('/api/admin/noise-summary?window=7d'),
                ]);

                setSummary(reportsRes.data?.summary || { total_reports: 0, pending_reports: 0, reports_today: 0 });
                setRecentReports(reportsRes.data?.recent_reports || []);
                setNoise24h(noise24Res.data || noise24h);
                setNoise7d(noise7Res.data || noise7d);
            } catch {
                // Keep fallback values if backend is unavailable.
            } finally {
                setIsLoading(false);
            }
        };

        void fetchSummary();
    }, []);

    const max24h = React.useMemo(
        () => Math.max(...noise24h.graph.map((item) => item.avg_decibels), 1),
        [noise24h.graph]
    );
    const max7d = React.useMemo(
        () => Math.max(...noise7d.graph.map((item) => item.avg_decibels), 1),
        [noise7d.graph]
    );

    const getBarColor = (db: number) => {
        if (db >= 70) return Colors.noiseCritical;
        if (db >= 55) return Colors.noiseElevated;
        return Colors.noiseNormal;
    };

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            <View style={styles.headerCard}>
                <Text style={styles.sectionLabel}>Deep Dive</Text>
                <Text style={styles.title}>Reports and Trends</Text>
                <Text style={styles.subtitle}>
                    Detailed view for report queue handling and noise-trend analysis.
                </Text>
            </View>

            <View style={styles.queueRow}>
                <View style={styles.queueCard}>
                    <MaterialIcons name="assignment" size={18} color={Colors.primaryDark} />
                    <Text style={styles.queueValue}>{summary.total_reports}</Text>
                    <Text style={styles.queueLabel}>Total Reports</Text>
                </View>
                <View style={styles.queueCard}>
                    <MaterialIcons name="pending-actions" size={18} color={Colors.statusWarning} />
                    <Text style={styles.queueValue}>{summary.pending_reports}</Text>
                    <Text style={styles.queueLabel}>Pending Review</Text>
                </View>
                <View style={styles.queueCard}>
                    <MaterialIcons name="today" size={18} color={Colors.chartBlue} />
                    <Text style={styles.queueValue}>{summary.reports_today}</Text>
                    <Text style={styles.queueLabel}>Today</Text>
                </View>
            </View>

            <View style={styles.reportSection}>
                <Text style={styles.sectionTitle}>24h Noise Trend (Hourly Avg dB)</Text>
                <Text style={styles.sectionMeta}>Average: {noise24h.average_decibels.toFixed(1)} dB</Text>
                {isLoading ? (
                    <ActivityIndicator color={Colors.primaryDark} />
                ) : (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.graphRow}>
                        {noise24h.graph.map((bucket, index) => (
                            <View key={`${bucket.label}-${index}`} style={styles.barColumn}>
                                <View
                                    style={[
                                        styles.bar,
                                        {
                                            height: Math.max(4, (bucket.avg_decibels / max24h) * 92),
                                            backgroundColor: getBarColor(bucket.avg_decibels),
                                        },
                                    ]}
                                />
                                <Text style={styles.barLabel}>{bucket.label}</Text>
                            </View>
                        ))}
                    </ScrollView>
                )}
            </View>

            <View style={styles.reportSection}>
                <Text style={styles.sectionTitle}>7d Noise Trend (Daily Avg dB)</Text>
                <Text style={styles.sectionMeta}>Average: {noise7d.average_decibels.toFixed(1)} dB</Text>
                {isLoading ? (
                    <ActivityIndicator color={Colors.primaryDark} />
                ) : (
                    <View style={styles.graphRow}>
                        {noise7d.graph.map((bucket, index) => (
                            <View key={`${bucket.label}-${index}`} style={styles.barColumn}>
                                <View
                                    style={[
                                        styles.bar,
                                        {
                                            height: Math.max(4, (bucket.avg_decibels / max7d) * 92),
                                            backgroundColor: getBarColor(bucket.avg_decibels),
                                        },
                                    ]}
                                />
                                <Text style={styles.barLabel}>{bucket.label}</Text>
                            </View>
                        ))}
                    </View>
                )}
            </View>

            <View style={styles.reportSection}>
                <Text style={styles.sectionTitle}>Report Queue</Text>
                {recentReports.length === 0 ? (
                    <Text style={styles.reportTime}>No client reports yet.</Text>
                ) : (
                    recentReports.map((report, index) => (
                        <View key={`${report.created_at || 'report'}-${index}`} style={styles.reportItem}>
                            <View style={[styles.timelineDot, { backgroundColor: report.status === 'pending' ? Colors.statusWarning : Colors.noiseNormal }]} />
                            <View style={styles.reportTextWrap}>
                                <Text style={styles.reportTime}>{report.created_at ? new Date(report.created_at).toLocaleString() : 'Unknown time'}</Text>
                                <Text style={styles.reportDesc}>{report.report_text || 'Image-only report submission'}</Text>
                            </View>
                        </View>
                    ))
                )}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.transparent,
    },
    headerCard: {
        backgroundColor: Colors.bgMuted,
        borderRadius: 14,
        padding: 18,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: Colors.borderLight,
    },
    sectionLabel: {
        fontSize: 11,
        textTransform: 'uppercase',
        letterSpacing: 0.6,
        color: Colors.textMuted,
        marginBottom: 6,
    },
    title: {
        fontSize: 26,
        fontWeight: '700',
        color: Colors.textPrimary,
        marginBottom: 6,
    },
    subtitle: {
        fontSize: 14,
        color: Colors.textSecondary,
        lineHeight: 20,
    },
    queueRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 14,
    },
    queueCard: {
        backgroundColor: Colors.bgCard,
        borderRadius: 12,
        padding: 16,
        flex: 1,
        borderWidth: 1,
        borderColor: Colors.borderLight,
        alignItems: 'center',
    },
    queueValue: {
        fontSize: 24,
        fontWeight: '700',
        marginTop: 8,
        color: Colors.primaryDark,
    },
    queueLabel: {
        fontSize: 12,
        color: Colors.textSecondary,
        marginTop: 4,
    },
    reportSection: {
        backgroundColor: Colors.bgCard,
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: Colors.borderLight,
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
    },
    sectionTitle: {
        fontSize: 15,
        fontWeight: '700',
        marginBottom: 6,
        color: Colors.textPrimary,
    },
    sectionMeta: {
        fontSize: 12,
        color: Colors.textMuted,
        marginBottom: 10,
    },
    reportItem: {
        flexDirection: 'row',
        gap: 10,
        alignItems: 'flex-start',
        borderBottomWidth: 1,
        borderBottomColor: Colors.borderLight,
        paddingVertical: 12,
    },
    timelineDot: {
        width: 10,
        height: 10,
        borderRadius: 999,
        marginTop: 5,
    },
    reportTextWrap: {
        flex: 1,
    },
    reportTime: {
        fontSize: 12,
        color: Colors.textMuted,
        marginBottom: 4,
    },
    reportDesc: {
        fontSize: 15,
        color: Colors.textPrimary,
    },
    graphRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 8,
        minHeight: 128,
        paddingTop: 8,
    },
    barColumn: {
        alignItems: 'center',
        width: 28,
    },
    bar: {
        width: 16,
        borderTopLeftRadius: 5,
        borderTopRightRadius: 5,
    },
    barLabel: {
        fontSize: 10,
        color: Colors.textMuted,
        marginTop: 6,
    },
});
