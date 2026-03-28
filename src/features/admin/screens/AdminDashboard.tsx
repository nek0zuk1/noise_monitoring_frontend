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
import AdminHandover from '../components/AdminHandover';
import { MaterialIcons } from '@expo/vector-icons';
import { apiClient } from '../../../core/api/apiClient';

type AdminTab = 'Dashboard' | 'Users' | 'Reports' | 'Handover';

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

const NAV_ITEMS: { key: AdminTab; icon: keyof typeof MaterialIcons.glyphMap; label: string }[] = [
    { key: 'Dashboard', icon: 'dashboard', label: 'Dashboard' },
    { key: 'Users', icon: 'people', label: 'User Management' },
    { key: 'Reports', icon: 'assessment', label: 'Reports' },
    { key: 'Handover', icon: 'swap-horiz', label: 'Admin Handover' },
];

const TAB_META: Record<AdminTab, { title: string; description: string }> = {
    Dashboard: { title: 'Dashboard', description: 'System overview and recent activity' },
    Users: { title: 'User Management', description: 'Create and manage client accounts' },
    Reports: { title: 'Reports & Analytics', description: 'Noise trends and report queue' },
    Handover: { title: 'Admin Account Handover', description: 'Transfer admin credentials to the next holder' },
};

export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState<AdminTab>('Dashboard');
    const { logout, user } = useContext(AuthContext);
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
        if (activeTab !== 'Dashboard') return;
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
        void fetchDashboardSummary();
    }, [activeTab]);

    const maxNoiseBucket = useMemo(
        () => Math.max(...noise24h.graph.map((item) => item.avg_decibels), 1),
        [noise24h.graph]
    );

    const renderDashboard = () => (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.homeContentWrap}>
            <View style={styles.heroCard}>
                <View style={styles.heroCardLeft}>
                    <Text style={styles.heroTitle}>Welcome back{user?.name ? `, ${user.name}` : ''}!</Text>
                    <Text style={styles.heroSubtitle}>
                        Monitor noise levels, review client reports, and manage the system from this portal.
                    </Text>
                </View>
                <View style={styles.heroCardRight}>
                    <MaterialIcons name="graphic-eq" size={48} color={Colors.primaryMid} />
                </View>
            </View>

            <View style={styles.kpiRow}>
                <View style={styles.kpiCard}>
                    <MaterialIcons name="today" size={18} color={Colors.textMuted} style={styles.kpiIcon} />
                    <Text style={styles.kpiLabel}>Reports Today</Text>
                    <Text style={styles.kpiValue}>{reportSummary.reports_today}</Text>
                </View>
                <View style={styles.kpiCard}>
                    <MaterialIcons name="pending-actions" size={18} color={Colors.statusWarning} style={styles.kpiIcon} />
                    <Text style={styles.kpiLabel}>Pending Review</Text>
                    <Text style={[styles.kpiValue, { color: Colors.statusWarning }]}>{reportSummary.pending_reports}</Text>
                </View>
                <View style={styles.kpiCard}>
                    <MaterialIcons name="volume-up" size={18} color={Colors.textMuted} style={styles.kpiIcon} />
                    <Text style={styles.kpiLabel}>24h Avg dB</Text>
                    <Text style={styles.kpiValue}>{noise24h.average_decibels.toFixed(1)}</Text>
                </View>
                <View style={styles.kpiCard}>
                    <MaterialIcons name="show-chart" size={18} color={Colors.textMuted} style={styles.kpiIcon} />
                    <Text style={styles.kpiLabel}>7d Avg dB</Text>
                    <Text style={styles.kpiValue}>{noise7d.average_decibels.toFixed(1)}</Text>
                </View>
            </View>

            <View style={styles.noiseCard}>
                <View style={styles.noiseTitleRow}>
                    <Text style={styles.sectionTitle}>Noise Activity (Last 24 Hours)</Text>
                    <View style={styles.noiseLegend}>
                        <View style={[styles.legendDot, { backgroundColor: Colors.noiseNormal }]} />
                        <Text style={styles.legendText}>Normal</Text>
                        <View style={[styles.legendDot, { backgroundColor: Colors.noiseElevated }]} />
                        <Text style={styles.legendText}>Elevated</Text>
                        <View style={[styles.legendDot, { backgroundColor: Colors.noiseCritical }]} />
                        <Text style={styles.legendText}>High</Text>
                    </View>
                </View>
                <Text style={styles.summaryMeta}>
                    {noise24h.noise_summary.Normal} Normal · {noise24h.noise_summary.Elevated} Elevated · {noise24h.noise_summary.High} High
                </Text>
                {isSummaryLoading ? (
                    <Text style={styles.loadingText}>Loading data...</Text>
                ) : (
                    <View style={styles.noiseBarsRow}>
                        {noise24h.graph.slice(-12).map((bucket, index) => (
                            <View key={`${bucket.label}-${index}`} style={styles.noiseBarCol}>
                                <View
                                    style={[
                                        styles.noiseBar,
                                        {
                                            height: Math.max(6, (bucket.avg_decibels / maxNoiseBucket) * 80),
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

            <View style={styles.recentCard}>
                <Text style={styles.sectionTitle}>Recent Client Reports</Text>
                {recentReports.length === 0 ? (
                    <View style={styles.emptyReports}>
                        <MaterialIcons name="inbox" size={28} color={Colors.textMuted} />
                        <Text style={styles.loadingText}>No submitted reports yet.</Text>
                    </View>
                ) : (
                    recentReports.slice(0, 5).map((report, index) => (
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
                                    <Text style={[styles.reportStatus, { color: report.status === 'pending' ? Colors.statusWarning : Colors.noiseNormal }]}>
                                        {' '}· {report.status ?? 'unknown'}
                                    </Text>
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

    const renderContent = () => {
        switch (activeTab) {
            case 'Users': return <AdminUsers />;
            case 'Reports': return <AdminAnalytics />;
            case 'Handover': return <AdminHandover />;
            default: return renderDashboard();
        }
    };

    const renderSideNav = () => (
        <View style={styles.navWrap}>
            <View style={styles.navBrand}>
                <View style={styles.navLogoIcon}>
                    <MaterialIcons name="graphic-eq" size={20} color={Colors.textOnDark} />
                </View>
                <View>
                    <Text style={styles.logo}>Bagumbayan</Text>
                    <Text style={styles.logoSub}>Admin Portal</Text>
                </View>
            </View>

            <View style={styles.navDivider} />

            <View style={styles.navLinks}>
                {NAV_ITEMS.map((item) => {
                    const isActive = activeTab === item.key;
                    return (
                        <TouchableOpacity
                            key={item.key}
                            onPress={() => setActiveTab(item.key)}
                            style={[styles.navItem, isActive && styles.navItemActive]}
                        >
                            <MaterialIcons
                                name={item.icon}
                                size={18}
                                color={isActive ? Colors.textOnDark : Colors.textOnDarkSub}
                            />
                            <Text style={[styles.navText, isActive && styles.navTextActive]}>{item.label}</Text>
                        </TouchableOpacity>
                    );
                })}
            </View>

            <View style={styles.navBottom}>
                <View style={styles.navDivider} />
                <TouchableOpacity onPress={logout} style={styles.logoutButton}>
                    <MaterialIcons name="logout" size={16} color={Colors.statusCritical} />
                    <Text style={styles.logoutText}>Sign Out</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderTopBar = () => (
        <View style={[styles.topBar, isCompact && styles.topBarCompact]}>
            {isCompact && (
                <View style={styles.topBarNavRow}>
                    {NAV_ITEMS.map((item) => {
                        const isActive = activeTab === item.key;
                        return (
                            <TouchableOpacity
                                key={item.key}
                                onPress={() => setActiveTab(item.key)}
                                style={[styles.topNavItem, isActive && styles.topNavItemActive]}
                            >
                                <MaterialIcons
                                    name={item.icon}
                                    size={16}
                                    color={isActive ? Colors.primaryDark : Colors.textMuted}
                                />
                                <Text style={[styles.topNavText, isActive && styles.topNavTextActive]}>{item.key}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            )}
            <View style={styles.topBarInfo}>
                <View>
                    <Text style={styles.topBarTitle}>{TAB_META[activeTab].title}</Text>
                    <Text style={styles.topBarSub}>{TAB_META[activeTab].description}</Text>
                </View>
                <Text style={styles.dateText}>{dateLabel}</Text>
            </View>
        </View>
    );

    return (
        <View style={[styles.container, isCompact && styles.containerCompact]}>
            {!isCompact && renderSideNav()}
            <View style={[styles.mainArea, isCompact && styles.mainAreaCompact]}>
                {renderTopBar()}
                <View style={styles.contentCard}>
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

    // Side navigation (wide screen)
    navWrap: {
        width: 240,
        backgroundColor: Colors.primaryDark,
        paddingTop: 24,
        paddingBottom: 20,
        paddingHorizontal: 16,
        flexDirection: 'column',
    },
    navBrand: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 4,
        marginBottom: 20,
    },
    navLogoIcon: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: Colors.transparentWhite16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    logo: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.textOnDark,
    },
    logoSub: {
        color: Colors.textOnDarkSub,
        fontSize: 11,
    },
    navDivider: {
        height: 1,
        backgroundColor: Colors.transparentWhite12,
        marginVertical: 8,
    },
    navLinks: {
        flex: 1,
        gap: 2,
        marginTop: 4,
    },
    navItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        borderRadius: 10,
        paddingVertical: 10,
        paddingHorizontal: 12,
    },
    navItemActive: {
        backgroundColor: Colors.transparentWhite16,
    },
    navText: {
        fontSize: 14,
        color: Colors.textOnDarkSub,
    },
    navTextActive: {
        color: Colors.textOnDark,
        fontWeight: '600',
    },
    navBottom: {
        marginTop: 8,
    },
    logoutButton: {
        marginTop: 8,
        paddingVertical: 10,
        paddingHorizontal: 12,
        backgroundColor: 'rgba(220,53,69,0.12)',
        borderRadius: 10,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    logoutText: {
        color: Colors.statusCritical,
        fontWeight: '600',
        fontSize: 14,
    },

    // Main content area
    mainArea: {
        flex: 1,
        flexDirection: 'column',
        backgroundColor: Colors.bgBase,
        padding: 24,
        gap: 16,
    },
    mainAreaCompact: {
        padding: 14,
        gap: 12,
    },

    // Top bar
    topBar: {
        gap: 10,
    },
    topBarCompact: {
        gap: 12,
    },
    topBarNavRow: {
        flexDirection: 'row',
        gap: 6,
        flexWrap: 'wrap',
        backgroundColor: Colors.bgCard,
        borderRadius: 12,
        padding: 8,
        borderWidth: 1,
        borderColor: Colors.borderLight,
    },
    topNavItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 8,
    },
    topNavItemActive: {
        backgroundColor: Colors.bgMuted,
    },
    topNavText: {
        fontSize: 13,
        color: Colors.textMuted,
    },
    topNavTextActive: {
        color: Colors.primaryDark,
        fontWeight: '600',
    },
    topBarInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    topBarTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: Colors.textPrimary,
    },
    topBarSub: {
        fontSize: 13,
        color: Colors.textSecondary,
        marginTop: 1,
    },
    dateText: {
        fontSize: 13,
        color: Colors.textMuted,
    },

    // Content card
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

    // Dashboard content
    homeContentWrap: {
        gap: 16,
        paddingBottom: 12,
    },
    heroCard: {
        backgroundColor: Colors.primaryDark,
        borderRadius: 14,
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
    },
    heroCardLeft: {
        flex: 1,
    },
    heroCardRight: {
        opacity: 0.4,
        marginLeft: 12,
    },
    heroTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: Colors.textOnDark,
        marginBottom: 6,
    },
    heroSubtitle: {
        fontSize: 13,
        color: Colors.textOnDarkSub,
        lineHeight: 19,
    },
    kpiRow: {
        flexDirection: 'row',
        gap: 12,
        flexWrap: 'wrap',
    },
    kpiCard: {
        flex: 1,
        minWidth: 140,
        borderWidth: 1,
        borderColor: Colors.borderLight,
        borderRadius: 12,
        backgroundColor: Colors.bgCard,
        padding: 14,
    },
    kpiIcon: {
        marginBottom: 8,
    },
    kpiLabel: {
        fontSize: 11,
        color: Colors.textSecondary,
        marginBottom: 4,
    },
    kpiValue: {
        fontSize: 24,
        fontWeight: '700',
        color: Colors.primaryDark,
    },
    noiseCard: {
        backgroundColor: Colors.bgCard,
        borderWidth: 1,
        borderColor: Colors.borderLight,
        borderRadius: 12,
        padding: 16,
    },
    noiseTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 4,
        flexWrap: 'wrap',
        gap: 8,
    },
    noiseLegend: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    legendDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    legendText: {
        fontSize: 11,
        color: Colors.textMuted,
        marginRight: 4,
    },
    sectionTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: Colors.textPrimary,
    },
    summaryMeta: {
        fontSize: 12,
        color: Colors.textSecondary,
        marginBottom: 12,
    },
    loadingText: {
        fontSize: 13,
        color: Colors.textMuted,
        marginTop: 8,
    },
    noiseBarsRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 6,
        marginTop: 4,
    },
    noiseBarCol: {
        alignItems: 'center',
        flex: 1,
    },
    noiseBar: {
        width: '80%',
        borderTopLeftRadius: 4,
        borderTopRightRadius: 4,
    },
    noiseBarLabel: {
        marginTop: 4,
        fontSize: 9,
        color: Colors.textMuted,
    },
    recentCard: {
        backgroundColor: Colors.bgCard,
        borderWidth: 1,
        borderColor: Colors.borderLight,
        borderRadius: 12,
        padding: 16,
        gap: 4,
    },
    emptyReports: {
        alignItems: 'center',
        paddingVertical: 20,
        gap: 8,
    },
    reportRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
        paddingVertical: 10,
        borderTopWidth: 1,
        borderTopColor: Colors.borderLight,
    },
    reportDot: {
        width: 9,
        height: 9,
        borderRadius: 999,
        marginTop: 5,
    },
    reportBody: {
        flex: 1,
    },
    reportTimeLabel: {
        fontSize: 12,
        color: Colors.textMuted,
        marginBottom: 3,
    },
    reportStatus: {
        fontSize: 11,
        fontWeight: '600',
    },
    reportText: {
        fontSize: 14,
        color: Colors.textPrimary,
    },
});
