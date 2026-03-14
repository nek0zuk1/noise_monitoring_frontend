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
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../../../core/theme/Colors';
import { AuthContext } from '../../../core/auth/AuthContext';
import AnimatedScreen from '../../../components/AnimatedScreen';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiClient } from '../../../core/api/apiClient';

export default function LoginScreen() {
    const navigation = useNavigation<any>();
    const { loginWithUser } = useContext(AuthContext);
    const insets = useSafeAreaInsets();

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const fadeAnim = React.useRef(new Animated.Value(0)).current;
    const slideAnim = React.useRef(new Animated.Value(28)).current;

    React.useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
            Animated.timing(slideAnim, { toValue: 0, duration: 900, useNativeDriver: true }),
        ]).start();
    }, [fadeAnim, slideAnim]);

    const handleLogin = async () => {
        if (!username || !password) return;
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

            const message = serverMessage
                || (statusCode
                    ? `Unable to log in (${statusCode}). Please verify your username and password.`
                    : `Unable to reach server. Check API URL: ${requestBaseUrl}`);
            Alert.alert('Login failed', message);
        }
    };

    return (
        <AnimatedScreen>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.container}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    bounces={false}
                >
                    <View style={[styles.hero, { paddingTop: insets.top + 44 }]}>
                        <View style={styles.heroBadge}>
                            <MaterialIcons name="graphic-eq" size={12} color={Colors.primaryPale} />
                            <Text style={styles.heroBadgeText}>Authentication</Text>
                        </View>

                        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
                            <Text style={styles.heroTitle}>Welcome!</Text>
                            <Text style={styles.heroSub}>Sign in to Bagumbayan Norte Noise Monitoring System</Text>
                        </Animated.View>
                    </View>

                    <View style={styles.formContainer}>
                        <View style={styles.form}>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Username</Text>
                                <View style={styles.inputContainer}>
                                    <MaterialIcons name="person" size={20} color={Colors.textMuted} style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Enter your username"
                                        placeholderTextColor={Colors.textMuted}
                                        autoCapitalize="none"
                                        value={username}
                                        onChangeText={setUsername}
                                    />
                                </View>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Password</Text>
                                <View style={styles.inputContainer}>
                                    <MaterialIcons name="lock" size={20} color={Colors.textMuted} style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.input}
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
                                    styles.loginButton,
                                    (!username || !password) && styles.loginButtonDisabled
                                ]}
                                activeOpacity={0.8}
                                onPress={handleLogin}
                                disabled={!username || !password}
                            >
                                <Text style={styles.loginButtonText}>Sign In</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.footer}>
                            <Text style={styles.footerText}>Please contact your administrator to create an account.</Text>
                        </View>

                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </AnimatedScreen>
    );
}

const styles = StyleSheet.create({
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
        paddingBottom: 64,
        borderBottomLeftRadius: 36,
        borderBottomRightRadius: 36,
        overflow: 'hidden',
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.22,
        shadowRadius: 20,
        elevation: 10,
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
        lineHeight: 42, marginBottom: 12,
        textShadowColor: Colors.transparentBlack15,
        textShadowOffset: { width: 0, height: 3 }, textShadowRadius: 8,
    },
    heroSub: {
        fontSize: 14, color: Colors.textOnDarkSub, lineHeight: 22,
    },

    formContainer: {
        paddingHorizontal: 24,
        marginTop: -32,
    },
    form: {
        backgroundColor: Colors.bgCard,
        borderRadius: 24,
        padding: 24,
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.08,
        shadowRadius: 20,
        elevation: 8,
    },
    formHeader: {
        marginBottom: 12,
    },
    formTitle: {
        fontSize: 18,
        color: Colors.textPrimary,
        fontWeight: '800',
    },
    formSub: {
        marginTop: 4,
        fontSize: 12,
        color: Colors.textSecondary,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.textSecondary,
        marginBottom: 8,
        marginLeft: 4,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.bgBase,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: Colors.borderLight,
        height: 56,
        paddingHorizontal: 16,
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: Colors.textPrimary,
        height: '100%',
    },
    forgotPassword: {
        alignSelf: 'flex-end',
        marginBottom: 32,
    },
    forgotPasswordText: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.primaryMid,
    },
    loginButton: {
        backgroundColor: Colors.primaryDark,
        borderRadius: 16,
        height: 56,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: Colors.primaryDark,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 12,
        elevation: 6,
    },
    loginButtonDisabled: {
        backgroundColor: Colors.textMuted,
        shadowOpacity: 0,
        elevation: 0,
    },
    loginButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.textOnDark,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 32,
    },
    footerText: {
        fontSize: 14,
        color: Colors.textSecondary,
    },
    footerLink: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.primaryMid,
    },
});
