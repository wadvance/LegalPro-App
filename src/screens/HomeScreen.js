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
        .slice(0, 3);
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
          <View style={styles.headerText}>
            <Text style={styles.greeting}>Hola, {profile?.nombre || 'Usuario'}</Text>
            <Text style={styles.role}>{profile?.rol ? `Rol: ${profile.rol}` : 'Bufete de Abogados'}</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={toggleTheme} style={[styles.iconBtn, { backgroundColor: colors.overlay, marginRight: 8 }]}>
              <Text style={styles.iconBtnText}>{isDark ? '☀️' : '🌙'}</Text>
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
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
            <Text style={styles.statIcon}>👥</Text>
            <Text style={[styles.statNumber, { color: colors.primary }]}>{stats?.totalClientes || 0}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Clientes</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
            <Text style={styles.statIcon}>📁</Text>
            <Text style={[styles.statNumber, { color: colors.primary }]}>{stats?.totalExpedientes || 0}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Expedientes</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
            <Text style={styles.statIcon}>📅</Text>
            <Text style={[styles.statNumber, { color: colors.primary }]}>{stats?.citasPendientes || 0}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Pendientes</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
            <Text style={styles.statIcon}>💰</Text>
            <Text style={[styles.statNumber, { color: colors.primary }]}>
              {formatCurrency(stats?.cobrosDelMes || 0)}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Del Mes</Text>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>Acciones Rápidas</Text>
        <View style={styles.quickActionsGrid}>
          {QUICK_ACTIONS.map((action) => (
            <TouchableOpacity
              key={action.key}
              style={styles.quickAction}
              onPress={() => navigation.navigate(action.key)}
            >
              <View style={[styles.actionIconBg, { backgroundColor: action.color + (isDark ? '30' : '15') }]}>
                <Text style={styles.actionIcon}>{action.icon}</Text>
              </View>
              <Text style={[styles.actionLabel, { color: colors.text }]}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {proximasCitas.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Próximas Citas</Text>
            {proximasCitas.map((cita) => (
              <Card key={cita.id} icon="📅" title={cita.titulo || cita.clienteNombre}>
                <Text style={[styles.citaDetail, { color: colors.textSecondary }]}>
                  Cliente: {cita.clienteNombre} | {parseDate(cita.fecha)?.toLocaleDateString('es-PA')} - {cita.hora}
                </Text>
              </Card>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingBottom: 20,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerText: { flex: 1 },
  greeting: {
    fontSize: SIZES.xxl,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  role: {
    fontSize: SIZES.xs,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  headerActions: { flexDirection: 'row', alignItems: 'center' },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconBtnText: { fontSize: 20 },
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
  content: { flex: 1, padding: SIZES.padding },
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  statCard: {
    width: '48%',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    marginBottom: 10,
  },
  statIcon: { fontSize: 28 },
  statNumber: {
    fontSize: SIZES.xxl,
    fontWeight: 'bold',
    marginTop: 5,
  },
  statLabel: { fontSize: SIZES.xs, marginTop: 2 },
  sectionTitle: {
    fontSize: SIZES.xl,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 12,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickAction: {
    width: '23%',
    alignItems: 'center',
    marginBottom: 15,
  },
  actionIconBg: {
    width: 55,
    height: 55,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionIcon: { fontSize: 26 },
  actionLabel: {
    fontSize: SIZES.xs,
    marginTop: 6,
    textAlign: 'center',
    fontWeight: '500',
  },
  citaDetail: {
    fontSize: SIZES.sm,
    marginTop: 4,
  },
});

export default HomeScreen;
