import React, { useState, useContext } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    Animated,
    ScrollView,
    Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../../../core/theme/Colors';
import { AuthContext } from '../../../core/auth/AuthContext';
import AnimatedScreen from '../../../components/AnimatedScreen';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiClient } from '../../../core/api/apiClient';

export default function LoginScreen() {
    const { loginWithUser } = useContext(AuthContext);
    const insets = useSafeAreaInsets();

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const fadeAnim = React.useRef(new Animated.Value(0)).current;
    const slideAnim = React.useRef(new Animated.Value(20)).current;

    React.useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
            Animated.timing(slideAnim, { toValue: 0, duration: 700, useNativeDriver: true }),
        ]).start();
    }, [fadeAnim, slideAnim]);

    const handleLogin = async () => {
        if (!username || !password) return;
        setIsLoading(true);
        try {
            const response = await apiClient.post('/api/auth/login', {
                username: username.trim().toLowerCase(),
                password,
            });

            const authenticatedUser = response.data?.user;
            if (!authenticatedUser) {
                Alert.alert('Login failed', 'Invalid login response from server.');
                return;
            }

            await loginWithUser({
                id: String(authenticatedUser.id),
                email: String(authenticatedUser.email),
                name: String(authenticatedUser.name),
                username: String(authenticatedUser.username),
                isAdmin: Boolean(authenticatedUser.is_admin),
            });
        } catch (error: any) {
            const statusCode = error?.response?.status;
            const serverMessage = error?.response?.data?.error;
            const requestBaseUrl = error?.config?.baseURL || apiClient.defaults.baseURL;
            const message =
                serverMessage ||
                (statusCode
                    ? `Unable to log in (${statusCode}). Please verify your credentials.`
                    : `Unable to reach server. Check API URL: ${requestBaseUrl}`);
            Alert.alert('Login failed', message);
        } finally {
            setIsLoading(false);
        }
    };

    // Web layout: side-by-side branding + compact form
    if (Platform.OS === 'web') {
        return (
            <View style={webStyles.root}>
                {/* Left branding panel */}
                <View style={webStyles.brandPanel}>
                    <Animated.View style={[webStyles.brandContent, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                        <View style={webStyles.brandIcon}>
                            <MaterialIcons name="graphic-eq" size={32} color={Colors.primaryPale} />
                        </View>
                        <Text style={webStyles.brandSystem}>Bagumbayan Norte</Text>
                        <Text style={webStyles.brandTitle}>Noise Monitoring{'\n'}System</Text>
                        <Text style={webStyles.brandDesc}>
                            Administrative portal for monitoring noise levels, managing reports, and overseeing client accounts.
                        </Text>
                        <View style={webStyles.brandFeatures}>
                            {['Real-time noise analytics', 'Client report management', 'User account control'].map((f) => (
                                <View key={f} style={webStyles.brandFeatureRow}>
                                    <MaterialIcons name="check-circle" size={14} color={Colors.primaryPale} />
                                    <Text style={webStyles.brandFeatureText}>{f}</Text>
                                </View>
                            ))}
                        </View>
                    </Animated.View>
                </View>

                {/* Right form panel */}
                <View style={webStyles.formPanel}>
                    <Animated.View style={[webStyles.formCard, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                        <View style={webStyles.formHeader}>
                            <Text style={webStyles.formTitle}>Sign In</Text>
                            <Text style={webStyles.formSubtitle}>Enter your admin credentials to continue</Text>
                        </View>

                        <View style={webStyles.inputGroup}>
                            <Text style={webStyles.label}>Username</Text>
                            <View style={webStyles.inputRow}>
                                <MaterialIcons name="person-outline" size={18} color={Colors.textMuted} />
                                <TextInput
                                    style={webStyles.input}
                                    placeholder="Enter username"
                                    placeholderTextColor={Colors.textMuted}
                                    autoCapitalize="none"
                                    value={username}
                                    onChangeText={setUsername}
                                />
                            </View>
                        </View>

                        <View style={webStyles.inputGroup}>
                            <Text style={webStyles.label}>Password</Text>
                            <View style={webStyles.inputRow}>
                                <MaterialIcons name="lock-outline" size={18} color={Colors.textMuted} />
                                <TextInput
                                    style={webStyles.input}
                                    placeholder="Enter password"
                                    placeholderTextColor={Colors.textMuted}
                                    secureTextEntry
                                    value={password}
                                    onChangeText={setPassword}
                                />
                            </View>
                        </View>

                        <TouchableOpacity
                            style={[webStyles.loginButton, (!username || !password || isLoading) && webStyles.loginButtonDisabled]}
                            activeOpacity={0.8}
                            onPress={handleLogin}
                            disabled={!username || !password || isLoading}
                        >
                            {isLoading ? (
                                <Text style={webStyles.loginButtonText}>Signing in...</Text>
                            ) : (
                                <View style={webStyles.loginButtonInner}>
                                    <Text style={webStyles.loginButtonText}>Sign In</Text>
                                    <MaterialIcons name="arrow-forward" size={18} color={Colors.textOnDark} />
                                </View>
                            )}
                        </TouchableOpacity>

                        <Text style={webStyles.footerNote}>
                            Contact your administrator to create an account.
                        </Text>
                    </Animated.View>
                </View>
            </View>
        );
    }

    // Mobile layout: compact scrollable form
    return (
        <AnimatedScreen>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={mobileStyles.container}
            >
                <ScrollView
                    contentContainerStyle={mobileStyles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    bounces={false}
                >
                    <View style={[mobileStyles.hero, { paddingTop: insets.top + 28 }]}>
                        <View style={mobileStyles.heroBadge}>
                            <MaterialIcons name="graphic-eq" size={11} color={Colors.primaryPale} />
                            <Text style={mobileStyles.heroBadgeText}>Noise Monitoring System</Text>
                        </View>
                        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
                            <Text style={mobileStyles.heroTitle}>Welcome!</Text>
                            <Text style={mobileStyles.heroSub}>Sign in to your account to continue.</Text>
                        </Animated.View>
                    </View>

                    <View style={mobileStyles.formContainer}>
                        <View style={mobileStyles.form}>
                            <View style={mobileStyles.inputGroup}>
                                <Text style={mobileStyles.label}>Username</Text>
                                <View style={mobileStyles.inputContainer}>
                                    <MaterialIcons name="person" size={18} color={Colors.textMuted} style={mobileStyles.inputIcon} />
                                    <TextInput
                                        style={mobileStyles.input}
                                        placeholder="Enter your username"
                                        placeholderTextColor={Colors.textMuted}
                                        autoCapitalize="none"
                                        value={username}
                                        onChangeText={setUsername}
                                    />
                                </View>
                            </View>

                            <View style={mobileStyles.inputGroup}>
                                <Text style={mobileStyles.label}>Password</Text>
                                <View style={mobileStyles.inputContainer}>
                                    <MaterialIcons name="lock" size={18} color={Colors.textMuted} style={mobileStyles.inputIcon} />
                                    <TextInput
                                        style={mobileStyles.input}
                                        placeholder="Enter your password"
                                        placeholderTextColor={Colors.textMuted}
                                        secureTextEntry
                                        value={password}
                                        onChangeText={setPassword}
                                    />
                                </View>
                            </View>

                            <TouchableOpacity
                                style={[
                                    mobileStyles.loginButton,
                                    (!username || !password) && mobileStyles.loginButtonDisabled,
                                ]}
                                activeOpacity={0.8}
                                onPress={handleLogin}
                                disabled={!username || !password}
                            >
                                <Text style={mobileStyles.loginButtonText}>{isLoading ? 'Signing in...' : 'Sign In'}</Text>
                            </TouchableOpacity>
                        </View>

                        <Text style={mobileStyles.footerText}>
                            Contact your administrator to create an account.
                        </Text>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </AnimatedScreen>
    );
}

// ─── Web styles ──────────────────────────────────────────────
const webStyles = StyleSheet.create({
    root: {
        flex: 1,
        flexDirection: 'row',
        backgroundColor: Colors.bgBase,
    },
    brandPanel: {
        width: '45%',
        backgroundColor: Colors.primaryDark,
        padding: 48,
        justifyContent: 'center',
    },
    brandContent: {
        maxWidth: 360,
    },
    brandIcon: {
        width: 56,
        height: 56,
        borderRadius: 16,
        backgroundColor: Colors.transparentWhite12,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
    },
    brandSystem: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.primaryPale,
        letterSpacing: 0.5,
        marginBottom: 8,
        textTransform: 'uppercase',
    },
    brandTitle: {
        fontSize: 36,
        fontWeight: '800',
        color: Colors.textOnDark,
        lineHeight: 44,
        marginBottom: 16,
    },
    brandDesc: {
        fontSize: 14,
        color: Colors.textOnDarkSub,
        lineHeight: 22,
        marginBottom: 28,
    },
    brandFeatures: {
        gap: 10,
    },
    brandFeatureRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    brandFeatureText: {
        fontSize: 13,
        color: Colors.textOnDarkSub,
    },
    formPanel: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
        backgroundColor: Colors.bgBase,
    },
    formCard: {
        width: '100%',
        maxWidth: 380,
        backgroundColor: Colors.bgCard,
        borderRadius: 20,
        padding: 32,
        borderWidth: 1,
        borderColor: Colors.borderLight,
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.08,
        shadowRadius: 24,
        elevation: 8,
    },
    formHeader: {
        marginBottom: 24,
    },
    formTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: Colors.textPrimary,
        marginBottom: 4,
    },
    formSubtitle: {
        fontSize: 13,
        color: Colors.textSecondary,
    },
    inputGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.textSecondary,
        marginBottom: 6,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: Colors.bgBase,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: Colors.borderLight,
        height: 44,
        paddingHorizontal: 12,
    },
    input: {
        flex: 1,
        fontSize: 14,
        color: Colors.textPrimary,
        height: '100%',
    },
    loginButton: {
        backgroundColor: Colors.primaryDark,
        borderRadius: 10,
        height: 46,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 8,
        marginBottom: 20,
    },
    loginButtonDisabled: {
        backgroundColor: Colors.textMuted,
    },
    loginButtonInner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    loginButtonText: {
        fontSize: 15,
        fontWeight: '700',
        color: Colors.textOnDark,
    },
    footerNote: {
        fontSize: 12,
        color: Colors.textMuted,
        textAlign: 'center',
    },
});

