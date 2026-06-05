import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl,
} from 'react-native';
import { onAuthChange, getUserProfile, logoutUser } from '../../firebase/auth';
import { getDashboardStats, subscribeToCollection } from '../services/firestoreService';
import Card from '../components/Card';
import Loading from '../components/Loading';
import Header from '../components/Header';
import { COLORS, SIZES } from '../utils/theme';
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
    <View style={styles.container}>
      <Header
        title={`Hola, ${profile?.nombre || 'Usuario'}`}
        subtitle={profile?.rol ? `Rol: ${profile.rol}` : 'Arauz Carrillo Abogados'}
        rightIcon="🚪"
        rightAction={handleLogout}
      />

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
      >
        <View style={styles.statsRow}>
          <Card style={styles.statCard}>
            <Text style={styles.statIcon}>👥</Text>
            <Text style={styles.statNumber}>{stats?.totalClientes || 0}</Text>
            <Text style={styles.statLabel}>Clientes</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={styles.statIcon}>📁</Text>
            <Text style={styles.statNumber}>{stats?.totalExpedientes || 0}</Text>
            <Text style={styles.statLabel}>Expedientes</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={styles.statIcon}>📅</Text>
            <Text style={styles.statNumber}>{stats?.citasPendientes || 0}</Text>
            <Text style={styles.statLabel}>Pendientes</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={styles.statIcon}>💰</Text>
            <Text style={styles.statNumber}>
              {formatCurrency(stats?.cobrosDelMes || 0)}
            </Text>
            <Text style={styles.statLabel}>Del Mes</Text>
          </Card>
        </View>

        <Text style={styles.sectionTitle}>Acciones Rápidas</Text>
        <View style={styles.quickActionsGrid}>
          {QUICK_ACTIONS.map((action) => (
            <TouchableOpacity
              key={action.key}
              style={styles.quickAction}
              onPress={() => navigation.navigate(action.key)}
            >
              <View style={[styles.actionIconBg, { backgroundColor: action.color + '20' }]}>
                <Text style={styles.actionIcon}>{action.icon}</Text>
              </View>
              <Text style={styles.actionLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {proximasCitas.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Próximas Citas</Text>
            {proximasCitas.map((cita) => (
              <Card key={cita.id} icon="📅" title={cita.titulo || cita.clienteNombre}>
                <Text style={styles.citaDetail}>
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
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { flex: 1, padding: SIZES.padding },
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  statCard: {
    width: '48%',
    alignItems: 'center',
    paddingVertical: 16,
  },
  statIcon: { fontSize: 28 },
  statNumber: {
    fontSize: SIZES.xxl,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginTop: 5,
  },
  statLabel: { fontSize: SIZES.xs, color: COLORS.textSecondary, marginTop: 2 },
  sectionTitle: {
    fontSize: SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.text,
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
    color: COLORS.text,
    marginTop: 6,
    textAlign: 'center',
    fontWeight: '500',
  },
  citaDetail: {
    fontSize: SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
});

export default HomeScreen;
