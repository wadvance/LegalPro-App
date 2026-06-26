import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, Alert, Modal,
} from 'react-native';
import { onAuthChange } from '../../firebase/auth';
import { createDocument, updateDocument, deleteDocument, subscribeToCollection } from '../services/firestoreService';
import { navigateToAddress } from '../services/maps';
import Card from '../components/Card';
import Header from '../components/Header';
import { SIZES } from '../utils/theme';
import { useTheme } from '../context/ThemeContext';

const CompaniesScreen = ({ navigation }) => {
  const { colors } = useTheme();
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
        <View style={styles.compInfoRow}>
          <Text style={[styles.compInfo, { color: colors.textSecondary, flex: 1 }]}>
            Rep. Legal: {item.representanteLegal || 'N/A'} · {item.telefono || 'Sin teléfono'}
          </Text>
          {item.direccion ? (
            <TouchableOpacity onPress={() => navigateToAddress(item.direccion, item.nombre)}>
              <Text style={[styles.mapIcon, { color: colors.primary }]}>📍</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </Card>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header title="Empresas" subtitle={`${companies.length} registradas`}
        onBack={() => navigation.goBack()}
        rightAction={() => { resetForm(); setModalVisible(true); }} rightIcon="+" />

      <View style={[styles.searchContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput style={[styles.searchInput, { color: colors.text }]} placeholder="Buscar por nombre, RUC o representante..."
          value={search} onChangeText={setSearch} placeholderTextColor={colors.disabled} />
      </View>

      <FlatList data={filtered} renderItem={renderItem} keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Card><Text style={[styles.emptyText, { color: colors.textSecondary }]}>No hay empresas registradas</Text></Card>} />

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <FlatList style={[styles.modalContent, { backgroundColor: colors.surface }]}
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
                <Text style={[styles.modalTitle, { color: colors.primary }]}>
                  {editingCompany ? 'Editar Empresa' : 'Nueva Empresa'}
                </Text>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Tipo de Sociedad:</Text>
                <FlatList data={tiposSociedad} horizontal showsHorizontalScrollIndicator={false}
                  renderItem={({ item }) => (
                    <TouchableOpacity style={[styles.chip, { borderColor: colors.border }, form.tipo === item && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                      onPress={() => setForm({ ...form, tipo: item })}>
                      <Text style={[styles.chipText, { color: colors.text }, form.tipo === item && { color: colors.textLight }]}>{item}</Text>
                    </TouchableOpacity>
                  )}
                  keyExtractor={(item) => item}
                  style={{ marginBottom: 10 }}
                />
              </>
            }
            renderItem={({ item }) => (
              <TextInput style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]} placeholder={item.placeholder}
                placeholderTextColor={colors.disabled}
                value={form[item.key]} onChangeText={(v) => setForm({ ...form, [item.key]: v })} />
            )}
            keyExtractor={(item) => item.key}
            ListFooterComponent={
              <View style={styles.modalButtons}>
                <TouchableOpacity style={[styles.cancelBtn, { borderColor: colors.border }]}
                  onPress={() => { setModalVisible(false); resetForm(); }}>
                  <Text style={[styles.cancelText, { color: colors.textSecondary }]}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.primary }]} onPress={handleSave}>
                  <Text style={[styles.saveText, { color: colors.textLight }]}>Guardar</Text>
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
  container: { flex: 1 },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center',
    margin: SIZES.padding, borderRadius: 12, paddingHorizontal: 12, height: 45,
    borderWidth: 1,
  },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, fontSize: SIZES.md },
  list: { paddingHorizontal: SIZES.padding, paddingBottom: 20 },
  compInfo: { fontSize: SIZES.xs, marginTop: 2 },
  compInfoRow: { flexDirection: 'row', alignItems: 'center' },
  mapIcon: { fontSize: 18, marginLeft: 8, padding: 2 },
  emptyText: { textAlign: 'center', padding: 20 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: {
    borderTopLeftRadius: 30, borderTopRightRadius: 30,
    padding: 25, maxHeight: '80%',
  },
  modalTitle: { fontSize: SIZES.xxl, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
  fieldLabel: { fontSize: SIZES.sm, marginBottom: 6, fontWeight: '500' },
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

export default CompaniesScreen;
