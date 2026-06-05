import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, Alert, Modal, ScrollView,
} from 'react-native';
import { onAuthChange } from '../../firebase/auth';
import { updateDocument, subscribeToCollection } from '../services/firestoreService';
import Card from '../components/Card';
import Header from '../components/Header';
import { COLORS, SIZES } from '../utils/theme';
import { formatDateTime } from '../utils/helpers';

const CaseTrackingScreen = ({ navigation }) => {
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
        <Text style={styles.expInfo}>
          {item.tipo} · {item.movimientos?.length || 0} movimientos
        </Text>
        {item.ultimaActualizacion && (
          <Text style={styles.updateText}>
            Última actualización: {formatDateTime(item.ultimaActualizacion)}
          </Text>
        )}
      </Card>
    </TouchableOpacity>
  );

  const renderMovimiento = ({ item }) => (
    <View style={styles.movimientoItem}>
      <View style={styles.movimientoHeader}>
        <Text style={styles.movTipo}>{item.tipo}</Text>
        <Text style={styles.movFecha}>
          {item.fecha ? new Date(item.fecha).toLocaleDateString('es-PA') : ''}
        </Text>
      </View>
      <Text style={styles.movDescripcion}>{item.descripcion}</Text>
      <Text style={styles.movUsuario}>por {item.usuario}</Text>
    </View>
  );

  if (selectedExpediente) {
    return (
      <View style={styles.container}>
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
              <Text style={styles.detailLabel}>Cliente:</Text>
              <Text style={styles.detailValue}>{selectedExpediente.clienteNombre}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Tipo:</Text>
              <Text style={styles.detailValue}>{selectedExpediente.tipo}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Estado:</Text>
              <Text style={styles.detailValue}>{selectedExpediente.estado}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Descripción:</Text>
            </View>
            <Text style={styles.descripcionText}>
              {selectedExpediente.descripcion || 'Sin descripción'}
            </Text>
          </Card>

          <Text style={styles.sectionTitle}>
            Movimientos ({selectedExpediente.movimientos?.length || 0})
          </Text>

          {(selectedExpediente.movimientos || []).length > 0 ? (
            (selectedExpediente.movimientos || []).sort((a, b) => {
              const dateA = new Date(a.fecha || 0);
              const dateB = new Date(b.fecha || 0);
              return dateB - dateA;
            }).map((mov, i) => (
              <View key={mov.id || i} style={styles.movimientoCard}>
                <View style={styles.movHeader}>
                  <View style={[styles.movBadge, { backgroundColor: getTipoColor(mov.tipo) + '20' }]}>
                    <Text style={[styles.movBadgeText, { color: getTipoColor(mov.tipo) }]}>{mov.tipo}</Text>
                  </View>
                  <Text style={styles.movFec}>{mov.fecha ? new Date(mov.fecha).toLocaleDateString('es-PA') : ''}</Text>
                </View>
                <Text style={styles.movDesc}>{mov.descripcion}</Text>
                <Text style={styles.movUser}>{mov.usuario}</Text>
              </View>
            ))
          ) : (
            <Card><Text style={styles.noData}>Sin movimientos registrados</Text></Card>
          )}
        </ScrollView>

        <Modal visible={modalVisible} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Nuevo Movimiento</Text>
              <Text style={styles.fieldLabel}>Tipo:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsContainer}>
                {tiposMovimiento.map((t) => (
                  <TouchableOpacity key={t}
                    style={[styles.chip, movimientoForm.tipo === t && styles.chipActive]}
                    onPress={() => setMovimientoForm({ ...movimientoForm, tipo: t })}>
                    <Text style={[styles.chipText, movimientoForm.tipo === t && { color: COLORS.textLight }]}>
                      {t}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TextInput style={[styles.input, styles.textArea]} placeholder="Descripción del movimiento *"
                value={movimientoForm.descripcion}
                onChangeText={(v) => setMovimientoForm({ ...movimientoForm, descripcion: v })}
                multiline />
              <View style={styles.modalButtons}>
                <TouchableOpacity style={styles.cancelBtn}
                  onPress={() => setModalVisible(false)}>
                  <Text style={styles.cancelText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveBtn} onPress={addMovimiento}>
                  <Text style={styles.saveText}>Agregar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="Seguimiento de Expedientes"
        subtitle="Sistema Penal Acusatorio y más"
        onBack={() => navigation.goBack()} />
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput style={styles.searchInput} placeholder="Buscar expediente..."
          value={search} onChangeText={setSearch} placeholderTextColor={COLORS.disabled} />
      </View>
      <FlatList data={filtered} renderItem={renderItem} keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Card><Text style={styles.noData}>Sin expedientes registrados</Text></Card>} />
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
  container: { flex: 1, backgroundColor: COLORS.background },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface,
    margin: SIZES.padding, borderRadius: 12, paddingHorizontal: 12, height: 45,
    borderWidth: 1, borderColor: COLORS.border,
  },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, fontSize: SIZES.md, color: COLORS.text },
  list: { padding: SIZES.padding },
  expInfo: { fontSize: SIZES.sm, color: COLORS.textSecondary, marginTop: 4 },
  updateText: { fontSize: SIZES.xs, color: COLORS.disabled, marginTop: 4 },
  noData: { textAlign: 'center', color: COLORS.textSecondary, padding: 20 },
  detailContainer: { padding: SIZES.padding, paddingBottom: 40 },
  detailRow: { flexDirection: 'row', marginBottom: 6 },
  detailLabel: { fontSize: SIZES.sm, color: COLORS.textSecondary, width: 80 },
  detailValue: { fontSize: SIZES.sm, color: COLORS.text, fontWeight: '500', flex: 1 },
  descripcionText: { fontSize: SIZES.sm, color: COLORS.text, marginTop: 4, fontStyle: 'italic' },
  sectionTitle: {
    fontSize: SIZES.xl, fontWeight: 'bold', color: COLORS.text,
    marginTop: 15, marginBottom: 10,
  },
  movimientoCard: {
    backgroundColor: COLORS.surface, borderRadius: 12, padding: 14,
    marginBottom: 8, borderLeftWidth: 3, borderLeftColor: COLORS.primary,
    shadowColor: COLORS.cardShadow, shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1, shadowRadius: 3, elevation: 2,
  },
  movHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  movBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8 },
  movBadgeText: { fontSize: SIZES.xs, fontWeight: '600' },
  movFec: { fontSize: SIZES.xs, color: COLORS.textSecondary },
  movDesc: { fontSize: SIZES.sm, color: COLORS.text, lineHeight: 20 },
  movUser: { fontSize: SIZES.xs, color: COLORS.disabled, marginTop: 4 },
  movimientoItem: { padding: 10, backgroundColor: COLORS.background, borderRadius: 8, marginBottom: 8 },
  movimientoHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  movTipo: { fontSize: SIZES.sm, fontWeight: '600', color: COLORS.primary },
  movFecha: { fontSize: SIZES.xs, color: COLORS.textSecondary },
  movDescripcion: { fontSize: SIZES.sm, color: COLORS.text, marginTop: 4 },
  movUsuario: { fontSize: SIZES.xs, color: COLORS.disabled, marginTop: 4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: COLORS.surface, borderTopLeftRadius: 30, borderTopRightRadius: 30,
    padding: 25,
  },
  modalTitle: { fontSize: SIZES.xxl, fontWeight: 'bold', color: COLORS.primary, marginBottom: 15, textAlign: 'center' },
  fieldLabel: { fontSize: SIZES.sm, color: COLORS.textSecondary, marginBottom: 6, fontWeight: '500' },
  chipsContainer: { marginBottom: 12 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 16,
    borderWidth: 1, borderColor: COLORS.border, marginRight: 6,
  },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontSize: SIZES.xs, color: COLORS.text },
  input: {
    backgroundColor: COLORS.background, borderRadius: 10, paddingHorizontal: 15,
    height: 45, marginBottom: 10, fontSize: SIZES.md, color: COLORS.text,
    borderWidth: 1, borderColor: COLORS.border,
  },
  textArea: { height: 100, paddingTop: 12, textAlignVertical: 'top' },
  modalButtons: { flexDirection: 'row', marginTop: 10, gap: 10 },
  cancelBtn: {
    flex: 1, height: 48, borderRadius: 12, borderWidth: 1,
    borderColor: COLORS.border, justifyContent: 'center', alignItems: 'center',
  },
  cancelText: { color: COLORS.textSecondary, fontSize: SIZES.md, fontWeight: '600' },
  saveBtn: {
    flex: 1, height: 48, borderRadius: 12, backgroundColor: COLORS.primary,
    justifyContent: 'center', alignItems: 'center',
  },
  saveText: { color: COLORS.textLight, fontSize: SIZES.md, fontWeight: '600' },
});

export default CaseTrackingScreen;
