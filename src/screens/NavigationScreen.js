import React, { useState, useEffect, useMemo } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, Alert, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { onAuthChange } from '../../firebase/auth';
import { subscribeToCollection } from '../services/firestoreService';
import { openGoogleMaps, openWaze, navigateToAddress } from '../services/maps';
import { PANAMA_LOCATIONS } from '../data/panamaLocations';
import Card from '../components/Card';
import { SIZES } from '../utils/theme';
import { useTheme } from '../context/ThemeContext';

const FILTERS = [
  { key: 'all', label: 'Todas' },
  { key: 'Provincia', label: 'Provincias' },
  { key: 'Distrito', label: 'Distritos' },
  { key: 'Lugar', label: 'Lugares' },
];

const NavigationScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [user, setUser] = useState(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState('');

  useEffect(() => {
    const unsub = onAuthChange((currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      }
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!user) return;
    const unsubClients = subscribeToCollection('clientes', (clientes) => {
      const addresses = (clientes || [])
        .filter((c) => c.direccion && c.direccion.trim())
        .map((c) => ({
          id: `cli_${c.id}`,
          label: `${c.nombre || ''} ${c.apellido || ''}`.trim() || 'Cliente',
          address: c.direccion,
          type: 'Cliente',
          icon: '👤',
        }));
      setSavedAddresses((prev) => {
        const existing = prev.filter((a) => !a.id.startsWith('cli_'));
        return [...existing, ...addresses];
      });
    }, [{ field: 'abogadoId', operator: '==', value: user.uid }]);

    const unsubCompanies = subscribeToCollection('empresas', (empresas) => {
      const addresses = (empresas || [])
        .filter((e) => e.direccion && e.direccion.trim())
        .map((e) => ({
          id: `emp_${e.id}`,
          label: e.nombre || 'Empresa',
          address: e.direccion,
          type: 'Empresa',
          icon: '🏢',
        }));
      setSavedAddresses((prev) => {
        const existing = prev.filter((a) => !a.id.startsWith('emp_'));
        return [...existing, ...addresses];
      });
    }, [{ field: 'abogadoId', operator: '==', value: user.uid }]);

    return () => { unsubClients(); unsubCompanies(); };
  }, [user]);

  const allLocations = useMemo(() => {
    let items = [...PANAMA_LOCATIONS, ...savedAddresses];
    if (filter !== 'all') {
      items = items.filter((i) => i.type === filter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter((i) =>
        `${i.label} ${i.address} ${i.type}`.toLowerCase().includes(q)
      );
    }
    return items;
  }, [savedAddresses, filter, search]);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocalización no disponible en este dispositivo');
      return;
    }
    setLocating(true);
    setLocationError('');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCurrentLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLocating(false);
      },
      (error) => {
        setLocating(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError('Permiso denegado. Active la ubicación en su dispositivo.');
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError('Ubicación no disponible.');
            break;
          case error.TIMEOUT:
            setLocationError('Tiempo de espera agotado.');
            break;
          default:
            setLocationError('Error al obtener ubicación.');
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  const handleNavigateNow = () => {
    if (!search.trim()) {
      Alert.alert('Dirección requerida', 'Escribe una dirección o selecciona una de la lista');
      return;
    }
    navigateToAddress(search.trim(), search.trim());
  };

  const handleOpenMaps = (dest) => {
    const address = dest || search.trim();
    if (!address) {
      Alert.alert('Dirección requerida', 'Escribe una dirección o selecciona una de la lista');
      return;
    }
    const origin = currentLocation ? `${currentLocation.lat},${currentLocation.lng}` : null;
    openGoogleMaps(address, origin);
  };

  const handleOpenWaze = (dest) => {
    const address = dest || search.trim();
    if (!address) {
      Alert.alert('Dirección requerida', 'Escribe una dirección o selecciona una de la lista');
      return;
    }
    openWaze(address);
  };

  const renderAddressItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.addressCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}
      onPress={() => navigateToAddress(item.address, item.label)}
    >
      <View style={[styles.addressIcon, { backgroundColor: colors.overlay }]}>
        <Text style={styles.addressIconText}>{item.icon}</Text>
      </View>
      <View style={styles.addressInfo}>
        <Text style={[styles.addressLabel, { color: colors.text }]} numberOfLines={1}>{item.label}</Text>
        <Text style={[styles.addressText, { color: colors.textSecondary }]} numberOfLines={2}>{item.address}</Text>
        <Text style={[styles.addressType, { color: colors.primary }]}>{item.type}</Text>
      </View>
      <TouchableOpacity
        style={[styles.navBtn, { backgroundColor: colors.primary + '15' }]}
        onPress={() => navigateToAddress(item.address, item.label)}
      >
        <Text style={styles.navBtnText}>📍</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.headerBg, paddingTop: insets.top + 16 }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerIcon}>📍</Text>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Navegación GPS</Text>
            <Text style={styles.headerSubtitle}>Busca direcciones y navega</Text>
          </View>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Busca una dirección o lugar..."
            placeholderTextColor={colors.disabled}
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
            onSubmitEditing={handleNavigateNow}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Text style={styles.clearBtn}>✕</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: '#1976D2' }]}
            onPress={() => handleOpenMaps()}
          >
            <Text style={styles.actionIcon}>🗺️</Text>
            <Text style={styles.actionLabel}>Google Maps</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: '#1A237E' }]}
            onPress={() => handleOpenWaze()}
          >
            <Text style={styles.actionIcon}>🧭</Text>
            <Text style={styles.actionLabel}>Waze</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: '#388E3C' }]}
            onPress={getCurrentLocation}
          >
            <Text style={styles.actionIcon}>📍</Text>
            <Text style={styles.actionLabel}>{locating ? '...' : 'Mi ubicación'}</Text>
          </TouchableOpacity>
        </View>
        {currentLocation ? (
          <View style={styles.locationInfo}>
            <Text style={styles.locationText}>
              📍 {currentLocation.lat.toFixed(4)}, {currentLocation.lng.toFixed(4)}
            </Text>
          </View>
        ) : null}
        {locationError ? (
          <View style={styles.locationError}>
            <Text style={styles.locationErrorText}>{locationError}</Text>
          </View>
        ) : null}

        <View style={styles.filterRow}>
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f.key}
              style={[
                styles.filterChip,
                {
                  backgroundColor: filter === f.key ? colors.primary : colors.surface,
                  borderColor: filter === f.key ? colors.primary : colors.border,
                },
              ]}
              onPress={() => setFilter(f.key)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  { color: filter === f.key ? '#FFFFFF' : colors.textSecondary },
                ]}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.savedSection}>
        <View style={styles.savedHeader}>
          <Text style={[styles.savedTitle, { color: colors.text }]}>Lugares de Panamá</Text>
          <Text style={[styles.savedCount, { color: colors.textSecondary }]}>{allLocations.length}</Text>
        </View>
        <FlatList
          data={allLocations}
          renderItem={renderAddressItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Card>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                {search
                  ? 'No se encontraron lugares'
                  : 'No hay lugares disponibles.'}
              </Text>
            </Card>
          }
        />
      </View>
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
  },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  backArrow: { fontSize: 20, color: '#FFFFFF', fontWeight: 'bold', lineHeight: 22 },
  headerIcon: { fontSize: 32, marginRight: 12 },
  headerText: { flex: 1 },
  headerTitle: {
    fontSize: SIZES.xl,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: SIZES.sm,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    height: 50,
  },
  searchIcon: { fontSize: 18, marginRight: 10 },
  searchInput: {
    flex: 1,
    fontSize: SIZES.md,
    height: 50,
  },
  clearBtn: {
    fontSize: 16,
    color: '#999',
    paddingLeft: 10,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  locationInfo: {
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: '#E8F5E9',
  },
  locationText: {
    fontSize: SIZES.sm,
    color: '#2E7D32',
    fontWeight: '600',
    textAlign: 'center',
  },
  locationError: {
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: '#FFEBEE',
  },
  locationErrorText: {
    fontSize: SIZES.sm,
    color: '#C62828',
    fontWeight: '500',
    textAlign: 'center',
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
  },
  actionIcon: { fontSize: 20 },
  actionLabel: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: SIZES.sm,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  filterChip: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: SIZES.sm,
    fontWeight: '600',
  },
  savedSection: { flex: 1, paddingHorizontal: 16 },
  savedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  savedTitle: {
    fontSize: SIZES.lg,
    fontWeight: 'bold',
  },
  savedCount: {
    fontSize: SIZES.sm,
    fontWeight: '600',
  },
  listContent: { paddingBottom: 20 },
  addressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
  },
  addressIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  addressIconText: { fontSize: 22 },
  addressInfo: { flex: 1 },
  addressLabel: {
    fontSize: SIZES.md,
    fontWeight: '600',
  },
  addressText: {
    fontSize: SIZES.sm,
    marginTop: 2,
  },
  addressType: {
    fontSize: SIZES.xs,
    fontWeight: '500',
    marginTop: 2,
  },
  navBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  navBtnText: { fontSize: 20 },
  emptyText: {
    textAlign: 'center',
    padding: 20,
    fontSize: SIZES.sm,
  },
});

export default NavigationScreen;
