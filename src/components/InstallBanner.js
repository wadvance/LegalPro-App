import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { SIZES } from '../utils/theme';

export default function InstallBanner({ onInstall, onDismiss }) {
  const { colors } = useTheme();

  if (Platform.OS !== 'web') return null;

  return (
    <View style={[styles.container, { backgroundColor: colors.primary }]}>
      <View style={styles.content}>
        <Text style={styles.icon}>📥</Text>
        <View style={styles.textGroup}>
          <Text style={styles.title}>Instala nuestra app</Text>
          <Text style={styles.subtitle}>
            Accede rápido desde tu pantalla de inicio
          </Text>
        </View>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.installBtn, { backgroundColor: colors.secondary }]}
          onPress={onInstall}
        >
          <Text style={styles.installBtnText}>Instalar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.dismissBtn} onPress={onDismiss}>
          <Text style={styles.dismissText}>✕</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingBottom: 28,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  icon: {
    fontSize: 28,
  },
  textGroup: {
    flex: 1,
  },
  title: {
    fontSize: SIZES.lg,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: SIZES.sm,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  installBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  installBtnText: {
    color: '#FFFFFF',
    fontSize: SIZES.md,
    fontWeight: 'bold',
  },
  dismissBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dismissText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
