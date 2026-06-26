import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { onAuthChange, getUserProfile, logoutUser } from '../../firebase/auth';
import { getDashboardStats, subscribeToCollection } from '../services/firestoreService';
import Card from '../components/Card';
import Loading from '../components/Loading';
import { SIZES } from '../utils/theme';
import { useTheme } from '../context/ThemeContext';
import { formatCurrency, parseDate } from '../utils/helpers';

const QUICK_ACTIONS = [
  { key: 'Clients', icon: '👥', label: 'Clientes', color: '#1976D2' },
  { key: 'Expedientes', icon: '📁', label: 'Expedientes', color: '#388E3C' },
  { key: 'Appointments', icon: '📅', label: 'Citas', color: '#F57C00' },
  { key: 'Payments', icon: '💰', label: 'Cobros', color: '#D32F2F' },
  { key: 'Calculators', icon: '🧮', label: 'Calculadoras', color: '#7B1FA2' },
  { key: 'Laws', icon: '⚖️', label: 'Leyes', color: '#1A237E' },
  { key: 'Chat', icon: '💬', label: 'Chatbot', color: '#00897B' },
  { key: 'Reports', icon: '📊', label: 'Reportes', color: '#5D4037' },
];

const HomeScreen = ({ navigation }) => {
  const { colors, isDark, toggleTheme } = useTheme();
  const insets = useSafeAreaInsets();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [proximasCitas, setProximasCitas] = useState([]);

  useEffect(() => {
    const unsubscribe = onAuthChange(async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const profileResult = await getUserProfile(currentUser.uid);
        if (profileResult.success) {
          setProfile(profileResult.data);
        }
        loadStats(currentUser.uid);
        loadProximasCitas(currentUser.uid);
      } else {
        setUser(null);
        setLoading(false);
      }
    });
    return unsubscribe;
  }, []);

  const loadStats = async (userId) => {
    const result = await getDashboardStats(userId);
    if (result.success) setStats(result.data);
    setLoading(false);
  };

  const loadProximasCitas = (userId) => {
    const unsubscribe = subscribeToCollection('citas', (citas) => {
      const pendientes = citas
        .filter((c) => c.estado === 'pendiente')
        .sort((a, b) => new Date(a.fecha || 0) - new Date(b.fecha || 0))
        .slice(0, 5);
      setProximasCitas(pendientes);
    }, [{ field: 'abogadoId', operator: '==', value: userId }]);
    return unsubscribe;
  };

  const onRefresh = async () => {
    setRefreshing(true);
    if (user) {
      await loadStats(user.uid);
    }
    setRefreshing(false);
  };

  const handleLogout = () => {
    logoutUser();
  };

  if (loading) return <Loading message="Cargando aplicación..." />;
  if (!user) {
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
    return null;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.headerBg, paddingTop: insets.top + 16 }]}>
        <View style={styles.headerRow}>
          <View style={styles.headerUser}>
            <View style={[styles.avatar, { backgroundColor: colors.overlay }]}>
              <Text style={styles.avatarText}>{profile?.nombre ? profile.nombre[0].toUpperCase() : '👤'}</Text>
            </View>
            <View style={styles.headerText}>
              <Text style={styles.greeting}>Bienvenido,</Text>
              <Text style={styles.userName}>{profile?.nombre || 'Usuario'}</Text>
              <Text style={styles.slogan}>Justicia y excelencia legal</Text>
            </View>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={toggleTheme} style={[styles.headerBtn, { backgroundColor: colors.overlay }]}>
              <Text style={styles.headerBtnText}>{isDark ? '☀️' : '🌙'}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleLogout} style={[styles.logoutBtn, { backgroundColor: colors.accent }]}>
              <Text style={styles.logoutText}>Salir</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} />
        }
      >
        <View style={styles.metricsGrid}>
          <View style={[styles.metricCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder, borderLeftColor: '#1976D2', borderLeftWidth: 4 }]}>
            <View style={styles.metricTop}>
              <Text style={styles.metricIcon}>👥</Text>
              <Text style={[styles.metricValue, { color: colors.text }]}>{stats?.totalClientes || 0}</Text>
            </View>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Clientes Registrados</Text>
          </View>
          <View style={[styles.metricCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder, borderLeftColor: '#388E3C', borderLeftWidth: 4 }]}>
            <View style={styles.metricTop}>
              <Text style={styles.metricIcon}>📁</Text>
              <Text style={[styles.metricValue, { color: colors.text }]}>{stats?.totalExpedientes || 0}</Text>
            </View>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Expedientes Activos</Text>
          </View>
          <View style={[styles.metricCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder, borderLeftColor: '#F57C00', borderLeftWidth: 4 }]}>
            <View style={styles.metricTop}>
              <Text style={styles.metricIcon}>📅</Text>
              <Text style={[styles.metricValue, { color: colors.text }]}>{stats?.citasPendientes || 0}</Text>
            </View>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Citas Pendientes</Text>
          </View>
          <View style={[styles.metricCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder, borderLeftColor: '#D32F2F', borderLeftWidth: 4 }]}>
            <View style={styles.metricTop}>
              <Text style={styles.metricIcon}>💰</Text>
              <Text style={[styles.metricValue, { color: colors.text }]}>{formatCurrency(stats?.cobrosDelMes || 0)}</Text>
            </View>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Cobros del Mes</Text>
          </View>
        </View>

        {proximasCitas.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Text style={styles.sectionIcon}>📅</Text>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Próximas Citas</Text>
              </View>
              <TouchableOpacity onPress={() => navigation.navigate('Appointments')}>
                <Text style={[styles.sectionLink, { color: colors.primary }]}>Ver todas</Text>
              </TouchableOpacity>
            </View>
            {proximasCitas.map((cita) => (
              <TouchableOpacity
                key={cita.id}
                style={[styles.citaCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}
                onPress={() => navigation.navigate('Appointments')}
              >
                <View style={[styles.citaBadge, { backgroundColor: colors.primary + '15' }]}>
                  <Text style={[styles.citaBadgeText, { color: colors.primary }]}>
                    {parseDate(cita.fecha)?.toLocaleDateString('es-PA', { day: 'numeric', month: 'short' })}
                  </Text>
                </View>
                <View style={styles.citaInfo}>
                  <Text style={[styles.citaTitle, { color: colors.text }]} numberOfLines={1}>
                    {cita.titulo || cita.clienteNombre || 'Cita'}
                  </Text>
                  <Text style={[styles.citaSubtitle, { color: colors.textSecondary }]} numberOfLines={1}>
                    {cita.clienteNombre ? `Cliente: ${cita.clienteNombre}` : ''} {cita.hora ? `• ${cita.hora}` : ''}
                  </Text>
                </View>
                <Text style={styles.citaArrow}>›</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionIcon}>⚡</Text>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Acceso Rápido</Text>
            </View>
          </View>
          <View style={styles.quickGrid}>
            {QUICK_ACTIONS.map((action) => (
              <TouchableOpacity
                key={action.key}
                style={[styles.quickCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}
                onPress={() => navigation.navigate(action.key)}
              >
                <View style={[styles.quickIconBg, { backgroundColor: action.color + (isDark ? '25' : '12') }]}>
                  <Text style={styles.quickIcon}>{action.icon}</Text>
                </View>
                <Text style={[styles.quickLabel, { color: colors.text }]}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.disabled }]}>Bufete de Abogados</Text>
          <Text style={[styles.footerSubtext, { color: colors.disabled }]}>Justicia y excelencia legal</Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingBottom: 20,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  headerUser: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  headerText: { flex: 1 },
  greeting: {
    fontSize: SIZES.xs,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  userName: {
    fontSize: SIZES.xl,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 1,
  },
  slogan: {
    fontSize: SIZES.xs,
    color: '#C5A028',
    marginTop: 3,
    fontStyle: 'italic',
    fontWeight: '500',
  },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerBtnText: { fontSize: 20 },
  logoutBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: SIZES.sm,
  },
  content: { flex: 1, padding: 16 },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 8,
  },
  metricCard: {
    width: '48%',
    flexGrow: 1,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  metricTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metricIcon: { fontSize: 24 },
  metricValue: {
    fontSize: SIZES.xxl,
    fontWeight: 'bold',
  },
  metricLabel: {
    fontSize: SIZES.xs,
    marginTop: 4,
    fontWeight: '500',
  },
  section: {
    marginTop: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionIcon: { fontSize: 18 },
  sectionTitle: {
    fontSize: SIZES.lg,
    fontWeight: 'bold',
  },
  sectionLink: {
    fontSize: SIZES.sm,
    fontWeight: '600',
  },
  citaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  citaBadge: {
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  citaBadgeText: {
    fontSize: SIZES.xs,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 16,
  },
  citaInfo: {
    flex: 1,
  },
  citaTitle: {
    fontSize: SIZES.md,
    fontWeight: '600',
  },
  citaSubtitle: {
    fontSize: SIZES.xs,
    marginTop: 2,
  },
  citaArrow: {
    fontSize: 22,
    color: '#BDBDBD',
    marginLeft: 8,
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  quickCard: {
    width: '23%',
    flexGrow: 1,
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 6,
    borderRadius: 14,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  quickIconBg: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickIcon: { fontSize: 22 },
  quickLabel: {
    fontSize: SIZES.xs,
    fontWeight: '600',
    textAlign: 'center',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 24,
    marginTop: 8,
  },
  footerText: {
    fontSize: SIZES.xs,
    fontWeight: '600',
  },
  footerSubtext: {
    fontSize: SIZES.xs,
    fontStyle: 'italic',
    marginTop: 2,
  },
});

export default HomeScreen;