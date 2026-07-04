import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Alert, ScrollView,
} from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { loginUser, resetPassword, loginWithGoogle } from '../../firebase/auth';
import { SIZES } from '../utils/theme';
import { useTheme } from '../context/ThemeContext';
import Form from '../components/Form';
import AppTextInput from '../components/AppTextInput';

const LoginScreen = ({ navigation }) => {
  const { isDark, toggleTheme, colors } = useTheme();
  const isFocused = useIsFocused();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [recoveryMsg, setRecoveryMsg] = useState('');
  const [recovering, setRecovering] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    if (isFocused) {
      setEmail('');
      setPassword('');
      setShowPassword(false);
      setRecoveryMsg('');
      setRecovering(false);
    }
  }, [isFocused]);

  const handleLogin = () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Por favor ingrese su correo y contraseña');
      return;
    }
    setLoading(true);
    loginUser(email.trim(), password).then((result) => {
      setLoading(false);
      if (!result.success) {
        Alert.alert('Error de inicio de sesión', result.error);
      } else {
        setEmail('');
        setPassword('');
        navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
      }
    });
  };

  const handleResetPassword = () => {
    const em = email.trim();
    if (!em) {
      setRecoveryMsg('Ingrese su correo electrónico primero');
      return;
    }
    setRecovering(true);
    setRecoveryMsg('');
    resetPassword(em).then((result) => {
      setRecovering(false);
      if (result.success) {
        setRecoveryMsg('Revise su bandeja de entrada. Le enviamos un enlace para restablecer su contraseña.');
      } else {
        setRecoveryMsg(result.error);
      }
    });
  };

  return (
    <KeyboardAvoidingView
      style={Object.assign({}, styles.container, { backgroundColor: colors.background })}
      behavior={Platform.OS === 'ios' ? 'padding' : Platform.OS === 'web' ? undefined : 'height'}
    >
      <ScrollView
        contentContainerStyle={Object.assign({}, styles.scrollContent, { backgroundColor: colors.background })}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.logoSection}>
          <View style={styles.logoRow}>
            <TouchableOpacity onPress={toggleTheme} style={Object.assign({}, styles.themeToggle, { backgroundColor: colors.overlay })}>
              <Text style={styles.themeIcon}>{isDark ? '☀️' : '🌙'}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.logoStack}>
            <Text style={styles.logoIcon}>⚖️</Text>
            <Text style={Object.assign({}, styles.appName, { color: colors.text })}>Bufete de Abogados</Text>
            <Text style={Object.assign({}, styles.tagline, { color: colors.textSecondary })}>Justicia cercana, soluciones reales</Text>
          </View>
        </View>

        <Form style={Object.assign({}, styles.formSection, { backgroundColor: colors.surface })}>
          <Text style={Object.assign({}, styles.welcomeText, { color: colors.text })}>Iniciar Sesión</Text>

          <View style={Object.assign({}, styles.inputContainer, { backgroundColor: colors.background, borderColor: colors.border })}>
            <Text style={styles.inputIcon}>✉️</Text>
            <AppTextInput
              style={Object.assign({}, styles.input, { color: colors.text })}
              placeholder="Correo electrónico"
              placeholderTextColor={colors.disabled}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="nope-username"
              inputMode="text"
              dataSet={{ lpignore: 'true' }}
            />
          </View>

          <View style={Object.assign({}, styles.inputContainer, { backgroundColor: colors.background, borderColor: colors.border })}>
            <Text style={styles.inputIcon}>🔒</Text>
            <AppTextInput
              style={Object.assign({}, styles.input, { color: colors.text })}
              placeholder="Contraseña"
              placeholderTextColor={colors.disabled}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoComplete="nope-password"
              inputMode="text"
              dataSet={{ lpignore: 'true' }}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.eyeIcon}>{showPassword ? '🙈' : '👁️'}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={Object.assign({}, styles.loginButton, { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: colors.cardShadow }, loading && styles.buttonDisabled)}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={Object.assign({}, styles.loginButtonText, { color: colors.primary })}>
              {loading ? 'Ingresando...' : 'Ingresar'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleResetPassword} style={styles.linkButton}>
            <Text style={Object.assign({}, styles.linkText, { color: colors.textSecondary })}>{recovering ? 'Buscando...' : '¿Olvidó su contraseña?'}</Text>
          </TouchableOpacity>

          <View style={styles.dividerRow}>
            <View style={Object.assign({}, styles.dividerLine, { backgroundColor: colors.border })} />
            <Text style={Object.assign({}, styles.dividerText, { color: colors.textSecondary })}>O</Text>
            <View style={Object.assign({}, styles.dividerLine, { backgroundColor: colors.border })} />
          </View>

          <TouchableOpacity
            style={Object.assign({}, styles.googleButton, { borderColor: colors.border, backgroundColor: isDark ? '#2A2A2A' : '#FFFFFF' }, googleLoading && styles.buttonDisabled)}
            onPress={() => {
              setGoogleLoading(true);
              loginWithGoogle().then((result) => {
                setGoogleLoading(false);
                if (result.success) {
                  navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
                } else if (result.error) {
                  Alert.alert('Error', result.error);
                }
              });
            }}
            disabled={googleLoading}
          >
            <Text style={Object.assign({}, styles.googleIcon, { backgroundColor: isDark ? '#333' : '#FFFFFF' })}>G</Text>
            <Text style={Object.assign({}, styles.googleButtonText, { color: isDark ? colors.textSecondary : '#555555' })}>
              {googleLoading ? 'Conectando...' : 'Continuar con Google'}
            </Text>
          </TouchableOpacity>
          {recoveryMsg ? (
            <Text style={Object.assign({}, styles.recoveryText, { color: colors.primary })}>{recoveryMsg}</Text>
          ) : null}
        </Form>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: 'center' },
  logoSection: {
    paddingVertical: 30,
    paddingTop: 60,
  },
  logoRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  logoStack: {
    alignItems: 'center',
  },
  themeToggle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  themeIcon: {
    fontSize: 22,
  },
  logoIcon: { fontSize: 56, marginBottom: 10 },
  appName: {
    fontSize: 34,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  tagline: {
    fontSize: SIZES.sm,
    marginTop: 6,
    fontStyle: 'italic',
  },
  formSection: {
    borderRadius: 20,
    paddingHorizontal: 30,
    paddingVertical: 40,
    marginHorizontal: 16,
    marginBottom: 40,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  welcomeText: {
    fontSize: SIZES.xxl,
    fontWeight: 'bold',
    marginBottom: 25,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 15,
    paddingHorizontal: 15,
    marginBottom: 15,
    height: 55,
    borderWidth: 1,
  },
  inputIcon: { fontSize: 18, marginRight: 10 },
  input: {
    flex: 1,
    fontSize: SIZES.md,
    ...Platform.select({
      web: {
        outline: 'none',
        outlineWidth: 0,
        outlineStyle: 'none',
        outlineColor: 'transparent',
        boxShadow: 'none',
        WebkitFocusRingColor: 'transparent',
        WebkitAppearance: 'none',
        MozAppearance: 'none',
      },
    }),
  },
  eyeButton: { padding: 8, justifyContent: 'center', alignItems: 'center' },
  eyeIcon: { fontSize: 20 },
  loginButton: {
    borderRadius: 15,
    height: 55,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: { opacity: 0.7 },
  loginButtonText: {
    fontSize: SIZES.lg,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  linkButton: { alignItems: 'center', marginTop: 18 },
  linkText: {
    fontSize: SIZES.sm,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  recoveryText: {
    fontSize: SIZES.md,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 12,
    paddingHorizontal: 10,
    lineHeight: 22,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 18,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: SIZES.sm,
    fontWeight: '600',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    borderRadius: 15,
    borderWidth: 1,
    gap: 10,
  },
  googleIcon: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4285F4',
    width: 28,
    height: 28,
    textAlign: 'center',
    lineHeight: 28,
    borderRadius: 14,
    overflow: 'hidden',
  },
  googleButtonText: {
    fontSize: SIZES.md,
    fontWeight: '600',
  },

});

export default LoginScreen;
