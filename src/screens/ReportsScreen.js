import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { BarChart, PieChart, LineChart } from 'react-native-chart-kit';
import { onAuthChange } from '../../firebase/auth';
import { subscribeToCollection } from '../services/firestoreService';
import { generatePDF, sharePDF } from '../services/pdfGenerator';
import Card from '../components/Card';
import Header from '../components/Header';
import Loading from '../components/Loading';
import { COLORS, SIZES } from '../utils/theme';
import { formatCurrency, parseDate } from '../utils/helpers';

const screenWidth = Dimensions.get('window').width - 32;

const ReportsScreen = ({ navigation }) => {
  const [user, setUser] = useState(null);
  const [expedientes, setExpedientes] = useState([]);
  const [cobros, setCobros] = useState([]);
  const [citas, setCitas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubAuth = onAuthChange((currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const unsub1 = subscribeToCollection('expedientes', (data) => setExpedientes(data),
          [{ field: 'abogadoId', operator: '==', value: currentUser.uid }]);
        const unsub2 = subscribeToCollection('cobros', (data) => setCobros(data),
          [{ field: 'abogadoId', operator: '==', value: currentUser.uid }]);
        const unsub3 = subscribeToCollection('citas', (data) => setCitas(data),
          [{ field: 'abogadoId', operator: '==', value: currentUser.uid }]);
        setLoading(false);
        return () => { unsub1(); unsub2(); unsub3(); };
      }
    });
    return unsubAuth;
  }, []);

  if (loading) return <Loading message="Generando reportes..." />;

  const tiposCount = {};
  expedientes.forEach((e) => { tiposCount[e.tipo] = (tiposCount[e.tipo] || 0) + 1; });

  const estadosCount = {};
  expedientes.forEach((e) => { estadosCount[e.estado] = (estadosCount[e.estado] || 0) + 1; });

  const cobrosPorMes = {};
  cobros.filter((c) => c.estado === 'pagado').forEach((c) => {
    const fecha = parseDate(c.fecha) || new Date();
    const mes = `${fecha.getMonth() + 1}/${fecha.getFullYear()}`;
    cobrosPorMes[mes] = (cobrosPorMes[mes] || 0) + (parseFloat(c.monto) || 0);
  });

  const meses = Object.keys(cobrosPorMes).slice(-6);
  const montosMensuales = meses.map((m) => cobrosPorMes[m]);

  const expedientesPorTipo = Object.entries(tiposCount).slice(0, 7);
  const pieData = expedientesPorTipo.map(([name, count], i) => ({
    name: name.length > 10 ? name.substring(0, 10) + '...' : name,
    count,
    color: ['#1A237E', '#C5A028', '#388E3C', '#D32F2F', '#F57C00', '#1976D2', '#7B1FA2'][i % 7],
    legendFontColor: COLORS.text,
    legendFontSize: 11,
  }));

  const generarReportePDF = async () => {
    const expedientesHTML = expedientes.map((e) =>
      `<tr><td>${e.numero}</td><td>${e.clienteNombre}</td><td>${e.tipo}</td><td><span class="status-badge status-${(e.estado || '').toLowerCase()}">${e.estado}</span></td></tr>`
    ).join('');

    const cobrosHTML = cobros.map((c) =>
      `<tr><td>${c.numeroFactura || 'N/A'}</td><td>${c.clienteNombre}</td><td>B/. ${c.monto}</td><td><span class="status-badge status-${(c.estado || '').toLowerCase()}">${c.estado}</span></td></tr>`
    ).join('');

    const content = `
<h3 style="color:#1A237E;">Resumen General</h3>
<div class="info-grid">
  <div class="info-item"><label>Total Expedientes</label><div class="value">${expedientes.length}</div></div>
  <div class="info-item"><label>Total Cobros</label><div class="value">B/. ${formatCurrency(cobros.reduce((s, c) => s + (parseFloat(c.monto) || 0), 0))}</div></div>
  <div class="info-item"><label>Total Citas</label><div class="value">${citas.length}</div></div>
  <div class="info-item"><label>Activos</label><div class="value">${expedientes.filter((e) => e.estado === 'Activo').length}</div></div>
</div>

<h3 style="color:#1A237E;margin-top:20px;">Expedientes</h3>
<table><tr><th>Número</th><th>Cliente</th><th>Tipo</th><th>Estado</th></tr>${expedientesHTML}</table>

<h3 style="color:#1A237E;margin-top:20px;">Cobros</h3>
<table><tr><th>Factura</th><th>Cliente</th><th>Monto</th><th>Estado</th></tr>${cobrosHTML}</table>`;

    const result = await generatePDF('Reporte General', content);
    if (result.success) {
      await sharePDF(result.uri, `Reporte_General_${Date.now()}`);
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Reportes y Estadísticas" onBack={() => navigation.goBack()}
        rightAction={generarReportePDF} rightIcon="📄" />

      <ScrollView contentContainerStyle={styles.content}>

        <Card title="Expedientes por Tipo">
          {pieData.length > 0 ? (
            <PieChart
              data={pieData}
              width={screenWidth - 32}
              height={180}
              chartConfig={{
                color: () => COLORS.text,
                backgroundGradientFrom: COLORS.surface,
                backgroundGradientTo: COLORS.surface,
              }}
              accessor="count"
              backgroundColor="transparent"
              paddingLeft="15"
              absolute
            />
          ) : (
            <Text style={styles.noData}>Sin datos disponibles</Text>
          )}
        </Card>

        <Card title="Estado de Expedientes">
          {Object.keys(estadosCount).length > 0 ? (
            <BarChart
              data={{
                labels: Object.keys(estadosCount).map((e) => e.substring(0, 5)),
                datasets: [{ data: Object.values(estadosCount) }],
              }}
              width={screenWidth - 32}
              height={180}
              chartConfig={{
                backgroundColor: COLORS.surface,
                backgroundGradientFrom: COLORS.surface,
                backgroundGradientTo: COLORS.surface,
                decimalPlaces: 0,
                color: () => COLORS.primary,
                labelColor: () => COLORS.textSecondary,
                barPercentage: 0.6,
              }}
              yAxisLabel=""
              yAxisSuffix=""
            />
          ) : (
            <Text style={styles.noData}>Sin datos disponibles</Text>
          )}
        </Card>

        {montosMensuales.length > 0 && (
          <Card title="Cobros Mensuales">
            <LineChart
              data={{
                labels: meses.map((m) => m.split('/')[0]),
                datasets: [{ data: montosMensuales }],
              }}
              width={screenWidth - 32}
              height={180}
              chartConfig={{
                backgroundColor: COLORS.surface,
                backgroundGradientFrom: COLORS.surface,
                backgroundGradientTo: COLORS.surface,
                decimalPlaces: 0,
                color: () => COLORS.success,
                labelColor: () => COLORS.textSecondary,
              }}
              bezier
            />
          </Card>
        )}

        <View style={styles.statsGrid}>
          <Card style={styles.statItem}>
            <Text style={styles.statIcon}>📁</Text>
            <Text style={styles.statNumber}>{expedientes.length}</Text>
            <Text style={styles.statLabel}>Total Expedientes</Text>
          </Card>
          <Card style={styles.statItem}>
            <Text style={styles.statIcon}>⚖️</Text>
            <Text style={styles.statNumber}>{expedientes.filter((e) => e.estado === 'Activo').length}</Text>
            <Text style={styles.statLabel}>Activos</Text>
          </Card>
          <Card style={styles.statItem}>
            <Text style={styles.statIcon}>💰</Text>
            <Text style={styles.statNumber}>{formatCurrency(cobros.reduce((s, c) => s + (parseFloat(c.monto) || 0), 0))}</Text>
            <Text style={styles.statLabel}>Total Cobrado</Text>
          </Card>
          <Card style={styles.statItem}>
            <Text style={styles.statIcon}>📅</Text>
            <Text style={styles.statNumber}>{citas.length}</Text>
            <Text style={styles.statLabel}>Total Citas</Text>
          </Card>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SIZES.padding, paddingBottom: 40 },
  noData: { textAlign: 'center', color: COLORS.disabled, padding: 20, fontSize: SIZES.sm },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: 8 },
  statItem: { width: '48%', alignItems: 'center', paddingVertical: 16 },
  statIcon: { fontSize: 28 },
  statNumber: { fontSize: SIZES.xxl, fontWeight: 'bold', color: COLORS.primary, marginTop: 5 },
  statLabel: { fontSize: SIZES.xs, color: COLORS.textSecondary, marginTop: 2 },
});

export default ReportsScreen;
