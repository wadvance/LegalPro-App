import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert,
} from 'react-native';
import Card from '../components/Card';
import Header from '../components/Header';
import Loading from '../components/Loading';
import { SIZES } from '../utils/theme';
import { useTheme } from '../context/ThemeContext';
import { formatCurrency } from '../utils/helpers';
import {
  calcularPrestacionesLaborales,
  calcularInteresesMoratorios,
  calcularTasasRegistralesANATI,
  calcularHonorariosAbogado,
  calcularFechasProcesales,
} from '../utils/calculators';

const CALCULATOR_TABS = [
  { key: 'laboral', label: 'Laboral', icon: '👷' },
  { key: 'intereses', label: 'Intereses', icon: '💰' },
  { key: 'anati', label: 'ANATI', icon: '🏠' },
  { key: 'honorarios', label: 'Honorarios', icon: '⚖️' },
  { key: 'procesal', label: 'Procesal', icon: '📅' },
];

const LegalCalculatorsScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState('laboral');
  const [results, setResults] = useState(null);

  const [laboralForm, setLaboralForm] = useState({
    salarioMensual: '', fechaIngreso: '', fechaSalida: '',
    tipoContrato: 'indefinido', causaTerminacion: 'renuncia',
  });

  const [interesesForm, setInteresesForm] = useState({
    monto: '', tasaAnual: '6', fechaInicio: '', fechaFin: '', tipoTasa: 'legal',
  });

  const [anatiForm, setAnatiForm] = useState({
    valorInmueble: '', tipoOperacion: 'compraventa',
    tipoInmueble: 'urbano', tieneHipoteca: false, valorHipoteca: '',
  });

  const [honorariosForm, setHonorariosForm] = useState({
    tipoCaso: 'civil_mayor', cuantia: '', complejidad: 'media',
    tipoHonorario: 'tarifa_fija', porcentajeContingencia: '30',
    tarifaHora: '150', horasEstimadas: '0',
  });

  const [procesalForm, setProcesalForm] = useState({
    fechaInicio: '', tipoPlazo: 'dias_habiles', diasHabiles: '',
  });

  const handleCalculateLaboral = () => {
    if (!laboralForm.salarioMensual || !laboralForm.fechaIngreso) {
      Alert.alert('Error', 'Salario mensual y fecha de ingreso requeridos');
      return;
    }
    const result = calcularPrestacionesLaborales({
      salarioMensual: parseFloat(laboralForm.salarioMensual),
      fechaIngreso: laboralForm.fechaIngreso,
      fechaSalida: laboralForm.fechaSalida || new Date().toISOString().split('T')[0],
      tipoContrato: laboralForm.tipoContrato,
      causaTerminacion: laboralForm.causaTerminacion,
    });
    setResults({ type: 'laboral', data: result });
  };

  const handleCalculateIntereses = () => {
    if (!interesesForm.monto || !interesesForm.fechaInicio) {
      Alert.alert('Error', 'Monto y fecha de inicio requeridos');
      return;
    }
    const result = calcularInteresesMoratorios({
      monto: parseFloat(interesesForm.monto),
      tasaAnual: parseFloat(interesesForm.tasaAnual),
      fechaInicio: interesesForm.fechaInicio,
      fechaFin: interesesForm.fechaFin || null,
      tipoTasa: interesesForm.tipoTasa,
    });
    setResults({ type: 'intereses', data: result });
  };

  const handleCalculateANATI = () => {
    if (!anatiForm.valorInmueble) {
      Alert.alert('Error', 'Valor del inmueble requerido');
      return;
    }
    const result = calcularTasasRegistralesANATI({
      valorInmueble: parseFloat(anatiForm.valorInmueble),
      tipoOperacion: anatiForm.tipoOperacion,
      tipoInmueble: anatiForm.tipoInmueble,
      tieneHipoteca: anatiForm.tieneHipoteca,
      valorHipoteca: anatiForm.tieneHipoteca ? parseFloat(anatiForm.valorHipoteca || 0) : 0,
    });
    setResults({ type: 'anati', data: result });
  };

  const handleCalculateHonorarios = () => {
    const result = calcularHonorariosAbogado({
      tipoCaso: honorariosForm.tipoCaso,
      cuantia: parseFloat(honorariosForm.cuantia || 0),
      complejidad: honorariosForm.complejidad,
      tipoHonorario: honorariosForm.tipoHonorario,
      porcentajeContingencia: parseFloat(honorariosForm.porcentajeContingencia || 30),
      tarifaHora: parseFloat(honorariosForm.tarifaHora || 150),
      horasEstimadas: parseFloat(honorariosForm.horasEstimadas || 0),
    });
    setResults({ type: 'honorarios', data: result });
  };

  const handleCalculateProcesal = () => {
    if (!procesalForm.fechaInicio || !procesalForm.diasHabiles) {
      Alert.alert('Error', 'Fecha de inicio y días hábiles requeridos');
      return;
    }
    const result = calcularFechasProcesales({
      fechaInicio: procesalForm.fechaInicio,
      tipoPlazo: procesalForm.tipoPlazo,
      diasHabiles: parseInt(procesalForm.diasHabiles),
    });
    setResults({ type: 'procesal', data: result });
  };

  const renderLaboralForm = () => (
    <View>
      <TextInput style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]} placeholder="Salario Mensual (B/.) *" placeholderTextColor={colors.disabled} keyboardType="decimal-pad"
        value={laboralForm.salarioMensual} onChangeText={(v) => setLaboralForm({ ...laboralForm, salarioMensual: v })} />
      <TextInput style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]} placeholder="Fecha de Ingreso (YYYY-MM-DD) *" placeholderTextColor={colors.disabled}
        value={laboralForm.fechaIngreso} onChangeText={(v) => setLaboralForm({ ...laboralForm, fechaIngreso: v })} />
      <TextInput style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]} placeholder="Fecha de Salida (YYYY-MM-DD)" placeholderTextColor={colors.disabled}
        value={laboralForm.fechaSalida} onChangeText={(v) => setLaboralForm({ ...laboralForm, fechaSalida: v })} />
      <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Tipo de Contrato:</Text>
      <View style={styles.chipRow}>
        {['indefinido', 'determinado'].map((t) => (
          <TouchableOpacity key={t} style={[styles.chip, { borderColor: colors.border }, laboralForm.tipoContrato === t && { backgroundColor: colors.primary, borderColor: colors.primary }]}
            onPress={() => setLaboralForm({ ...laboralForm, tipoContrato: t })}>
            <Text style={[styles.chipText, { color: colors.text }, laboralForm.tipoContrato === t && { color: colors.textLight }]}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Causa de Terminación:</Text>
      <View style={styles.chipRow}>
        {['renuncia', 'despido_injustificado', 'despido_justificado', 'mutuo_acuerdo'].map((t) => (
          <TouchableOpacity key={t} style={[styles.chip, { borderColor: colors.border }, laboralForm.causaTerminacion === t && { backgroundColor: colors.primary, borderColor: colors.primary }]}
            onPress={() => setLaboralForm({ ...laboralForm, causaTerminacion: t })}>
            <Text style={[styles.chipText, { color: colors.text }, laboralForm.causaTerminacion === t && { color: colors.textLight }]}>
              {t.replace(/_/g, ' ')}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderInteresesForm = () => (
    <View>
      <TextInput style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]} placeholder="Monto (B/.) *" placeholderTextColor={colors.disabled} keyboardType="decimal-pad"
        value={interesesForm.monto} onChangeText={(v) => setInteresesForm({ ...interesesForm, monto: v })} />
      <TextInput style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]} placeholder="Tasa Anual (%)" placeholderTextColor={colors.disabled}
        value={interesesForm.tasaAnual} onChangeText={(v) => setInteresesForm({ ...interesesForm, tasaAnual: v })} keyboardType="decimal-pad" />
      <TextInput style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]} placeholder="Fecha de Inicio (YYYY-MM-DD) *" placeholderTextColor={colors.disabled}
        value={interesesForm.fechaInicio} onChangeText={(v) => setInteresesForm({ ...interesesForm, fechaInicio: v })} />
      <TextInput style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]} placeholder="Fecha de Fin (YYYY-MM-DD, opcional)" placeholderTextColor={colors.disabled}
        value={interesesForm.fechaFin} onChangeText={(v) => setInteresesForm({ ...interesesForm, fechaFin: v })} />
      <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Tipo de Tasa:</Text>
      <View style={styles.chipRow}>
        {['legal', 'convencional', 'mora_bancaria'].map((t) => (
          <TouchableOpacity key={t} style={[styles.chip, { borderColor: colors.border }, interesesForm.tipoTasa === t && { backgroundColor: colors.primary, borderColor: colors.primary }]}
            onPress={() => setInteresesForm({ ...interesesForm, tipoTasa: t })}>
            <Text style={[styles.chipText, { color: colors.text }, interesesForm.tipoTasa === t && { color: colors.textLight }]}>
              {t.replace(/_/g, ' ')}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderANATIForm = () => (
    <View>
      <TextInput style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]} placeholder="Valor del Inmueble (B/.) *" placeholderTextColor={colors.disabled} keyboardType="decimal-pad"
        value={anatiForm.valorInmueble} onChangeText={(v) => setAnatiForm({ ...anatiForm, valorInmueble: v })} />
      <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Tipo de Operación:</Text>
      <View style={styles.chipRow}>
        {['compraventa', 'transmision', 'donacion'].map((t) => (
          <TouchableOpacity key={t} style={[styles.chip, { borderColor: colors.border }, anatiForm.tipoOperacion === t && { backgroundColor: colors.primary, borderColor: colors.primary }]}
            onPress={() => setAnatiForm({ ...anatiForm, tipoOperacion: t })}>
            <Text style={[styles.chipText, { color: colors.text }, anatiForm.tipoOperacion === t && { color: colors.textLight }]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <TouchableOpacity style={styles.checkbox}
        onPress={() => setAnatiForm({ ...anatiForm, tieneHipoteca: !anatiForm.tieneHipoteca })}>
        <Text style={{ color: colors.text }}>{anatiForm.tieneHipoteca ? '☑' : '☐'} ¿Incluye Hipoteca?</Text>
      </TouchableOpacity>
      {anatiForm.tieneHipoteca && (
        <TextInput style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]} placeholder="Valor de la Hipoteca (B/.)" placeholderTextColor={colors.disabled} keyboardType="decimal-pad"
          value={anatiForm.valorHipoteca} onChangeText={(v) => setAnatiForm({ ...anatiForm, valorHipoteca: v })} />
      )}
    </View>
  );

  const renderHonorariosForm = () => (
    <View>
      <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Tipo de Honorario:</Text>
      <View style={styles.chipRow}>
        {['tarifa_fija', 'contingencia', 'tarifa_hora'].map((t) => (
          <TouchableOpacity key={t} style={[styles.chip, { borderColor: colors.border }, honorariosForm.tipoHonorario === t && { backgroundColor: colors.primary, borderColor: colors.primary }]}
            onPress={() => setHonorariosForm({ ...honorariosForm, tipoHonorario: t })}>
            <Text style={[styles.chipText, { color: colors.text }, honorariosForm.tipoHonorario === t && { color: colors.textLight }]}>
              {t.replace(/_/g, ' ')}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <TextInput style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]} placeholder="Cuantía (B/.)" placeholderTextColor={colors.disabled} keyboardType="decimal-pad"
        value={honorariosForm.cuantia} onChangeText={(v) => setHonorariosForm({ ...honorariosForm, cuantia: v })} />
      {honorariosForm.tipoHonorario === 'contingencia' && (
        <TextInput style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]} placeholder="% Contingencia" placeholderTextColor={colors.disabled} keyboardType="numeric"
          value={honorariosForm.porcentajeContingencia}
          onChangeText={(v) => setHonorariosForm({ ...honorariosForm, porcentajeContingencia: v })} />
      )}
      {honorariosForm.tipoHonorario === 'tarifa_hora' && (
        <>
          <TextInput style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]} placeholder="Tarifa por Hora (B/.)" placeholderTextColor={colors.disabled} keyboardType="numeric"
            value={honorariosForm.tarifaHora}
            onChangeText={(v) => setHonorariosForm({ ...honorariosForm, tarifaHora: v })} />
          <TextInput style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]} placeholder="Horas Estimadas" placeholderTextColor={colors.disabled} keyboardType="numeric"
            value={honorariosForm.horasEstimadas}
            onChangeText={(v) => setHonorariosForm({ ...honorariosForm, horasEstimadas: v })} />
        </>
      )}
      <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Complejidad:</Text>
      <View style={styles.chipRow}>
        {['baja', 'media', 'alta'].map((t) => (
          <TouchableOpacity key={t} style={[styles.chip, { borderColor: colors.border }, honorariosForm.complejidad === t && { backgroundColor: colors.primary, borderColor: colors.primary }]}
            onPress={() => setHonorariosForm({ ...honorariosForm, complejidad: t })}>
            <Text style={[styles.chipText, { color: colors.text }, honorariosForm.complejidad === t && { color: colors.textLight }]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderProcesalForm = () => (
    <View>
      <TextInput style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]} placeholder="Fecha de Inicio (YYYY-MM-DD) *" placeholderTextColor={colors.disabled}
        value={procesalForm.fechaInicio} onChangeText={(v) => setProcesalForm({ ...procesalForm, fechaInicio: v })} />
      <TextInput style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]} placeholder="Días Hábiles *" placeholderTextColor={colors.disabled} keyboardType="numeric"
        value={procesalForm.diasHabiles} onChangeText={(v) => setProcesalForm({ ...procesalForm, diasHabiles: v })} />
    </View>
  );

  const renderResults = () => {
    if (!results) return null;
    const { type, data } = results;

    const renderRow = (label, value) => (
      <View style={[styles.resultRow, { borderBottomColor: colors.border }]}>
        <Text style={[styles.resultLabel, { color: colors.textSecondary }]}>{label}</Text>
        <Text style={[styles.resultValue, { color: colors.text }]}>{value}</Text>
      </View>
    );

    if (type === 'laboral') {
      return (
        <Card title="Resultado de Prestaciones Laborales" icon="👷" titleColor={colors.primary}>
          {renderRow('Salario Mensual', formatCurrency(data.salarioMensual))}
          {renderRow('Años de Servicio', data.anosServicio)}
          {renderRow('Meses Trabajados', data.mesesServicio)}
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          {renderRow('Indemnización', formatCurrency(data.indemnizacion))}
          {renderRow('Prima de Antigüedad', formatCurrency(data.primaAntiguedad))}
          {renderRow('Vacaciones', formatCurrency(data.vacaciones))}
          {renderRow('Décimo Tercer Mes', formatCurrency(data.decimoTercerMes))}
          {renderRow('Preaviso', formatCurrency(data.preaviso))}
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          {renderRow('TOTAL', formatCurrency(data.total))}
        </Card>
      );
    }

    if (type === 'intereses') {
      return (
        <Card title="Cálculo de Intereses Moratorios" icon="💰" titleColor={colors.error}>
          {renderRow('Monto Original', formatCurrency(data.montoOriginal))}
          {renderRow('Tasa Anual', `${data.tasaAnual}%`)}
          {renderRow('Días Transcurridos', data.diasTranscurridos)}
          {renderRow('Intereses Generados', formatCurrency(data.interesesGenerados))}
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          {renderRow('Monto Total a Pagar', formatCurrency(data.montoTotal))}
        </Card>
      );
    }

    if (type === 'anati') {
      return (
        <Card title="Tasas Registrales ANATI" icon="🏠" titleColor={colors.primary}>
          <Text style={[styles.resultSubtitle, { color: colors.textSecondary }]}>Base Imponible: {formatCurrency(data.detalle.baseImponible)}</Text>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          {renderRow('Derecho de Registro (1%)', formatCurrency(data.derechoRegistro))}
          {renderRow('Impuesto de Transmisión', formatCurrency(data.impuestoTransmision))}
          {renderRow('Timbre de Registro', formatCurrency(data.timbreRegistro))}
          {renderRow('Inscripción Hipoteca', formatCurrency(data.inscripcionHipoteca))}
          {renderRow('Otros', formatCurrency(data.otros))}
          <View style={styles.divider} />
          {renderRow('TOTAL', formatCurrency(data.total))}
        </Card>
      );
    }

    if (type === 'honorarios') {
      return (
        <Card title="Honorarios del Abogado" icon="⚖️" titleColor={colors.primary}>
          {renderRow('Honorarios Base', formatCurrency(data.honorariosBase))}
          {renderRow('Factor Complejidad', data.factorComplejidad)}
          {renderRow('ITBM 7%', formatCurrency(data.itbm7))}
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          {renderRow('TOTAL', formatCurrency(data.total))}
        </Card>
      );
    }

    if (type === 'procesal') {
      return (
        <Card title="Fechas Procesales" icon="📅" titleColor={colors.primary}>
          {renderRow('Fecha de Inicio', data.fechaInicio)}
          {renderRow('Días Hábiles', data.diasHabiles)}
          {renderRow('Días Calendario', data.diasCalendario)}
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          {renderRow('Fecha de Vencimiento', data.fechaVencimiento)}
        </Card>
      );
    }

    return null;
  };

  const forms = {
    laboral: renderLaboralForm,
    intereses: renderInteresesForm,
    anati: renderANATIForm,
    honorarios: renderHonorariosForm,
    procesal: renderProcesalForm,
  };

  const calculate = {
    laboral: handleCalculateLaboral,
    intereses: handleCalculateIntereses,
    anati: handleCalculateANATI,
    honorarios: handleCalculateHonorarios,
    procesal: handleCalculateProcesal,
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header title="Calculadoras Legales" onBack={() => navigation.goBack()} />
      <View style={[styles.tabRow, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        {CALCULATOR_TABS.map((tab) => (
          <TouchableOpacity key={tab.key} style={[styles.tab, activeTab === tab.key && { backgroundColor: colors.primary + '15' }]}
            onPress={() => { setActiveTab(tab.key); setResults(null); }}>
            <Text style={styles.tabIcon}>{tab.icon}</Text>
            <Text style={[styles.tabLabel, { color: colors.textSecondary }, activeTab === tab.key && { color: colors.primary, fontWeight: '600' }]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.formContainer} keyboardShouldPersistTaps="handled">
        <Card title={`${CALCULATOR_TABS.find((t) => t.key === activeTab)?.label}`} icon={CALCULATOR_TABS.find((t) => t.key === activeTab)?.icon}>
          {forms[activeTab]()}
          <TouchableOpacity style={[styles.calcBtn, { backgroundColor: colors.primary }]} onPress={calculate[activeTab]}>
            <Text style={[styles.calcBtnText, { color: colors.textLight }]}>Calcular</Text>
          </TouchableOpacity>
        </Card>

        {renderResults()}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  tabRow: {
    flexDirection: 'row',
    paddingVertical: 8, paddingHorizontal: 8,
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1, alignItems: 'center', paddingVertical: 8,
    borderRadius: 10,
  },
  tabIcon: { fontSize: 20 },
  tabLabel: { fontSize: SIZES.xs, marginTop: 2 },
  formContainer: { padding: SIZES.padding, paddingBottom: 40 },
  input: {
    borderRadius: 10, paddingHorizontal: 15,
    height: 45, marginBottom: 10, fontSize: SIZES.md,
    borderWidth: 1,
  },
  fieldLabel: { fontSize: SIZES.sm, marginBottom: 6, marginTop: 4, fontWeight: '500' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10, gap: 6 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 16,
    borderWidth: 1,
  },
  chipText: { fontSize: SIZES.xs },
  checkbox: { paddingVertical: 8, fontSize: SIZES.md },
  calcBtn: {
    borderRadius: 12, height: 48,
    justifyContent: 'center', alignItems: 'center', marginTop: 10,
  },
  calcBtnText: { fontSize: SIZES.md, fontWeight: '600' },
  divider: { height: 1, marginVertical: 8 },
  resultRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 6,
  },
  resultLabel: { fontSize: SIZES.sm },
  resultValue: { fontSize: SIZES.sm, fontWeight: '600' },
  resultSubtitle: { fontSize: SIZES.sm, textAlign: 'center', marginBottom: 4 },
});

export default LegalCalculatorsScreen;
