import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, useWindowDimensions, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { registerUser, loginWithGoogle } from '../../firebase/auth';
import { SIZES } from '../utils/theme';
import Form from '../components/Form';
import AppTextInput from '../components/AppTextInput';
import { useTheme } from '../context/ThemeContext';
import { validateEmail } from '../utils/helpers';

const RegisterScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const { height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [form, setForm] = useState({
    nombre: '',
    apellido: '',
    email: '',
    password: '',
    confirmPassword: '',
    telefono: '',
    cedula: '',
    rol: 'abogado',
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [regError, setRegError] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);

  const updateForm = (key, value) => setForm({ ...form, [key]: value });

  const handleRegister = () => {
    setRegError('');
    if (!form.nombre || !form.apellido || !form.email || !form.password) {
      setRegError('Todos los campos obligatorios deben estar llenos');
      return;
    }
    if (!validateEmail(form.email)) {
      setRegError('Correo electrónico inválido');
      return;
    }
    if (form.password.length < 6) {
      setRegError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setRegError('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);
    registerUser(form.email, form.password, {
      nombre: form.nombre,
      apellido: form.apellido,
      telefono: form.telefono,
      cedula: form.cedula,
      rol: form.rol,
    }).then((result) => {
      setLoading(false);
      if (result.success) {
        navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
      } else {
        setRegError(result.error);
      }
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.primary, height: windowHeight }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={true}
      >
        <View style={[styles.header, { paddingTop: insets.top + 24 }]}>
          <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.backBtn}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Crear Cuenta</Text>
          <Text style={styles.headerSubtitle}>Únase a Bufete de Abogados</Text>
        </View>

        <Form style={[styles.formSection, { backgroundColor: colors.surface }]}>
          <View style={[styles.inputContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <AppTextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Nombre *"
              placeholderTextColor={colors.textSecondary}
              value={form.nombre}
              onChangeText={(v) => updateForm('nombre', v)}
              autoComplete="nope-name"
              inputMode="text"
            />
          </View>

          <View style={[styles.inputContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <AppTextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Apellido *"
              placeholderTextColor={colors.textSecondary}
              value={form.apellido}
              onChangeText={(v) => updateForm('apellido', v)}
              autoComplete="nope-lastname"
              inputMode="text"
            />
          </View>

          <View style={[styles.inputContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <AppTextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Correo electrónico *"
              placeholderTextColor={colors.textSecondary}
              value={form.email}
              onChangeText={(v) => updateForm('email', v)}
              autoCapitalize="none"
              autoComplete="nope-email"
              inputMode="email"
              dataSet={{ lpignore: 'true' }}
            />
          </View>

          <View style={[styles.inputContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <AppTextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Teléfono"
              placeholderTextColor={colors.textSecondary}
              value={form.telefono}
              onChangeText={(v) => updateForm('telefono', v)}
              keyboardType="phone-pad"
              autoComplete="nope-tel"
              inputMode="tel"
            />
          </View>

          <View style={[styles.inputContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <AppTextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Cédula (ej: 8-xxx-xxxx)"
              placeholderTextColor={colors.textSecondary}
              value={form.cedula}
              onChangeText={(v) => updateForm('cedula', v)}
              autoComplete="nope-id"
              inputMode="text"
            />
          </View>

          <View style={[styles.inputContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <AppTextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Contraseña * (mín. 6 caracteres)"
              placeholderTextColor={colors.textSecondary}
              value={form.password}
              onChangeText={(v) => updateForm('password', v)}
              secureTextEntry={!showPassword}
              autoComplete="new-password"
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

          <View style={[styles.inputContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <AppTextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Confirmar contraseña *"
              placeholderTextColor={colors.textSecondary}
              value={form.confirmPassword}
              onChangeText={(v) => updateForm('confirmPassword', v)}
              secureTextEntry={!showConfirmPassword}
              autoComplete="new-password"
              inputMode="text"
              dataSet={{ lpignore: 'true' }}
            />
            <TouchableOpacity
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              style={styles.eyeButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.eyeIcon}>{showConfirmPassword ? '🙈' : '👁️'}</Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.label, { color: colors.textSecondary }]}>Rol:</Text>
          <View style={styles.rolContainer}>
            {['abogado', 'asistente', 'admin'].map((rol) => (
              <TouchableOpacity
                key={rol}
                style={[
                  styles.rolButton,
                  { backgroundColor: colors.background, borderColor: colors.border },
                  form.rol === rol && { backgroundColor: colors.primary, borderColor: colors.primary },
                ]}
                onPress={() => updateForm('rol', rol)}
              >
                <Text
                  style={[
                    styles.rolText,
                    { color: colors.textSecondary },
                    form.rol === rol && { color: colors.textLight },
                  ]}
                >
                  {rol.charAt(0).toUpperCase() + rol.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.registerButton, { backgroundColor: colors.primary, shadowColor: colors.primary }, loading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            <Text style={styles.registerButtonText}>
              {loading ? 'Registrando...' : 'Crear Cuenta'}
            </Text>
          </TouchableOpacity>
          {regError ? (
            <Text style={styles.regError}>{regError}</Text>
          ) : null}

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>O</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            style={[styles.googleButton, googleLoading && styles.buttonDisabled]}
            onPress={() => {
              setGoogleLoading(true);
              loginWithGoogle().then((result) => {
                setGoogleLoading(false);
                if (result.success) {
                  navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
                } else if (result.error) {
                  setRegError(result.error);
                }
              });
            }}
            disabled={googleLoading}
          >
            <Text style={styles.googleIcon}>G</Text>
            <Text style={styles.googleButtonText}>
              {googleLoading ? 'Conectando...' : 'Registrarse con Google'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('Login')}
            style={styles.loginLink}
          >
            <Text style={[styles.loginText, { color: colors.textSecondary }]}>
              ¿Ya tiene cuenta? <Text style={[styles.loginHighlight, { color: colors.primary }]}>Inicie sesión</Text>
            </Text>
          </TouchableOpacity>
        </Form>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingBottom: 120 },
  header: {
    padding: 30,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  backText: { fontSize: 22, color: '#FFFFFF', fontWeight: 'bold' },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: SIZES.md,
    color: '#FFFFFF',
    marginTop: 5,
    fontWeight: '600',
  },
  formSection: {
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    paddingHorizontal: 25,
    paddingTop: 30,
    paddingBottom: 40,
  },
  row: { flexDirection: 'row' },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 15,
    marginBottom: 12,
    height: 50,
    borderWidth: 1,
  },
  eyeButton: { padding: 8, justifyContent: 'center', alignItems: 'center' },
  eyeIcon: { fontSize: 18 },
  input: {
    fontSize: SIZES.md,
    fontWeight: '600',
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
  label: {
    fontSize: SIZES.sm,
    marginBottom: 8,
    marginTop: 5,
    fontWeight: '700',
  },
  rolContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  rolButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  rolText: { fontSize: SIZES.sm, fontWeight: '700' },
  registerButton: {
    borderRadius: 15,
    height: 55,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 5,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonDisabled: { opacity: 0.7 },
  registerButtonText: {
    color: '#FFFFFF',
    fontSize: SIZES.lg,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  regError: {
    color: '#D32F2F',
    fontSize: SIZES.md,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 12,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  dividerText: {
    marginHorizontal: 12,
    color: '#757575',
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
    borderColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
    gap: 10,
  },
  googleIcon: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4285F4',
    backgroundColor: '#FFFFFF',
    width: 28,
    height: 28,
    textAlign: 'center',
    lineHeight: 28,
    borderRadius: 14,
    overflow: 'hidden',
  },
  googleButtonText: {
    color: '#555555',
    fontSize: SIZES.md,
    fontWeight: '600',
  },
  loginLink: { alignItems: 'center', marginTop: 20 },
  loginText: { fontSize: SIZES.sm, fontWeight: '600' },
  loginHighlight: { fontWeight: 'bold' },
});

export default RegisterScreen;
