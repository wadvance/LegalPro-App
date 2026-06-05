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
import { COLORS, SIZES } from '../utils/theme';
import { TIPOS_EXPEDIENTE, ESTADOS_EXPEDIENTE } from '../utils/constants';

const ExpedientesScreen = ({ navigation }) => {
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
        <Text style={styles.expInfo}>{item.tipo} · {item.descripcion?.substring(0, 80)}</Text>
        <View style={styles.expActions}>
          <TouchableOpacity style={styles.pdfBtn} onPress={() => generatePDF(item)}>
            <Text style={styles.pdfBtnText}>📄 PDF</Text>
          </TouchableOpacity>
        </View>
      </Card>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Header title="Expedientes" subtitle={`${expedientes.length} registrados`}
        onBack={() => navigation.goBack()}
        rightAction={() => { resetForm(); setModalVisible(true); }} rightIcon="+" />
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput style={styles.searchInput} placeholder="Buscar expediente..." value={search}
          onChangeText={setSearch} placeholderTextColor={COLORS.disabled} />
      </View>
      <FlatList data={filtered} renderItem={renderItem} keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Card><Text style={styles.emptyText}>No hay expedientes</Text></Card>} />

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editingExpediente ? 'Editar Expediente' : 'Nuevo Expediente'}</Text>
            {!editingExpediente && (
              <View>
                <Text style={styles.fieldLabel}>Cliente:</Text>
                <FlatList data={clients} horizontal showsHorizontalScrollIndicator={false}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[styles.clientChip, form.clienteId === item.id && styles.clientChipActive]}
                      onPress={() => selectClient(item)}>
                      <Text style={[styles.clientChipText, form.clienteId === item.id && { color: COLORS.textLight }]}>
                        {item.nombre} {item.apellido}
                      </Text>
                    </TouchableOpacity>
                  )}
                  keyExtractor={(item) => item.id} />
              </View>
            )}
            <TextInput style={styles.input} placeholder="Número de Expediente *"
              value={form.numero} onChangeText={(v) => setForm({ ...form, numero: v })} />
            <TextInput style={styles.input} placeholder="Cliente" value={form.clienteNombre}
              onChangeText={(v) => setForm({ ...form, clienteNombre: v })} />
            <Text style={styles.fieldLabel}>Tipo:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsContainer}>
              {TIPOS_EXPEDIENTE.map((t) => (
                <TouchableOpacity key={t} style={[styles.chip, form.tipo === t && styles.chipActive]}
                  onPress={() => setForm({ ...form, tipo: t })}>
                  <Text style={[styles.chipText, form.tipo === t && { color: COLORS.textLight }]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Text style={styles.fieldLabel}>Estado:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsContainer}>
              {ESTADOS_EXPEDIENTE.map((e) => (
                <TouchableOpacity key={e} style={[styles.chip, form.estado === e && styles.chipActive]}
                  onPress={() => setForm({ ...form, estado: e })}>
                  <Text style={[styles.chipText, form.estado === e && { color: COLORS.textLight }]}>{e}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TextInput style={[styles.input, styles.textArea]} placeholder="Descripción del caso"
              value={form.descripcion} onChangeText={(v) => setForm({ ...form, descripcion: v })} multiline />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelBtn}
                onPress={() => { setModalVisible(false); resetForm(); }}>
                <Text style={styles.cancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                <Text style={styles.saveText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
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
  list: { paddingHorizontal: SIZES.padding, paddingBottom: 20 },
  expInfo: { fontSize: SIZES.xs, color: COLORS.textSecondary, marginTop: 4 },
  expActions: { flexDirection: 'row', marginTop: 8 },
  pdfBtn: {
    paddingHorizontal: 14, paddingVertical: 5, borderRadius: 8,
    backgroundColor: COLORS.primary + '10',
  },
  pdfBtnText: { fontSize: SIZES.xs, color: COLORS.primary, fontWeight: '500' },
  emptyText: { textAlign: 'center', color: COLORS.textSecondary, padding: 20 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: COLORS.surface, borderTopLeftRadius: 30, borderTopRightRadius: 30,
    padding: 25, maxHeight: '85%',
  },
  modalTitle: { fontSize: SIZES.xxl, fontWeight: 'bold', color: COLORS.primary, marginBottom: 15, textAlign: 'center' },
  fieldLabel: { fontSize: SIZES.sm, color: COLORS.textSecondary, marginBottom: 5, marginTop: 5, fontWeight: '500' },
  clientChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1, borderColor: COLORS.border, marginRight: 8, marginBottom: 10,
  },
  clientChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  clientChipText: { fontSize: SIZES.xs, color: COLORS.text },
  input: {
    backgroundColor: COLORS.background, borderRadius: 10, paddingHorizontal: 15,
    height: 45, marginBottom: 10, fontSize: SIZES.md, color: COLORS.text,
    borderWidth: 1, borderColor: COLORS.border,
  },
  textArea: { height: 80, paddingTop: 12, textAlignVertical: 'top' },
  chipsContainer: { marginBottom: 10 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 16,
    borderWidth: 1, borderColor: COLORS.border, marginRight: 6, marginBottom: 5,
  },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontSize: SIZES.xs, color: COLORS.text },
  modalButtons: { flexDirection: 'row', marginTop: 15, gap: 10 },
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

export default ExpedientesScreen;
