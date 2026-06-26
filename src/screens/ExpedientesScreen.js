import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, Alert, Modal, ScrollView,
} from 'react-native';
import { onAuthChange } from '../../firebase/auth';
import { createDocument, updateDocument, deleteDocument, subscribeToCollection } from '../services/firestoreService';
import { sendCaseUpdate } from '../services/whatsapp';
import { generateCaseReportPDF, sharePDF } from '../services/pdfGenerator';
import Card from '../components/Card';
import Header from '../components/Header';
import Loading from '../components/Loading';
import { SIZES } from '../utils/theme';
import { useTheme } from '../context/ThemeContext';
import { TIPOS_EXPEDIENTE, ESTADOS_EXPEDIENTE } from '../utils/constants';

const ExpedientesScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const [user, setUser] = useState(null);
  const [expedientes, setExpedientes] = useState([]);
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingExpediente, setEditingExpediente] = useState(null);
  const [form, setForm] = useState({
    numero: '', tipo: 'Civil', clienteId: '', clienteNombre: '',
    clienteTelefono: '', estado: 'Activo', descripcion: '',
    fechaApertura: new Date(), movimientos: [],
  });

  useEffect(() => {
    const unsubAuth = onAuthChange((currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const unsubExp = subscribeToCollection('expedientes', (data) => {
          setExpedientes(data);
        }, [{ field: 'abogadoId', operator: '==', value: currentUser.uid }]);
        const unsubCli = subscribeToCollection('clientes', (data) => setClients(data));
        return () => { unsubExp(); unsubCli(); };
      }
    });
    return unsubAuth;
  }, []);

  const filtered = expedientes.filter((e) =>
    `${e.numero} ${e.clienteNombre} ${e.tipo} ${e.estado}`
      .toLowerCase().includes(search.toLowerCase())
  );

  const resetForm = () => {
    setForm({
      numero: '', tipo: 'Civil', clienteId: '', clienteNombre: '',
      clienteTelefono: '', estado: 'Activo', descripcion: '',
      fechaApertura: new Date(), movimientos: [],
    });
    setEditingExpediente(null);
  };

  const selectClient = (client) => {
    setForm({
      ...form,
      clienteId: client.id,
      clienteNombre: `${client.nombre} ${client.apellido}`,
      clienteTelefono: client.telefono || '',
    });
  };

  const handleSave = async () => {
    if (!form.numero || !form.clienteNombre) {
      Alert.alert('Error', 'Número de expediente y cliente son obligatorios');
      return;
    }
    const data = {
      ...form,
      abogadoId: user.uid,
      abogadoNombre: user.displayName || '',
    };
    if (editingExpediente) {
      await updateDocument('expedientes', editingExpediente.id, data);
      if (form.clienteTelefono) {
        sendCaseUpdate(form.clienteTelefono, form.clienteNombre, form.numero, form.estado);
      }
    } else {
      await createDocument('expedientes', data);
    }
    setModalVisible(false);
    resetForm();
  };

  const generatePDF = async (exp) => {
    const result = await generateCaseReportPDF(exp);
    if (result.success) {
      await sharePDF(result.uri, `Expediente_${exp.numero}`);
    } else {
      Alert.alert('Error', 'No se pudo generar el PDF');
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity onPress={() => {
      setEditingExpediente(item);
      setForm({
        numero: item.numero, tipo: item.tipo, clienteId: item.clienteId,
        clienteNombre: item.clienteNombre, clienteTelefono: item.clienteTelefono || '',
        estado: item.estado, descripcion: item.descripcion || '',
        fechaApertura: item.fechaApertura ? new Date(item.fechaApertura) : new Date(),
        movimientos: item.movimientos || [],
      });
      setModalVisible(true);
    }}>
      <Card icon="📁" title={`#${item.numero}`} subtitle={item.clienteNombre} badge={item.estado}>
        <Text style={[styles.expInfo, { color: colors.textSecondary }]}>{item.tipo} · {item.descripcion?.substring(0, 80)}</Text>
        <View style={styles.expActions}>
          <TouchableOpacity style={[styles.pdfBtn, { backgroundColor: colors.primary + '10' }]} onPress={() => generatePDF(item)}>
            <Text style={[styles.pdfBtnText, { color: colors.primary }]}>📄 PDF</Text>
          </TouchableOpacity>
        </View>
      </Card>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header title="Expedientes" subtitle={`${expedientes.length} registrados`}
        onBack={() => navigation.goBack()}
        rightAction={() => { resetForm(); setModalVisible(true); }} rightIcon="+" />
      <View style={[styles.searchContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput style={[styles.searchInput, { color: colors.text }]} placeholder="Buscar expediente..." value={search}
          onChangeText={setSearch} placeholderTextColor={colors.disabled} />
      </View>
      <FlatList data={filtered} renderItem={renderItem} keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Card><Text style={[styles.emptyText, { color: colors.textSecondary }]}>No hay expedientes</Text></Card>} />

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <ScrollView style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.primary }]}>{editingExpediente ? 'Editar Expediente' : 'Nuevo Expediente'}</Text>
            {!editingExpediente && (
              <View>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Cliente:</Text>
                <FlatList data={clients} horizontal showsHorizontalScrollIndicator={false}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[styles.clientChip, { borderColor: colors.border }, form.clienteId === item.id && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                      onPress={() => selectClient(item)}>
                      <Text style={[styles.clientChipText, { color: colors.text }, form.clienteId === item.id && { color: colors.textLight }]}>
                        {item.nombre} {item.apellido}
                      </Text>
                    </TouchableOpacity>
                  )}
                  keyExtractor={(item) => item.id} />
              </View>
            )}
            <TextInput style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]} placeholder="Número de Expediente *"
              value={form.numero} onChangeText={(v) => setForm({ ...form, numero: v })} />
            <TextInput style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]} placeholder="Cliente" value={form.clienteNombre}
              onChangeText={(v) => setForm({ ...form, clienteNombre: v })} />
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Tipo:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsContainer}>
              {TIPOS_EXPEDIENTE.map((t) => (
                <TouchableOpacity key={t} style={[styles.chip, { borderColor: colors.border }, form.tipo === t && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                  onPress={() => setForm({ ...form, tipo: t })}>
                  <Text style={[styles.chipText, { color: colors.text }, form.tipo === t && { color: colors.textLight }]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Estado:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsContainer}>
              {ESTADOS_EXPEDIENTE.map((e) => (
                <TouchableOpacity key={e} style={[styles.chip, { borderColor: colors.border }, form.estado === e && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                  onPress={() => setForm({ ...form, estado: e })}>
                  <Text style={[styles.chipText, { color: colors.text }, form.estado === e && { color: colors.textLight }]}>{e}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TextInput style={[styles.input, styles.textArea, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]} placeholder="Descripción del caso"
              value={form.descripcion} onChangeText={(v) => setForm({ ...form, descripcion: v })} multiline />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.cancelBtn, { borderColor: colors.border }]}
                onPress={() => { setModalVisible(false); resetForm(); }}>
                <Text style={[styles.cancelText, { color: colors.textSecondary }]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.primary }]} onPress={handleSave}>
                <Text style={[styles.saveText, { color: colors.textLight }]}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
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
  list: { paddingHorizontal: SIZES.padding, paddingBottom: 20 },
  expInfo: { fontSize: SIZES.xs, marginTop: 4 },
  expActions: { flexDirection: 'row', marginTop: 8 },
  pdfBtn: {
    paddingHorizontal: 14, paddingVertical: 5, borderRadius: 8,
  },
  pdfBtnText: { fontSize: SIZES.xs, fontWeight: '500' },
  emptyText: { textAlign: 'center', padding: 20 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: {
    borderTopLeftRadius: 30, borderTopRightRadius: 30,
    padding: 25, maxHeight: '85%',
  },
  modalTitle: { fontSize: SIZES.xxl, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
  fieldLabel: { fontSize: SIZES.sm, marginBottom: 5, marginTop: 5, fontWeight: '500' },
  clientChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1, marginRight: 8, marginBottom: 10,
  },
  clientChipActive: {},
  clientChipText: { fontSize: SIZES.xs },
  input: {
    borderRadius: 10, paddingHorizontal: 15,
    height: 45, marginBottom: 10, fontSize: SIZES.md,
    borderWidth: 1,
  },
  textArea: { height: 80, paddingTop: 12, textAlignVertical: 'top' },
  chipsContainer: { marginBottom: 10 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 16,
    borderWidth: 1, marginRight: 6, marginBottom: 5,
  },
  chipActive: {},
  chipText: { fontSize: SIZES.xs },
  modalButtons: { flexDirection: 'row', marginTop: 15, gap: 10 },
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

export default ExpedientesScreen;
