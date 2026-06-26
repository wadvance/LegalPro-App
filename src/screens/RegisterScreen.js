import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, useWindowDimensions, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { registerUser } from '../../firebase/auth';
import { SIZES } from '../utils/theme';
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

  const updateForm = (key, value) => setForm({ ...form, [key]: value });

  const handleRegister = async () => {
    if (!form.nombre || !form.apellido || !form.email || !form.password) {
      Alert.alert('Error', 'Todos los campos obligatorios deben estar llenos');
      return;
    }
    if (!validateEmail(form.email)) {
      Alert.alert('Error', 'Correo electrónico inválido');
      return;
    }
    if (form.password.length < 6) {
      Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (form.password !== form.confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden');
      return;
    }

    setLoading(true);
    const result = await registerUser(form.email, form.password, {
      nombre: form.nombre,
      apellido: form.apellido,
      telefono: form.telefono,
      cedula: form.cedula,
      rol: form.rol,
    });
    setLoading(false);

    if (result.success) {
      Alert.alert('Éxito', 'Registro completado correctamente');
      navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
    } else {
      Alert.alert('Error de registro', result.error);
    }
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

        <View style={[styles.formSection, { backgroundColor: colors.surface }]}>
          <View style={styles.row}>
            <View style={[styles.inputContainer, { backgroundColor: colors.background, borderColor: colors.border, flex: 1, marginRight: 8 }]}>
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Nombre *"
                placeholderTextColor={colors.textSecondary}
                value={form.nombre}
                onChangeText={(v) => updateForm('nombre', v)}
              />
            </View>
            <View style={[styles.inputContainer, { backgroundColor: colors.background, borderColor: colors.border, flex: 1, marginLeft: 8 }]}>
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Apellido *"
                placeholderTextColor={colors.textSecondary}
                value={form.apellido}
                onChangeText={(v) => updateForm('apellido', v)}
              />
            </View>
          </View>

          <View style={[styles.inputContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Correo electrónico *"
              placeholderTextColor={colors.textSecondary}
              value={form.email}
              onChangeText={(v) => updateForm('email', v)}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="off"
            />
          </View>

          <View style={[styles.inputContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Teléfono"
              placeholderTextColor={colors.textSecondary}
              value={form.telefono}
              onChangeText={(v) => updateForm('telefono', v)}
              keyboardType="phone-pad"
            />
          </View>

          <View style={[styles.inputContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Cédula (ej: 8-xxx-xxxx)"
              placeholderTextColor={colors.textSecondary}
              value={form.cedula}
              onChangeText={(v) => updateForm('cedula', v)}
            />
          </View>

          <View style={[styles.inputContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Contraseña * (mín. 6 caracteres)"
              placeholderTextColor={colors.textSecondary}
              value={form.password}
              onChangeText={(v) => updateForm('password', v)}
              secureTextEntry={Platform.OS !== 'web'}
              autoComplete="off"
            />
          </View>

          <View style={[styles.inputContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Confirmar contraseña *"
              placeholderTextColor={colors.textSecondary}
              value={form.confirmPassword}
              onChangeText={(v) => updateForm('confirmPassword', v)}
              secureTextEntry={Platform.OS !== 'web'}
              autoComplete="off"
            />
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

          <TouchableOpacity
            onPress={() => navigation.navigate('Login')}
            style={styles.loginLink}
          >
            <Text style={[styles.loginText, { color: colors.textSecondary }]}>
              ¿Ya tiene cuenta? <Text style={[styles.loginHighlight, { color: colors.primary }]}>Inicie sesión</Text>
            </Text>
          </TouchableOpacity>
        </View>
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
    borderRadius: 12,
    paddingHorizontal: 15,
    marginBottom: 12,
    height: 50,
    borderWidth: 1,
    justifyContent: 'center',
  },
  input: { fontSize: SIZES.md, fontWeight: '600' },
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
  loginLink: { alignItems: 'center', marginTop: 20 },
  loginText: { fontSize: SIZES.sm, fontWeight: '600' },
  loginHighlight: { fontWeight: 'bold' },
});

export default RegisterScreen;
