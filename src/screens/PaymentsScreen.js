import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, Alert, Modal, ScrollView,
} from 'react-native';
import { onAuthChange } from '../../firebase/auth';
import { createDocument, updateDocument, subscribeToCollection } from '../services/firestoreService';
import { sendInvoiceNotification, sendPaymentReminder, sendWhatsAppMessage } from '../services/whatsapp';
import { generateInvoicePDF, sharePDF } from '../services/pdfGenerator';
import Card from '../components/Card';
import Header from '../components/Header';
import { SIZES } from '../utils/theme';
import { useTheme } from '../context/ThemeContext';
import { formatCurrency, formatDate } from '../utils/helpers';
import { METODOS_PAGO } from '../utils/constants';

const PaymentsScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const [user, setUser] = useState(null);
  const [payments, setPayments] = useState([]);
  const [clients, setClients] = useState([]);
  const [activeTab, setActiveTab] = useState('cobros');
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState({
    clienteId: '', clienteNombre: '', clienteTelefono: '',
    tipo: 'honorarios', monto: '', descripcion: '', metodoPago: 'Transferencia Bancaria',
    fechaVencimiento: '', estado: 'pendiente', numeroFactura: '',
  });

  useEffect(() => {
    const unsubAuth = onAuthChange((currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const unsubPay = subscribeToCollection('cobros', (data) => {
          setPayments(data);
        }, [{ field: 'abogadoId', operator: '==', value: currentUser.uid }]);
        const unsubCli = subscribeToCollection('clientes', (data) => setClients(data));
        return () => { unsubPay(); unsubCli(); };
      }
    });
    return unsubAuth;
  }, []);

  const totalPendiente = payments
    .filter((p) => p.estado === 'pendiente' || p.estado === 'vencido')
    .reduce((s, p) => s + (parseFloat(p.monto) || 0), 0);

  const totalCobrado = payments
    .filter((p) => p.estado === 'pagado')
    .reduce((s, p) => s + (parseFloat(p.monto) || 0), 0);

  const resetForm = () => {
    setForm({
      clienteId: '', clienteNombre: '', clienteTelefono: '',
      tipo: 'honorarios', monto: '', descripcion: '', metodoPago: 'Transferencia Bancaria',
      fechaVencimiento: '', estado: 'pendiente', numeroFactura: `FAC-${Date.now().toString(36).toUpperCase()}`,
    });
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
    if (!form.clienteNombre || !form.monto) {
      Alert.alert('Error', 'Cliente y monto son obligatorios');
      return;
    }
    const data = { ...form, monto: parseFloat(form.monto), abogadoId: user.uid };
    const result = await createDocument('cobros', data);
    if (result.success) {
      if (form.clienteTelefono) {
        sendInvoiceNotification(form.clienteTelefono, form.clienteNombre, form.numeroFactura, form.monto);
      }
      Alert.alert('Éxito', 'Cobro registrado correctamente');
    }
    setModalVisible(false);
    resetForm();
  };

  const markAsPaid = async (payment) => {
    await updateDocument('cobros', payment.id, { estado: 'pagado' });
    if (payment.clienteTelefono) {
      sendWhatsAppMessage(payment.clienteTelefono,
        `✅ *Pago Confirmado*\n\nSu pago de B/. ${payment.monto} ha sido procesado. Gracias.`);
    }
  };

  const generatePDF = async (payment) => {
    const result = await generateInvoicePDF(payment);
    if (result.success) {
      await sharePDF(result.uri, `Factura_${payment.numeroFactura}`);
    }
  };

  const filteredPayments = payments.filter((p) => {
    if (activeTab === 'cobros') return true;
    return p.estado === activeTab;
  });

  const renderItem = ({ item }) => (
    <TouchableOpacity onPress={() => generatePDF(item)}>
      <Card
        icon={item.estado === 'pagado' ? '✅' : '⏳'}
        title={`${item.numeroFactura || 'N/A'}`}
        subtitle={item.clienteNombre}
        badge={item.estado}
      >
        <Text style={[styles.payInfo, { color: colors.textSecondary }]}>
          {formatCurrency(item.monto)} · {item.descripcion || 'Sin descripción'}
        </Text>
        {item.estado !== 'pagado' && (
          <View style={styles.payActions}>
            <TouchableOpacity style={[styles.payBtn, { backgroundColor: colors.success + '15' }]} onPress={() => markAsPaid(item)}>
              <Text style={[styles.payBtnText, { color: colors.success }]}>✅ Marcar Pagado</Text>
            </TouchableOpacity>
            {item.clienteTelefono && (
              <TouchableOpacity style={[styles.remindBtn, { backgroundColor: colors.warning + '15' }]} onPress={() =>
                sendPaymentReminder(item.clienteTelefono, item.clienteNombre, item.monto, item.fechaVencimiento)}>
                <Text style={[styles.remindText, { color: colors.warning }]}>🔔 Recordar</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </Card>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header title="Cobros y Facturación" subtitle={`Pendiente: ${formatCurrency(totalPendiente)}`}
        onBack={() => navigation.goBack()}
        rightAction={() => { resetForm(); setModalVisible(true); }} rightIcon="+" />

      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, { backgroundColor: colors.surface, shadowColor: colors.cardShadow }]}>
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Pendiente</Text>
          <Text style={[styles.summaryValue, { color: colors.error }]}>{formatCurrency(totalPendiente)}</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: colors.surface, shadowColor: colors.cardShadow }]}>
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Cobrado</Text>
          <Text style={[styles.summaryValue, { color: colors.success }]}>{formatCurrency(totalCobrado)}</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: colors.surface, shadowColor: colors.cardShadow }]}>
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Total</Text>
          <Text style={[styles.summaryValue, { color: colors.text }]}>{formatCurrency(totalPendiente + totalCobrado)}</Text>
        </View>
      </View>

      <View style={styles.tabRow}>
        {[
          { key: 'cobros', label: 'Todos' },
          { key: 'pendiente', label: 'Pendientes' },
          { key: 'pagado', label: 'Pagados' },
          { key: 'vencido', label: 'Vencidos' },
        ].map((tab) => (
          <TouchableOpacity key={tab.key} style={[styles.tab, { borderColor: colors.border }, activeTab === tab.key && { backgroundColor: colors.primary, borderColor: colors.primary }]}
            onPress={() => setActiveTab(tab.key)}>
            <Text style={[styles.tabText, { color: colors.textSecondary }, activeTab === tab.key && { color: colors.textLight }]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList data={filteredPayments} renderItem={renderItem} keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Card><Text style={[styles.emptyText, { color: colors.textSecondary }]}>Sin registros de cobros</Text></Card>} />

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <ScrollView style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.primary }]}>Nuevo Cobro</Text>
            <View>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Cliente:</Text>
              <FlatList data={clients} horizontal showsHorizontalScrollIndicator={false}
                renderItem={({ item }) => (
                  <TouchableOpacity style={[styles.clientChip, { borderColor: colors.border }, form.clienteId === item.id && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                    onPress={() => selectClient(item)}>
                    <Text style={[styles.clientChipText, { color: colors.text }, form.clienteId === item.id && { color: colors.textLight }]}>
                      {item.nombre} {item.apellido}
                    </Text>
                  </TouchableOpacity>
                )}
                keyExtractor={(item) => item.id} />
            </View>
            <TextInput style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]} placeholder="Cliente" value={form.clienteNombre}
              onChangeText={(v) => setForm({ ...form, clienteNombre: v })} />
            <TextInput style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]} placeholder="No. Factura" value={form.numeroFactura}
              onChangeText={(v) => setForm({ ...form, numeroFactura: v })} />
            <TextInput style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]} placeholder="Monto (B/.) *" value={form.monto}
              onChangeText={(v) => setForm({ ...form, monto: v })} keyboardType="decimal-pad" />
            <TextInput style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]} placeholder="Descripción"
              value={form.descripcion} onChangeText={(v) => setForm({ ...form, descripcion: v })} />
            <TextInput style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]} placeholder="Fecha de Vencimiento (DD/MM/AAAA)"
              value={form.fechaVencimiento} onChangeText={(v) => setForm({ ...form, fechaVencimiento: v })} />
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Método de Pago:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsContainer}>
              {METODOS_PAGO.map((m) => (
                <TouchableOpacity key={m} style={[styles.chip, { borderColor: colors.border }, form.metodoPago === m && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                  onPress={() => setForm({ ...form, metodoPago: m })}>
                  <Text style={[styles.chipText, { color: colors.text }, form.metodoPago === m && { color: colors.textLight }]}>{m}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.cancelBtn, { borderColor: colors.border }]}
                onPress={() => { setModalVisible(false); resetForm(); }}>
                <Text style={[styles.cancelText, { color: colors.textSecondary }]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.primary }]} onPress={handleSave}>
                <Text style={[styles.saveText, { color: colors.textLight }]}>Registrar Cobro</Text>
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
  summaryRow: { flexDirection: 'row', padding: SIZES.padding, paddingBottom: 0, gap: 8 },
  summaryCard: {
    flex: 1, borderRadius: 12,
    padding: 12, alignItems: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2, shadowRadius: 4, elevation: 2,
  },
  summaryLabel: { fontSize: SIZES.xs },
  summaryValue: { fontSize: SIZES.lg, fontWeight: 'bold', marginTop: 2 },
  tabRow: { flexDirection: 'row', paddingHorizontal: SIZES.padding, marginTop: 10, gap: 6 },
  tab: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 16,
    borderWidth: 1,
  },
  tabText: { fontSize: SIZES.xs },
  list: { padding: SIZES.padding },
  payInfo: { fontSize: SIZES.sm, marginTop: 4 },
  payActions: { flexDirection: 'row', marginTop: 8, gap: 8 },
  payBtn: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8,
  },
  payBtnText: { fontSize: SIZES.xs, fontWeight: '500' },
  remindBtn: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8,
  },
  remindText: { fontSize: SIZES.xs, fontWeight: '500' },
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
  clientChipText: { fontSize: SIZES.xs },
  input: {
    borderRadius: 10, paddingHorizontal: 15,
    height: 45, marginBottom: 10, fontSize: SIZES.md,
    borderWidth: 1,
  },
  chipsContainer: { marginBottom: 10 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 16,
    borderWidth: 1, marginRight: 6,
  },
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

export default PaymentsScreen;
