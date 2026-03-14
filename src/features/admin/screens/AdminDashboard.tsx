import React, { useContext, useEffect, useMemo, useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    useWindowDimensions,
    View,
} from 'react-native';
import { Colors } from '../../../core/theme/Colors';
import { AuthContext } from '../../../core/auth/AuthContext';
import AdminUsers from '../components/AdminUsers';
import AdminAnalytics from '../components/AdminAnalytics';
import { MaterialIcons } from '@expo/vector-icons';
import { apiClient } from '../../../core/api/apiClient';

type AdminTab = 'Dashboard' | 'Users' | 'Reports';

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

const NAV_ITEMS: { key: AdminTab; icon: keyof typeof MaterialIcons.glyphMap }[] = [
    { key: 'Dashboard', icon: 'dashboard' },
    { key: 'Users', icon: 'people' },
    { key: 'Reports', icon: 'assessment' },
];

export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState<AdminTab>('Dashboard');
    const { logout } = useContext(AuthContext);
    const { width } = useWindowDimensions();
    const isCompact = width < 980;
    const dateLabel = useMemo(
        () =>
            new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'short',
                day: 'numeric',
                year: 'numeric',
            }),
        []
    );

    const [isSummaryLoading, setIsSummaryLoading] = useState(true);
    const [reportSummary, setReportSummary] = useState({ total_reports: 0, pending_reports: 0, reports_today: 0 });
    const [recentReports, setRecentReports] = useState<Array<{ report_text?: string; created_at?: string; status?: string }>>([]);
    const [noise24h, setNoise24h] = useState<NoisePayload>({
        average_decibels: 0,
        total_readings: 0,
        noise_summary: { Normal: 0, Elevated: 0, High: 0 },
        graph: [],
    });
    const [noise7d, setNoise7d] = useState<NoisePayload>({
        average_decibels: 0,
        total_readings: 0,
        noise_summary: { Normal: 0, Elevated: 0, High: 0 },
        graph: [],
    });

    useEffect(() => {
        const fetchDashboardSummary = async () => {
            try {
                const [reportsRes, noise24Res, noise7Res] = await Promise.all([
                    apiClient.get('/api/admin/reports/summary'),
                    apiClient.get('/api/admin/noise-summary?window=24h'),
                    apiClient.get('/api/admin/noise-summary?window=7d'),
                ]);

                setReportSummary(reportsRes.data?.summary || { total_reports: 0, pending_reports: 0, reports_today: 0 });
                setRecentReports(reportsRes.data?.recent_reports || []);
                setNoise24h(noise24Res.data || noise24h);
                setNoise7d(noise7Res.data || noise7d);
            } catch {
                // Keep default values when backend is unavailable.
            } finally {
                setIsSummaryLoading(false);
            }
        };

        if (activeTab === 'Dashboard') {
            void fetchDashboardSummary();
        }
    }, [activeTab]);

    const maxNoiseBucket = useMemo(
        () => Math.max(...noise24h.graph.map((item) => item.avg_decibels), 1),
        [noise24h.graph]
    );

    const renderContent = () => {
        switch (activeTab) {
            case 'Users':
                return <AdminUsers />;
            case 'Reports':
                return <AdminAnalytics />;
            case 'Dashboard':
            default:
                return (
                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.homeContentWrap}>
                        <View style={styles.heroCard}>
                            <Text style={styles.heroTitle}>Welcome to the Admin Portal</Text>
                            <Text style={styles.heroSubtitle}>
                                Monitor noise status, review client submissions, and make quick decisions from one page.
                            </Text>
                        </View>

                        <View style={styles.kpiRow}>
                            <View style={styles.kpiCard}>
                                <Text style={styles.kpiLabel}>Reports Today</Text>
                                <Text style={styles.kpiValue}>{reportSummary.reports_today}</Text>
                            </View>
                            <View style={styles.kpiCard}>
                                <Text style={styles.kpiLabel}>Pending Review</Text>
                                <Text style={[styles.kpiValue, { color: Colors.statusWarning }]}>{reportSummary.pending_reports}</Text>
                            </View>
                            <View style={styles.kpiCard}>
                                <Text style={styles.kpiLabel}>24h Avg Decibels</Text>
                                <Text style={styles.kpiValue}>{noise24h.average_decibels.toFixed(1)} dB</Text>
                            </View>
                            <View style={styles.kpiCard}>
                                <Text style={styles.kpiLabel}>7d Avg Decibels</Text>
                                <Text style={styles.kpiValue}>{noise7d.average_decibels.toFixed(1)} dB</Text>
                            </View>
                        </View>

                        <View style={styles.summaryCard}>
                            <Text style={styles.sectionTitle}>Noise Summary (Last 24 Hours)</Text>
                            <Text style={styles.summaryMeta}>
                                Normal: {noise24h.noise_summary.Normal} | Elevated: {noise24h.noise_summary.Elevated} | High: {noise24h.noise_summary.High}
                            </Text>
                            {isSummaryLoading ? (
                                <Text style={styles.loadingText}>Loading summary...</Text>
                            ) : (
                                <View style={styles.noiseBarsRow}>
                                    {noise24h.graph.slice(-8).map((bucket, index) => (
                                        <View key={`${bucket.label}-${index}`} style={styles.noiseBarCol}>
                                            <View
                                                style={[
                                                    styles.noiseBar,
                                                    {
                                                        height: Math.max(6, (bucket.avg_decibels / maxNoiseBucket) * 70),
                                                        backgroundColor:
                                                            bucket.avg_decibels >= 70
                                                                ? Colors.noiseCritical
                                                                : bucket.avg_decibels >= 55
                                                                    ? Colors.noiseElevated
                                                                    : Colors.noiseNormal,
                                                    },
                                                ]}
                                            />
                                            <Text style={styles.noiseBarLabel}>{bucket.label}</Text>
                                        </View>
                                    ))}
                                </View>
                            )}
                        </View>

                        <View style={styles.summaryCard}>
                            <Text style={styles.sectionTitle}>Recent Client Reports</Text>
                            {recentReports.length === 0 ? (
                                <Text style={styles.loadingText}>No submitted reports yet.</Text>
                            ) : (
                                recentReports.slice(0, 4).map((report, index) => (
                                    <View key={`${report.created_at || 'item'}-${index}`} style={styles.reportRow}>
                                        <View
                                            style={[
                                                styles.reportDot,
                                                {
                                                    backgroundColor:
                                                        report.status === 'pending'
                                                            ? Colors.statusWarning
                                                            : Colors.noiseNormal,
                                                },
                                            ]}
                                        />
                                        <View style={styles.reportBody}>
                                            <Text style={styles.reportTimeLabel}>
                                                {report.created_at ? new Date(report.created_at).toLocaleString() : 'Unknown time'}
                                            </Text>
                                            <Text style={styles.reportText} numberOfLines={2}>
                                                {report.report_text || 'Image-only report submission'}
                                            </Text>
                                        </View>
                                    </View>
                                ))
                            )}
                        </View>
                    </ScrollView>
                );
        }
    };

    const renderNav = () => (
        <View style={[styles.navWrap, isCompact && styles.navWrapCompact]}>
            <View>
                <Text style={styles.logo}>Bagumbayan Admin</Text>
                <Text style={styles.logoSub}>Noise Monitoring Control</Text>
            </View>

            <View style={[styles.navLinks, isCompact && styles.navLinksCompact]}>
                {NAV_ITEMS.map((item) => {
                    const isActive = activeTab === item.key;
                    return (
                        <TouchableOpacity
                            key={item.key}
                            onPress={() => setActiveTab(item.key)}
                            style={[styles.navItem, isCompact && styles.navItemCompact, isActive && styles.navItemActive]}
                        >
                            <MaterialIcons
                                name={item.icon}
                                size={18}
                                color={isActive ? Colors.textOnDark : Colors.textOnDarkSub}
                            />
                            <Text style={[styles.navText, isActive && styles.navTextActive]}>{item.key}</Text>
                        </TouchableOpacity>
                    );
                })}
            </View>

            <TouchableOpacity onPress={logout} style={styles.logoutButton}>
                <MaterialIcons name="logout" size={18} color={Colors.statusCritical} />
                <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={[styles.container, isCompact && styles.containerCompact]}>
            {renderNav()}
            <View style={[styles.content, isCompact && styles.contentCompact]}>
                <View style={styles.topBar}>
                    <View>
                        <Text style={styles.topBarTitle}>{activeTab}</Text>
                        <Text style={styles.topBarSub}>Administrative workspace</Text>
                    </View>
                    <Text style={styles.dateText}>{dateLabel}</Text>
                </View>

                <View style={[styles.contentCard, isCompact && styles.contentCardCompact]}>
                    {renderContent()}
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'row',
        backgroundColor: Colors.bgBase,
    },
    containerCompact: {
        flexDirection: 'column',
    },
    navWrap: {
        width: 260,
        backgroundColor: Colors.primaryDark,
        padding: 24,
        borderRightWidth: 1,
        borderRightColor: Colors.transparentWhite12,
    },
    navWrapCompact: {
        width: '100%',
        borderRightWidth: 0,
        borderBottomWidth: 1,
        borderBottomColor: Colors.transparentWhite12,
        paddingBottom: 14,
    },
    logo: {
        fontSize: 20,
        fontWeight: '700',
        color: Colors.textOnDark,
        marginBottom: 2,
    },
    logoSub: {
        color: Colors.textOnDarkSub,
        fontSize: 12,
    },
    navLinks: {
        marginTop: 28,
        gap: 10,
        flex: 1,
    },
    navLinksCompact: {
        flexDirection: 'row',
        marginTop: 16,
        flexWrap: 'wrap',
        gap: 10,
        flex: 0,
    },
    navItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        borderRadius: 10,
        paddingVertical: 10,
        paddingHorizontal: 12,
        backgroundColor: Colors.transparent,
    },
    navItemCompact: {
        borderWidth: 1,
        borderColor: Colors.transparentWhite22,
    },
    navItemActive: {
        backgroundColor: Colors.transparentWhite16,
    },
    navText: {
        fontSize: 15,
        color: Colors.textOnDarkSub,
    },
    navTextActive: {
        color: Colors.textOnDark,
        fontWeight: '700',
    },
    content: {
        flex: 1,
        padding: 24,
        backgroundColor: Colors.bgBase,
    },
    contentCompact: {
        padding: 14,
    },
    topBar: {
        marginBottom: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    topBarTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: Colors.textPrimary,
    },
    topBarSub: {
        fontSize: 13,
        color: Colors.textSecondary,
    },
    dateText: {
        fontSize: 13,
        color: Colors.textMuted,
    },
    contentCard: {
        flex: 1,
        backgroundColor: Colors.bgCard,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: Colors.borderLight,
        padding: 20,
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
        elevation: 2,
    },
    contentCardCompact: {
        padding: 14,
    },
    homeContentWrap: {
        gap: 16,
        paddingBottom: 12,
    },
    heroCard: {
        backgroundColor: Colors.bgMuted,
        borderRadius: 14,
        padding: 18,
    },
    heroTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: Colors.primaryDark,
        marginBottom: 8,
    },
    heroSubtitle: {
        fontSize: 14,
        color: Colors.textSecondary,
        lineHeight: 20,
    },
    kpiRow: {
        flexDirection: 'row',
        gap: 12,
        flexWrap: 'wrap',
    },
    kpiCard: {
        flex: 1,
        minWidth: 160,
        borderWidth: 1,
        borderColor: Colors.borderLight,
        borderRadius: 12,
        backgroundColor: Colors.bgCard,
        padding: 14,
    },
    kpiLabel: {
        fontSize: 12,
        color: Colors.textSecondary,
        marginBottom: 6,
    },
    kpiValue: {
        fontSize: 26,
        fontWeight: '700',
        color: Colors.primaryDark,
    },
    sectionTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: Colors.textPrimary,
        marginBottom: 10,
    },
    summaryCard: {
        backgroundColor: Colors.bgCard,
        borderWidth: 1,
        borderColor: Colors.borderLight,
        borderRadius: 12,
        padding: 14,
    },
    summaryMeta: {
        marginTop: 6,
        marginBottom: 8,
        fontSize: 13,
        color: Colors.textSecondary,
    },
    loadingText: {
        fontSize: 13,
        color: Colors.textMuted,
    },
    noiseBarsRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 8,
        marginTop: 8,
    },
    noiseBarCol: {
        alignItems: 'center',
        width: 24,
    },
    noiseBar: {
        width: 14,
        borderTopLeftRadius: 4,
        borderTopRightRadius: 4,
    },
    noiseBarLabel: {
        marginTop: 4,
        fontSize: 10,
        color: Colors.textMuted,
    },
    reportRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
        paddingVertical: 8,
        borderTopWidth: 1,
        borderTopColor: Colors.borderLight,
    },
    reportDot: {
        width: 10,
        height: 10,
        borderRadius: 999,
        marginTop: 6,
    },
    reportBody: {
        flex: 1,
    },
    reportTimeLabel: {
        fontSize: 12,
        color: Colors.textMuted,
        marginBottom: 4,
    },
    reportText: {
        fontSize: 14,
        color: Colors.textPrimary,
    },
    logoutButton: {
        marginTop: 18,
        paddingVertical: 10,
        paddingHorizontal: 12,
        backgroundColor: 'rgba(255,0,0,0.1)',
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 8,
    },
    logoutText: {
        color: Colors.statusCritical,
        fontWeight: '700',
    },
});
