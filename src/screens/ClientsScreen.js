import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, Alert, Modal,
} from 'react-native';
import { onAuthChange } from '../../firebase/auth';
import { createDocument, updateDocument, deleteDocument, subscribeToCollection } from '../services/firestoreService';
import { sendWelcomeMessage } from '../services/whatsapp';
import Card from '../components/Card';
import Header from '../components/Header';
import { SIZES } from '../utils/theme';
import { useTheme } from '../context/ThemeContext';
import { formatDate } from '../utils/helpers';

const ClientsScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const [user, setUser] = useState(null);
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [form, setForm] = useState({
    nombre: '', apellido: '', cedula: '', telefono: '', email: '',
    direccion: '', ruc: '', tipo: 'Persona Natural', notas: '',
  });

  useEffect(() => {
    const unsubAuth = onAuthChange((currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const unsubClients = subscribeToCollection('clientes', (data) => {
          setClients(data);
        }, [{ field: 'abogadoId', operator: '==', value: currentUser.uid }]);
        return unsubClients;
      }
    });
    return unsubAuth;
  }, []);

  const filteredClients = clients.filter((c) =>
    `${c.nombre} ${c.apellido} ${c.cedula || ''} ${c.telefono || ''}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const resetForm = () => {
    setForm({
      nombre: '', apellido: '', cedula: '', telefono: '', email: '',
      direccion: '', ruc: '', tipo: 'Persona Natural', notas: '',
    });
    setEditingClient(null);
  };

  const openEdit = (client) => {
    setEditingClient(client);
    setForm({
      nombre: client.nombre || '',
      apellido: client.apellido || '',
      cedula: client.cedula || '',
      telefono: client.telefono || '',
      email: client.email || '',
      direccion: client.direccion || '',
      ruc: client.ruc || '',
      tipo: client.tipo || 'Persona Natural',
      notas: client.notas || '',
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!form.nombre || !form.apellido) {
      Alert.alert('Error', 'Nombre y apellido son obligatorios');
      return;
    }
    if (editingClient) {
      await updateDocument('clientes', editingClient.id, form);
    } else {
      const result = await createDocument('clientes', {
        ...form,
        abogadoId: user.uid,
        abogadoNombre: user.displayName || '',
      });
      if (result.success && form.telefono) {
        sendWelcomeMessage(form.telefono, `${form.nombre} ${form.apellido}`);
      }
    }
    setModalVisible(false);
    resetForm();
  };

  const handleDelete = (clientId) => {
    Alert.alert(
      'Eliminar Cliente',
      '¿Está seguro de eliminar este cliente? Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => deleteDocument('clientes', clientId),
        },
      ]
    );
  };

  const renderClient = ({ item }) => (
    <TouchableOpacity onPress={() => openEdit(item)} onLongPress={() => handleDelete(item.id)}>
      <Card
        icon="👤"
        title={`${item.nombre} ${item.apellido}`}
        subtitle={`${item.tipo || 'Persona Natural'} • ${item.cedula || 'Sin cédula'}`}
        badge={item.telefono}
      >
        <Text style={[styles.clientInfo, { color: colors.textSecondary }]}>{item.email || 'Sin email'} · {item.direccion || 'Sin dirección'}</Text>
      </Card>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header
        title="Clientes"
        subtitle={`${clients.length} registrados`}
        onBack={() => navigation.goBack()}
        rightAction={() => { resetForm(); setModalVisible(true); }}
        rightIcon="+"
      />

      <View style={[styles.searchContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Buscar por nombre, cédula o teléfono..."
          placeholderTextColor={colors.disabled}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <FlatList
        data={filteredClients}
        renderItem={renderClient}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Card>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {search ? 'No se encontraron clientes' : 'No hay clientes registrados. Presione + para agregar.'}
            </Text>
          </Card>
        }
      />

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.primary }]}>
              {editingClient ? 'Editar Cliente' : 'Nuevo Cliente'}
            </Text>
            <FlatList
              data={[
                { key: 'nombre', placeholder: 'Nombre *' },
                { key: 'apellido', placeholder: 'Apellido *' },
                { key: 'cedula', placeholder: 'Cédula' },
                { key: 'telefono', placeholder: 'Teléfono' },
                { key: 'email', placeholder: 'Email' },
                { key: 'direccion', placeholder: 'Dirección' },
                { key: 'ruc', placeholder: 'RUC' },
                { key: 'notas', placeholder: 'Notas' },
              ]}
              renderItem={({ item }) => (
                <TextInput
                  style={[styles.modalInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                  placeholder={item.placeholder}
                  placeholderTextColor={colors.disabled}
                  value={form[item.key]}
                  onChangeText={(v) => setForm({ ...form, [item.key]: v })}
                />
              )}
              keyExtractor={(item) => item.key}
              style={{ maxHeight: 350 }}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.cancelButton, { borderColor: colors.border }]}
                onPress={() => { setModalVisible(false); resetForm(); }}
              >
                <Text style={[styles.cancelText, { color: colors.textSecondary }]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.saveButton, { backgroundColor: colors.primary }]} onPress={handleSave}>
                <Text style={[styles.saveText, { color: colors.textLight }]}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: SIZES.padding,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 45,
    borderWidth: 1,
  },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, fontSize: SIZES.md },
  list: { paddingHorizontal: SIZES.padding, paddingBottom: 20 },
  clientInfo: { fontSize: SIZES.xs, marginTop: 2 },
  emptyText: { textAlign: 'center', padding: 20 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 25,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: SIZES.xxl,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  modalInput: {
    borderRadius: 10,
    paddingHorizontal: 15,
    height: 45,
    marginBottom: 10,
    fontSize: SIZES.md,
    borderWidth: 1,
  },
  modalButtons: {
    flexDirection: 'row',
    marginTop: 15,
    gap: 10,
  },
  cancelButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelText: { fontSize: SIZES.md, fontWeight: '600' },
  saveButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveText: { fontSize: SIZES.md, fontWeight: '600' },
});

export default ClientsScreen;
