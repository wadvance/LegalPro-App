import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet,
  Alert, Modal, ScrollView,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { onAuthChange } from '../../firebase/auth';
import { createDocument, updateDocument, deleteDocument, subscribeToCollection } from '../services/firestoreService';
import { scheduleAppointmentReminder } from '../services/notifications';
import { sendAppointmentConfirmation, sendWhatsAppMessage } from '../services/whatsapp';
import Card from '../components/Card';
import Header from '../components/Header';
import { COLORS, SIZES } from '../utils/theme';
import { formatDateTime, getStatusColor, parseDate } from '../utils/helpers';
import { TIPOS_CITA } from '../utils/constants';

const AppointmentsScreen = ({ navigation }) => {
  const [user, setUser] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [clients, setClients] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingAppt, setEditingAppt] = useState(null);
  const [form, setForm] = useState({
    clienteId: '',
    clienteNombre: '',
    clienteTelefono: '',
    titulo: '',
    tipo: 'Consulta General',
    fecha: selectedDate,
    hora: '',
    duracion: '60',
    ubicacion: 'Oficina',
    notas: '',
    estado: 'pendiente',
  });

  useEffect(() => {
    const unsubAuth = onAuthChange((currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const unsubAppts = subscribeToCollection('citas', (data) => {
          setAppointments(data);
        }, [{ field: 'abogadoId', operator: '==', value: currentUser.uid }]);
        const unsubClients = subscribeToCollection('clientes', (data) => {
          setClients(data);
        });
        return () => { unsubAppts(); unsubClients(); };
      }
    });
    return unsubAuth;
  }, []);

  const markedDates = {};
  appointments.forEach((appt) => {
    const dateStr = appt.fecha ? parseDate(appt.fecha)?.toISOString().split('T')[0] : null;
    if (dateStr) {
      markedDates[dateStr] = {
        marked: true,
        dotColor: appt.estado === 'pendiente' ? COLORS.warning : COLORS.success,
      };
    }
  });
  markedDates[selectedDate] = { ...markedDates[selectedDate], selected: true, selectedColor: COLORS.primary };

  const dayAppointments = appointments.filter((a) => {
    const d = a.fecha ? parseDate(a.fecha)?.toISOString().split('T')[0] : null;
    return d === selectedDate;
  });

  const resetForm = () => {
    setForm({
      clienteId: '', clienteNombre: '', clienteTelefono: '', titulo: '',
      tipo: 'Consulta General', fecha: selectedDate, hora: '', duracion: '60',
      ubicacion: 'Oficina', notas: '', estado: 'pendiente',
    });
    setEditingAppt(null);
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
    if (!form.clienteNombre || !form.hora) {
      Alert.alert('Error', 'Cliente y hora son obligatorios');
      return;
    }
    const apptData = {
      ...form,
      fecha: new Date(form.fecha + 'T' + form.hora + ':00'),
      abogadoId: user.uid,
    };

    if (editingAppt) {
      await updateDocument('citas', editingAppt.id, apptData);
    } else {
      const result = await createDocument('citas', apptData);
      if (result.success) {
        const createdAppt = { id: result.id, ...apptData };
        scheduleAppointmentReminder(createdAppt);
        if (form.clienteTelefono) {
          const dateStr = parseDate(apptData.fecha)?.toLocaleDateString('es-PA') || '';
          sendAppointmentConfirmation(form.clienteTelefono, form.clienteNombre, dateStr, form.hora);
        }
      }
    }
    setModalVisible(false);
    resetForm();
  };

  const updateStatus = async (appt, newStatus) => {
    await updateDocument('citas', appt.id, { estado: newStatus });
    if (newStatus === 'completado' && appt.clienteTelefono) {
      sendWhatsAppMessage(appt.clienteTelefono,
        `✅ *Cita Completada*\n\nSu cita con Arauz Carrillo Abogados ha sido registrada como completada. Gracias por su visita.`);
    }
  };

  const renderAppointment = ({ item }) => (
    <TouchableOpacity onPress={() => {
      setEditingAppt(item);
      setForm({
        clienteId: item.clienteId,
        clienteNombre: item.clienteNombre,
        clienteTelefono: item.clienteTelefono || '',
        titulo: item.titulo || '',
        tipo: item.tipo || 'Consulta General',
        fecha: item.fecha ? parseDate(item.fecha)?.toISOString().split('T')[0] || selectedDate : selectedDate,
        hora: item.hora,
        duracion: item.duracion || '60',
        ubicacion: item.ubicacion || 'Oficina',
        notas: item.notas || '',
        estado: item.estado,
      });
      setModalVisible(true);
    }}>
      <Card
        icon="📅"
        title={`${item.hora} - ${item.clienteNombre}`}
        subtitle={item.tipo}
        badge={item.estado}
      >
        <Text style={styles.apptDetail}>{item.titulo || item.notas || 'Sin descripción'}</Text>
        <View style={styles.statusRow}>
          {['pendiente', 'completado', 'cancelado'].map((s) => (
            <TouchableOpacity
              key={s}
              style={[styles.statusBtn, item.estado === s && { backgroundColor: getStatusColor(s) + '20' }]}
              onPress={() => updateStatus(item, s)}
            >
              <Text style={[styles.statusText, { color: getStatusColor(s) }]}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Card>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Header
        title="Citas y Agenda"
        subtitle={selectedDate}
        onBack={() => navigation.goBack()}
        rightAction={() => { resetForm(); setModalVisible(true); }}
        rightIcon="+"
      />

      <Calendar
        markedDates={markedDates}
        onDayPress={(day) => setSelectedDate(day.dateString)}
        theme={{
          todayColor: COLORS.primaryLight,
          selectedDayBackgroundColor: COLORS.primary,
          arrowColor: COLORS.primary,
          todayTextColor: COLORS.primary,
        }}
        locale="es"
      />

      <Text style={styles.citaCount}>
        {dayAppointments.length} cita(s) para este día
      </Text>

      <FlatList
        data={dayAppointments}
        renderItem={renderAppointment}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Card><Text style={styles.emptyText}>No hay citas para esta fecha</Text></Card>
        }
      />

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingAppt ? 'Editar Cita' : 'Nueva Cita'}
            </Text>

            {!editingAppt && (
              <View style={styles.clientSelector}>
                <Text style={styles.fieldLabel}>Seleccionar Cliente:</Text>
                <FlatList
                  data={clients}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[styles.clientChip, form.clienteId === item.id && styles.clientChipActive]}
                      onPress={() => selectClient(item)}
                    >
                      <Text style={[styles.clientChipText, form.clienteId === item.id && { color: COLORS.textLight }]}>
                        {item.nombre} {item.apellido}
                      </Text>
                    </TouchableOpacity>
                  )}
                  keyExtractor={(item) => item.id}
                />
              </View>
            )}

            <TextInput style={styles.input} placeholder="Cliente *" value={form.clienteNombre}
              onChangeText={(v) => setForm({ ...form, clienteNombre: v })} />
            <TextInput style={styles.input} placeholder="Teléfono" value={form.clienteTelefono}
              onChangeText={(v) => setForm({ ...form, clienteTelefono: v })} keyboardType="phone-pad" />
            <TextInput style={styles.input} placeholder="Título / Motivo"
              value={form.titulo} onChangeText={(v) => setForm({ ...form, titulo: v })} />

            <Text style={styles.fieldLabel}>Tipo de Cita:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsContainer}>
              {TIPOS_CITA.map((t) => (
                <TouchableOpacity key={t} style={[styles.chip, form.tipo === t && styles.chipActive]}
                  onPress={() => setForm({ ...form, tipo: t })}>
                  <Text style={[styles.chipText, form.tipo === t && { color: COLORS.textLight }]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.row}>
              <TextInput style={[styles.input, { flex: 1, marginRight: 8 }]} placeholder="Hora (HH:MM)"
                value={form.hora} onChangeText={(v) => setForm({ ...form, hora: v })} />
              <TextInput style={[styles.input, { flex: 1, marginLeft: 8 }]} placeholder="Duración (min)"
                value={form.duracion} onChangeText={(v) => setForm({ ...form, duracion: v })} keyboardType="numeric" />
            </View>

            <TextInput style={styles.input} placeholder="Ubicación"
              value={form.ubicacion} onChangeText={(v) => setForm({ ...form, ubicacion: v })} />
            <TextInput style={[styles.input, styles.textArea]} placeholder="Notas adicionales"
              value={form.notas} onChangeText={(v) => setForm({ ...form, notas: v })} multiline />

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
  list: { padding: SIZES.padding },
  citaCount: {
    fontSize: SIZES.sm,
    color: COLORS.textSecondary,
    paddingHorizontal: SIZES.padding,
    paddingTop: 10,
    fontWeight: '500',
  },
  apptDetail: { fontSize: SIZES.sm, color: COLORS.textSecondary, marginTop: 4 },
  statusRow: { flexDirection: 'row', marginTop: 8, gap: 6 },
  statusBtn: {
    paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12,
    borderWidth: 1, borderColor: COLORS.border,
  },
  statusText: { fontSize: SIZES.xs, fontWeight: '500' },
  emptyText: { textAlign: 'center', color: COLORS.textSecondary, padding: 20 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: COLORS.surface, borderTopLeftRadius: 30, borderTopRightRadius: 30,
    padding: 25, maxHeight: '85%',
  },
  modalTitle: { fontSize: SIZES.xxl, fontWeight: 'bold', color: COLORS.primary, marginBottom: 15, textAlign: 'center' },
  fieldLabel: { fontSize: SIZES.sm, color: COLORS.textSecondary, marginBottom: 5, marginTop: 5, fontWeight: '500' },
  clientSelector: { marginBottom: 10 },
  clientChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1, borderColor: COLORS.border, marginRight: 8,
  },
  clientChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  clientChipText: { fontSize: SIZES.xs, color: COLORS.text },
  input: {
    backgroundColor: COLORS.background, borderRadius: 10, paddingHorizontal: 15,
    height: 45, marginBottom: 10, fontSize: SIZES.md, color: COLORS.text,
    borderWidth: 1, borderColor: COLORS.border,
  },
  textArea: { height: 70, paddingTop: 12 },
  chipsContainer: { marginBottom: 10 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 16,
    borderWidth: 1, borderColor: COLORS.border, marginRight: 6,
  },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontSize: SIZES.xs, color: COLORS.text },
  row: { flexDirection: 'row' },
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

export default AppointmentsScreen;
