import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { SIZES } from '../utils/theme';
import { tryInstall, hasDeferredPrompt } from '../services/installApp';

const androidSteps = [
  { icon: '🌐', text: 'Abre Google Chrome' },
  { icon: '⋮', text: 'Toca el menú de 3 puntos' },
  { icon: '🏠', text: 'Selecciona "Agregar a pantalla de inicio"' },
  { icon: '✅', text: 'Confirma la instalación' },
];

const iosSteps = [
  { icon: '🌐', text: 'Abre Safari' },
  { icon: '📤', text: 'Toca el botón Compartir' },
  { icon: '🏠', text: 'Desplázate y toca "Agregar a pantalla de inicio"' },
  { icon: '✅', text: 'Confirma con "Agregar"' },
];

export default function InstallModal({ visible, onClose }) {
  const { colors } = useTheme();
  const [tab, setTab] = useState('android');

  const steps = tab === 'android' ? androidSteps : iosSteps;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.modal, { backgroundColor: colors.surface }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>
              Instalar App
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={[styles.closeIcon, { color: colors.textSecondary }]}>
                ✕
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Sigue estos pasos para instalar la app en tu dispositivo:
          </Text>

          <View style={styles.tabs}>
            <TouchableOpacity
              style={[
                styles.tab,
                tab === 'android' && {
                  backgroundColor: colors.primary,
                  borderColor: colors.primary,
                },
              ]}
              onPress={() => setTab('android')}
            >
              <Text style={styles.tabIcon}>🤖</Text>
              <Text
                style={[
                  styles.tabLabel,
                  { color: tab === 'android' ? '#FFF' : colors.textSecondary },
                ]}
              >
                Android
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.tab,
                tab === 'ios' && {
                  backgroundColor: colors.primary,
                  borderColor: colors.primary,
                },
              ]}
              onPress={() => setTab('ios')}
            >
              <Text style={styles.tabIcon}>🍎</Text>
              <Text
                style={[
                  styles.tabLabel,
                  { color: tab === 'ios' ? '#FFF' : colors.textSecondary },
                ]}
              >
                iOS
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.stepsList}>
            {steps.map((step, index) => (
              <View key={index} style={styles.stepRow}>
                <View
                  style={[
                    styles.stepNumber,
                    { backgroundColor: colors.primary },
                  ]}
                >
                  <Text style={styles.stepNumberText}>{index + 1}</Text>
                </View>
                <Text style={styles.stepIcon}>{step.icon}</Text>
                <Text style={[styles.stepText, { color: colors.text }]}>
                  {step.text}
                </Text>
              </View>
            ))}
          </ScrollView>

          {Platform.OS === 'web' && hasDeferredPrompt() && (
            <TouchableOpacity
              style={[styles.webBtn, { backgroundColor: colors.primary }]}
              onPress={async () => {
                const installed = await tryInstall();
                if (installed) onClose();
              }}
            >
              <Text style={styles.webBtnText}>Intentar instalación automática</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.doneBtn, { borderColor: colors.border }]}
            onPress={onClose}
          >
            <Text style={[styles.doneBtnText, { color: colors.textSecondary }]}>
              Entendido
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modal: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    padding: 24,
    paddingTop: 20,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: SIZES.xxl,
    fontWeight: 'bold',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeIcon: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: SIZES.md,
    marginBottom: 20,
    lineHeight: 20,
  },
  tabs: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    gap: 6,
  },
  tabIcon: {
    fontSize: 18,
  },
  tabLabel: {
    fontSize: SIZES.md,
    fontWeight: '600',
  },
  stepsList: {
    maxHeight: 240,
    marginBottom: 16,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: {
    color: '#FFFFFF',
    fontSize: SIZES.sm,
    fontWeight: 'bold',
  },
  stepIcon: {
    fontSize: 22,
  },
  stepText: {
    fontSize: SIZES.md,
    flex: 1,
  },
  webBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  webBtnText: {
    color: '#FFFFFF',
    fontSize: SIZES.md,
    fontWeight: 'bold',
  },
  doneBtn: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  doneBtnText: {
    fontSize: SIZES.md,
    fontWeight: '600',
  },
});
