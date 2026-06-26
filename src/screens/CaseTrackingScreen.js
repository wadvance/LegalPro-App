import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, Alert, Modal, ScrollView,
} from 'react-native';
import { onAuthChange } from '../../firebase/auth';
import { updateDocument, subscribeToCollection } from '../services/firestoreService';
import Card from '../components/Card';
import Header from '../components/Header';
import { SIZES } from '../utils/theme';
import { useTheme } from '../context/ThemeContext';
import { formatDateTime } from '../utils/helpers';

const CaseTrackingScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const [user, setUser] = useState(null);
  const [expedientes, setExpedientes] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedExpediente, setSelectedExpediente] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [movimientoForm, setMovimientoForm] = useState({
    tipo: 'Avance', descripcion: '',
  });

  useEffect(() => {
    const unsubAuth = onAuthChange((currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const unsubExp = subscribeToCollection('expedientes', (data) => {
          setExpedientes(data);
        }, [{ field: 'abogadoId', operator: '==', value: currentUser.uid }]);
        return unsubExp;
      }
    });
    return unsubAuth;
  }, []);

  const filtered = expedientes.filter((e) =>
    `${e.numero} ${e.clienteNombre} ${e.tipo}`
      .toLowerCase().includes(search.toLowerCase())
  );

  const addMovimiento = async () => {
    if (!movimientoForm.descripcion) {
      Alert.alert('Error', 'La descripción es obligatoria');
      return;
    }
    const movimientos = selectedExpediente.movimientos || [];
    const nuevoMov = {
      id: Date.now().toString(),
      fecha: new Date(),
      tipo: movimientoForm.tipo,
      descripcion: movimientoForm.descripcion,
      usuario: user.displayName || 'Usuario',
    };
    movimientos.push(nuevoMov);
    await updateDocument('expedientes', selectedExpediente.id, {
      movimientos,
      ultimaActualizacion: new Date(),
    });
    setSelectedExpediente({ ...selectedExpediente, movimientos });
    setMovimientoForm({ tipo: 'Avance', descripcion: '' });
  };

  const tiposMovimiento = [
    'Avance', 'Audiencia', 'Notificación', 'Resolución',
    'Apelación', 'Prueba', 'Acuerdo', 'Sentencia',
    'Archivo', 'Otro',
  ];

  const renderItem = ({ item }) => (
    <TouchableOpacity onPress={() => setSelectedExpediente(item)}>
      <Card icon="⚖️" title={`Expediente #${item.numero}`}
        subtitle={item.clienteNombre} badge={item.estado}>
        <Text style={[styles.expInfo, { color: colors.textSecondary }]}>
          {item.tipo} · {item.movimientos?.length || 0} movimientos
        </Text>
        {item.ultimaActualizacion && (
          <Text style={[styles.updateText, { color: colors.disabled }]}>
            Última actualización: {formatDateTime(item.ultimaActualizacion)}
          </Text>
        )}
      </Card>
    </TouchableOpacity>
  );

  const renderMovimiento = ({ item }) => (
    <View style={[styles.movimientoItem, { backgroundColor: colors.background }]}>
      <View style={styles.movimientoHeader}>
        <Text style={[styles.movTipo, { color: colors.primary }]}>{item.tipo}</Text>
        <Text style={[styles.movFecha, { color: colors.textSecondary }]}>
          {item.fecha ? new Date(item.fecha).toLocaleDateString('es-PA') : ''}
        </Text>
      </View>
      <Text style={[styles.movDescripcion, { color: colors.text }]}>{item.descripcion}</Text>
      <Text style={[styles.movUsuario, { color: colors.disabled }]}>por {item.usuario}</Text>
    </View>
  );

  if (selectedExpediente) {
    return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Header
          title={`#${selectedExpediente.numero}`}
          subtitle={selectedExpediente.clienteNombre}
          onBack={() => setSelectedExpediente(null)}
          rightAction={() => setModalVisible(true)}
          rightIcon="+"
        />
        <ScrollView contentContainerStyle={styles.detailContainer}>
          <Card title="Información del Expediente" icon="📋">
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Cliente:</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>{selectedExpediente.clienteNombre}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Tipo:</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>{selectedExpediente.tipo}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Estado:</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>{selectedExpediente.estado}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Descripción:</Text>
            </View>
            <Text style={[styles.descripcionText, { color: colors.text }]}>
              {selectedExpediente.descripcion || 'Sin descripción'}
            </Text>
          </Card>

          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Movimientos ({selectedExpediente.movimientos?.length || 0})
          </Text>

          {(selectedExpediente.movimientos || []).length > 0 ? (
            (selectedExpediente.movimientos || []).sort((a, b) => {
              const dateA = new Date(a.fecha || 0);
              const dateB = new Date(b.fecha || 0);
              return dateB - dateA;
            }).map((mov, i) => (
              <View key={mov.id || i} style={[styles.movimientoCard, { backgroundColor: colors.surface, borderLeftColor: colors.primary }]}>
                <View style={styles.movHeader}>
                  <View style={[styles.movBadge, { backgroundColor: getTipoColor(mov.tipo) + '20' }]}>
                    <Text style={[styles.movBadgeText, { color: getTipoColor(mov.tipo) }]}>{mov.tipo}</Text>
                  </View>
                  <Text style={[styles.movFec, { color: colors.textSecondary }]}>{mov.fecha ? new Date(mov.fecha).toLocaleDateString('es-PA') : ''}</Text>
                </View>
                <Text style={[styles.movDesc, { color: colors.text }]}>{mov.descripcion}</Text>
                <Text style={[styles.movUser, { color: colors.disabled }]}>{mov.usuario}</Text>
              </View>
            ))
          ) : (
            <Card><Text style={[styles.noData, { color: colors.textSecondary }]}>Sin movimientos registrados</Text></Card>
          )}
        </ScrollView>

        <Modal visible={modalVisible} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
              <Text style={[styles.modalTitle, { color: colors.primary }]}>Nuevo Movimiento</Text>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Tipo:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsContainer}>
                {tiposMovimiento.map((t) => (
                  <TouchableOpacity key={t}
                    style={[styles.chip, { borderColor: colors.border }, movimientoForm.tipo === t && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                    onPress={() => setMovimientoForm({ ...movimientoForm, tipo: t })}>
                    <Text style={[styles.chipText, { color: colors.text }, movimientoForm.tipo === t && { color: colors.textLight }]}>
                      {t}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TextInput style={[styles.input, styles.textArea, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]} placeholder="Descripción del movimiento *"
                placeholderTextColor={colors.disabled}
                value={movimientoForm.descripcion}
                onChangeText={(v) => setMovimientoForm({ ...movimientoForm, descripcion: v })}
                multiline />
              <View style={styles.modalButtons}>
                <TouchableOpacity style={[styles.cancelBtn, { borderColor: colors.border }]}
                  onPress={() => setModalVisible(false)}>
                  <Text style={[styles.cancelText, { color: colors.textSecondary }]}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.primary }]} onPress={addMovimiento}>
                  <Text style={[styles.saveText, { color: colors.textLight }]}>Agregar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header title="Seguimiento de Expedientes"
        subtitle="Sistema Penal Acusatorio y más"
        onBack={() => navigation.goBack()} />
      <View style={[styles.searchContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput style={[styles.searchInput, { color: colors.text }]} placeholder="Buscar expediente..."
          value={search} onChangeText={setSearch} placeholderTextColor={colors.disabled} />
      </View>
      <FlatList data={filtered} renderItem={renderItem} keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Card><Text style={[styles.noData, { color: colors.textSecondary }]}>Sin expedientes registrados</Text></Card>} />
    </View>
  );
};

const getTipoColor = (tipo) => {
  const colors = {
    Avance: '#1976D2', Audiencia: '#F57C00', Notificación: '#388E3C',
    Resolución: '#7B1FA2', Apelación: '#D32F2F', Prueba: '#00897B',
    Acuerdo: '#43A047', Sentencia: '#1A237E', Archivo: '#757575',
  };
  return colors[tipo] || '#757575';
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center',
    margin: SIZES.padding, borderRadius: 12, paddingHorizontal: 12, height: 45,
    borderWidth: 1,
  },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, fontSize: SIZES.md },
  list: { padding: SIZES.padding },
  expInfo: { fontSize: SIZES.sm, marginTop: 4 },
  updateText: { fontSize: SIZES.xs, marginTop: 4 },
  noData: { textAlign: 'center', padding: 20 },
  detailContainer: { padding: SIZES.padding, paddingBottom: 40 },
  detailRow: { flexDirection: 'row', marginBottom: 6 },
  detailLabel: { fontSize: SIZES.sm, width: 80 },
  detailValue: { fontSize: SIZES.sm, fontWeight: '500', flex: 1 },
  descripcionText: { fontSize: SIZES.sm, marginTop: 4, fontStyle: 'italic' },
  sectionTitle: {
    fontSize: SIZES.xl, fontWeight: 'bold',
    marginTop: 15, marginBottom: 10,
  },
  movimientoCard: {
    borderRadius: 12, padding: 14,
    marginBottom: 8, borderLeftWidth: 3,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1, shadowRadius: 3, elevation: 2,
  },
  movHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  movBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8 },
  movBadgeText: { fontSize: SIZES.xs, fontWeight: '600' },
  movFec: { fontSize: SIZES.xs },
  movDesc: { fontSize: SIZES.sm, lineHeight: 20 },
  movUser: { fontSize: SIZES.xs, marginTop: 4 },
  movimientoItem: { padding: 10, borderRadius: 8, marginBottom: 8 },
  movimientoHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  movTipo: { fontSize: SIZES.sm, fontWeight: '600' },
  movFecha: { fontSize: SIZES.xs },
  movDescripcion: { fontSize: SIZES.sm, marginTop: 4 },
  movUsuario: { fontSize: SIZES.xs, marginTop: 4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: {
    borderTopLeftRadius: 30, borderTopRightRadius: 30,
    padding: 25,
  },
  modalTitle: { fontSize: SIZES.xxl, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
  fieldLabel: { fontSize: SIZES.sm, marginBottom: 6, fontWeight: '500' },
  chipsContainer: { marginBottom: 12 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 16,
    borderWidth: 1, marginRight: 6,
  },
  chipText: { fontSize: SIZES.xs },
  input: {
    borderRadius: 10, paddingHorizontal: 15,
    height: 45, marginBottom: 10, fontSize: SIZES.md,
    borderWidth: 1,
  },
  textArea: { height: 100, paddingTop: 12, textAlignVertical: 'top' },
  modalButtons: { flexDirection: 'row', marginTop: 10, gap: 10 },
  cancelBtn: {
    flex: 1, height: 48, borderRadius: 12, borderWidth: 1,
    justifyContent: 'center', alignItems: 'center',
  },
  cancelText: { fontSize: SIZES.md, fontWeight: '600' },
  saveBtn: {
    flex: 1, height: 48, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
  },
  saveText: { fontSize: SIZES.md, fontWeight: '600' },
});

export default CaseTrackingScreen;