// ─── Mobile styles ────────────────────────────────────────────
const mobileStyles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.bgBase,
    },
    scrollContent: {
        flexGrow: 1,
        paddingBottom: 40,
    },
    hero: {
        backgroundColor: Colors.primaryDark,
        paddingHorizontal: 24,
        paddingBottom: 44,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
        elevation: 8,
    },
    heroBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: Colors.transparentWhite12,
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
        marginBottom: 16,
    },
    heroBadgeText: { fontSize: 10, color: Colors.primaryPale, fontWeight: '600' },
    heroTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: Colors.textOnDark,
        lineHeight: 36,
        marginBottom: 8,
    },
    heroSub: {
        fontSize: 13,
        color: Colors.textOnDarkSub,
        lineHeight: 20,
    },
    formContainer: {
        paddingHorizontal: 20,
        marginTop: -24,
    },
    form: {
        backgroundColor: Colors.bgCard,
        borderRadius: 20,
        padding: 20,
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.07,
        shadowRadius: 16,
        elevation: 6,
    },
    inputGroup: {
        marginBottom: 14,
    },
    label: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.textSecondary,
        marginBottom: 6,
        marginLeft: 2,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.bgBase,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.borderLight,
        height: 48,
        paddingHorizontal: 14,
    },
    inputIcon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        fontSize: 15,
        color: Colors.textPrimary,
        height: '100%',
    },
    loginButton: {
        backgroundColor: Colors.primaryDark,
        borderRadius: 12,
        height: 48,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 4,
        shadowColor: Colors.primaryDark,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 5,
    },
    loginButtonDisabled: {
        backgroundColor: Colors.textMuted,
        shadowOpacity: 0,
        elevation: 0,
    },
    loginButtonText: {
        fontSize: 15,
        fontWeight: '700',
        color: Colors.textOnDark,
    },
    footerText: {
        fontSize: 13,
        color: Colors.textSecondary,
        textAlign: 'center',
        marginTop: 24,
        paddingHorizontal: 16,
    },
});
