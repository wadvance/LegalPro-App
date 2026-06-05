import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, Alert, Modal,
} from 'react-native';
import { onAuthChange } from '../../firebase/auth';
import { createDocument, updateDocument, deleteDocument, subscribeToCollection } from '../services/firestoreService';
import Card from '../components/Card';
import Header from '../components/Header';
import { COLORS, SIZES } from '../utils/theme';

const CompaniesScreen = ({ navigation }) => {
  const [user, setUser] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [search, setSearch] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);
  const [form, setForm] = useState({
    nombre: '', ruc: '', tipo: 'Sociedad Anónima', telefono: '',
    email: '', direccion: '', representanteLegal: '', notas: '',
  });

  useEffect(() => {
    const unsubAuth = onAuthChange((currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const unsubComp = subscribeToCollection('empresas', (data) => {
          setCompanies(data);
        }, [{ field: 'abogadoId', operator: '==', value: currentUser.uid }]);
        return unsubComp;
      }
    });
    return unsubAuth;
  }, []);

  const filtered = companies.filter((c) =>
    `${c.nombre} ${c.ruc || ''} ${c.representanteLegal || ''}`
      .toLowerCase().includes(search.toLowerCase())
  );

  const resetForm = () => {
    setForm({
      nombre: '', ruc: '', tipo: 'Sociedad Anónima', telefono: '',
      email: '', direccion: '', representanteLegal: '', notas: '',
    });
    setEditingCompany(null);
  };

  const openEdit = (company) => {
    setEditingCompany(company);
    setForm({
      nombre: company.nombre || '',
      ruc: company.ruc || '',
      tipo: company.tipo || 'Sociedad Anónima',
      telefono: company.telefono || '',
      email: company.email || '',
      direccion: company.direccion || '',
      representanteLegal: company.representanteLegal || '',
      notas: company.notas || '',
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!form.nombre) {
      Alert.alert('Error', 'El nombre de la empresa es obligatorio');
      return;
    }
    if (editingCompany) {
      await updateDocument('empresas', editingCompany.id, form);
    } else {
      await createDocument('empresas', { ...form, abogadoId: user.uid });
    }
    setModalVisible(false);
    resetForm();
  };

  const handleDelete = (id) => {
    Alert.alert('Eliminar Empresa', '¿Está seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => deleteDocument('empresas', id) },
    ]);
  };

  const tiposSociedad = [
    'Sociedad Anónima', 'S.R.L.', 'Sociedad en Comandita',
    'Sociedad Colectiva', 'Fundación', 'Asociación',
    'Corp.', 'Inc.', 'LLC', 'Otro',
  ];

  const renderItem = ({ item }) => (
    <TouchableOpacity onPress={() => openEdit(item)} onLongPress={() => handleDelete(item.id)}>
      <Card icon="🏢" title={item.nombre} subtitle={`RUC: ${item.ruc || 'N/A'}`} badge={item.tipo}>
        <Text style={styles.compInfo}>
          Rep. Legal: {item.representanteLegal || 'N/A'} · {item.telefono || 'Sin teléfono'}
        </Text>
      </Card>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Header title="Empresas" subtitle={`${companies.length} registradas`}
        onBack={() => navigation.goBack()}
        rightAction={() => { resetForm(); setModalVisible(true); }} rightIcon="+" />

      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput style={styles.searchInput} placeholder="Buscar por nombre, RUC o representante..."
          value={search} onChangeText={setSearch} placeholderTextColor={COLORS.disabled} />
      </View>

      <FlatList data={filtered} renderItem={renderItem} keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Card><Text style={styles.emptyText}>No hay empresas registradas</Text></Card>} />

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <FlatList style={styles.modalContent}
            data={[
              { key: 'nombre', placeholder: 'Nombre de la Empresa *' },
              { key: 'ruc', placeholder: 'RUC' },
              { key: 'telefono', placeholder: 'Teléfono' },
              { key: 'email', placeholder: 'Email' },
              { key: 'direccion', placeholder: 'Dirección' },
              { key: 'representanteLegal', placeholder: 'Representante Legal' },
              { key: 'notas', placeholder: 'Notas' },
            ]}
            ListHeaderComponent={
              <>
                <Text style={styles.modalTitle}>
                  {editingCompany ? 'Editar Empresa' : 'Nueva Empresa'}
                </Text>
                <Text style={styles.fieldLabel}>Tipo de Sociedad:</Text>
                <FlatList data={tiposSociedad} horizontal showsHorizontalScrollIndicator={false}
                  renderItem={({ item }) => (
                    <TouchableOpacity style={[styles.chip, form.tipo === item && styles.chipActive]}
                      onPress={() => setForm({ ...form, tipo: item })}>
                      <Text style={[styles.chipText, form.tipo === item && { color: COLORS.textLight }]}>{item}</Text>
                    </TouchableOpacity>
                  )}
                  keyExtractor={(item) => item}
                  style={{ marginBottom: 10 }}
                />
              </>
            }
            renderItem={({ item }) => (
              <TextInput style={styles.input} placeholder={item.placeholder}
                placeholderTextColor={COLORS.disabled}
                value={form[item.key]} onChangeText={(v) => setForm({ ...form, [item.key]: v })} />
            )}
            keyExtractor={(item) => item.key}
            ListFooterComponent={
              <View style={styles.modalButtons}>
                <TouchableOpacity style={styles.cancelBtn}
                  onPress={() => { setModalVisible(false); resetForm(); }}>
                  <Text style={styles.cancelText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                  <Text style={styles.saveText}>Guardar</Text>
                </TouchableOpacity>
              </View>
            }
          />
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
  compInfo: { fontSize: SIZES.xs, color: COLORS.textSecondary, marginTop: 2 },
  emptyText: { textAlign: 'center', color: COLORS.textSecondary, padding: 20 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: COLORS.surface, borderTopLeftRadius: 30, borderTopRightRadius: 30,
    padding: 25, maxHeight: '80%',
  },
  modalTitle: { fontSize: SIZES.xxl, fontWeight: 'bold', color: COLORS.primary, marginBottom: 15, textAlign: 'center' },
  fieldLabel: { fontSize: SIZES.sm, color: COLORS.textSecondary, marginBottom: 6, fontWeight: '500' },
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

export default CompaniesScreen;
