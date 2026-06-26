import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { registerUser } from '../../firebase/auth';
import { COLORS, SIZES } from '../utils/theme';
import { validateEmail } from '../utils/helpers';

const RegisterScreen = ({ navigation }) => {
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
    <View style={[styles.container, { height: windowHeight }]}>
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
          <Text style={styles.headerSubtitle}>Únase a Arauz Barraza Abogados</Text>
        </View>

        <View style={styles.formSection}>
          <View style={styles.row}>
            <View style={[styles.inputContainer, { flex: 1, marginRight: 8 }]}>
              <TextInput
                style={styles.input}
                placeholder="Nombre *"
                placeholderTextColor="#555555"
                value={form.nombre}
                onChangeText={(v) => updateForm('nombre', v)}
              />
            </View>
            <View style={[styles.inputContainer, { flex: 1, marginLeft: 8 }]}>
              <TextInput
                style={styles.input}
                placeholder="Apellido *"
                placeholderTextColor="#555555"
                value={form.apellido}
                onChangeText={(v) => updateForm('apellido', v)}
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Correo electrónico *"
              placeholderTextColor="#555555"
              value={form.email}
              onChangeText={(v) => updateForm('email', v)}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Teléfono"
              placeholderTextColor="#555555"
              value={form.telefono}
              onChangeText={(v) => updateForm('telefono', v)}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Cédula (ej: 8-xxx-xxxx)"
              placeholderTextColor="#555555"
              value={form.cedula}
              onChangeText={(v) => updateForm('cedula', v)}
            />
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Contraseña * (mín. 6 caracteres)"
              placeholderTextColor="#555555"
              value={form.password}
              onChangeText={(v) => updateForm('password', v)}
              secureTextEntry
            />
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Confirmar contraseña *"
              placeholderTextColor="#555555"
              value={form.confirmPassword}
              onChangeText={(v) => updateForm('confirmPassword', v)}
              secureTextEntry
            />
          </View>

          <Text style={styles.label}>Rol:</Text>
          <View style={styles.rolContainer}>
            {['abogado', 'asistente', 'admin'].map((rol) => (
              <TouchableOpacity
                key={rol}
                style={[
                  styles.rolButton,
                  form.rol === rol && styles.rolButtonActive,
                ]}
                onPress={() => updateForm('rol', rol)}
              >
                <Text
                  style={[
                    styles.rolText,
                    form.rol === rol && styles.rolTextActive,
                  ]}
                >
                  {rol.charAt(0).toUpperCase() + rol.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.registerButton, loading && styles.buttonDisabled]}
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
            <Text style={styles.loginText}>
              ¿Ya tiene cuenta? <Text style={styles.loginHighlight}>Inicie sesión</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primary },
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
  backText: { fontSize: 22, color: COLORS.textLight, fontWeight: 'bold' },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.textLight,
  },
  headerSubtitle: {
    fontSize: SIZES.md,
    color: '#FFFFFF',
    marginTop: 5,
    fontWeight: '600',
  },
  formSection: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    paddingHorizontal: 25,
    paddingTop: 30,
    paddingBottom: 40,
  },
  row: { flexDirection: 'row' },
  inputContainer: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    paddingHorizontal: 15,
    marginBottom: 12,
    height: 50,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
  },
  input: { fontSize: SIZES.md, color: COLORS.text, fontWeight: '600' },
  label: {
    fontSize: SIZES.sm,
    color: COLORS.textSecondary,
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
    borderColor: COLORS.border,
    alignItems: 'center',
    marginHorizontal: 4,
    backgroundColor: COLORS.background,
  },
  rolButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  rolText: { color: COLORS.textSecondary, fontSize: SIZES.sm, fontWeight: '700' },
  rolTextActive: { color: COLORS.textLight },
  registerButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 15,
    height: 55,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 5,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonDisabled: { opacity: 0.7 },
  registerButtonText: {
    color: COLORS.textLight,
    fontSize: SIZES.lg,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  loginLink: { alignItems: 'center', marginTop: 20 },
  loginText: { color: COLORS.textSecondary, fontSize: SIZES.sm, fontWeight: '600' },
  loginHighlight: { color: COLORS.primary, fontWeight: 'bold' },
});

export default RegisterScreen;
