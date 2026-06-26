import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Alert, ScrollView,
} from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { loginUser, resetPassword } from '../../firebase/auth';
import { COLORS, SIZES } from '../utils/theme';

const LoginScreen = ({ navigation }) => {
  const isFocused = useIsFocused();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (isFocused) {
      setEmail('');
      setPassword('');
      setShowPassword(false);
    }
  }, [isFocused]);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Por favor ingrese su correo y contraseña');
      return;
    }
    setLoading(true);
    const result = await loginUser(email.trim(), password);
    setLoading(false);
    if (!result.success) {
      Alert.alert('Error de inicio de sesión', result.error);
    } else {
      setEmail('');
      setPassword('');
      navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
    }
  };

  const handleResetPassword = () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Por favor ingrese su correo electrónico');
      return;
    }
    Alert.alert(
      'Restablecer Contraseña',
      '¿Enviar enlace de restablecimiento a ' + email + '?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Enviar',
          onPress: async () => {
            const result = await resetPassword(email.trim());
            if (result.success) {
              Alert.alert('Éxito', 'Revise su correo para restablecer su contraseña');
            } else {
              Alert.alert('Error', result.error);
            }
          },
        },
      ]
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : Platform.OS === 'web' ? undefined : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.logoSection}>
          <Text style={styles.logoIcon}>⚖️</Text>
          <Text style={styles.appName}>Bufete de Abogados</Text>
          <Text style={styles.tagline}>Bufete de Abogados</Text>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.welcomeText}>Iniciar Sesión</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.inputIcon}>✉️</Text>
            <TextInput
              style={styles.input}
              placeholder="Correo electrónico"
              placeholderTextColor={COLORS.disabled}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="off"
              dataSet={{ lpignore: 'true' }}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputIcon}>🔒</Text>
            <TextInput
              style={[styles.input, !showPassword && Platform.OS === 'web' && { WebkitTextSecurity: 'disc' }]}
              placeholder="Contraseña"
              placeholderTextColor={COLORS.disabled}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={Platform.OS !== 'web' && !showPassword}
              autoComplete="off"
              dataSet={{ lpignore: 'true' }}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeButton}
            >
              <Text>{showPassword ? '🙈' : '👁️'}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.loginButton, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.loginButtonText}>
              {loading ? 'Ingresando...' : 'Ingresar'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleResetPassword} style={styles.linkButton}>
            <Text style={styles.linkText}>¿Olvidó su contraseña?</Text>
          </TouchableOpacity>

          <View style={styles.registerSection}>
            <Text style={styles.noAccount}>¿No tiene cuenta? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.registerLink}>Regístrese aquí</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primary },
  scrollContent: { flexGrow: 1, justifyContent: 'center' },
  logoSection: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingTop: 60,
  },
  logoIcon: { fontSize: 60, marginBottom: 10 },
  appName: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  tagline: {
    fontSize: SIZES.sm,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 8,
    fontStyle: 'italic',
  },
  formSection: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    paddingHorizontal: 30,
    paddingTop: 40,
    paddingBottom: 50,
    marginTop: 20,
  },
  welcomeText: {
    fontSize: SIZES.xxl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 25,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 15,
    paddingHorizontal: 15,
    marginBottom: 15,
    height: 55,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  inputIcon: { fontSize: 18, marginRight: 10 },
  input: {
    flex: 1,
    fontSize: SIZES.md,
    color: COLORS.text,
  },
  eyeButton: { padding: 5 },
  loginButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 15,
    height: 55,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonDisabled: { opacity: 0.7 },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: SIZES.lg,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  linkButton: { alignItems: 'center', marginTop: 18 },
  linkText: {
    color: COLORS.primaryLight,
    fontSize: SIZES.sm,
  },
  registerSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 25,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  noAccount: { color: COLORS.textSecondary, fontSize: SIZES.sm },
  registerLink: {
    color: COLORS.primary,
    fontSize: SIZES.sm,
    fontWeight: '600',
  },
});

export default LoginScreen;
