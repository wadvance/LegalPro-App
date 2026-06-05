import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert,
} from 'react-native';
import Card from '../components/Card';
import Header from '../components/Header';
import Loading from '../components/Loading';
import { COLORS, SIZES } from '../utils/theme';
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
      <TextInput style={styles.input} placeholder="Salario Mensual (B/.) *" keyboardType="decimal-pad"
        value={laboralForm.salarioMensual} onChangeText={(v) => setLaboralForm({ ...laboralForm, salarioMensual: v })} />
      <TextInput style={styles.input} placeholder="Fecha de Ingreso (YYYY-MM-DD) *"
        value={laboralForm.fechaIngreso} onChangeText={(v) => setLaboralForm({ ...laboralForm, fechaIngreso: v })} />
      <TextInput style={styles.input} placeholder="Fecha de Salida (YYYY-MM-DD)"
        value={laboralForm.fechaSalida} onChangeText={(v) => setLaboralForm({ ...laboralForm, fechaSalida: v })} />
      <Text style={styles.fieldLabel}>Tipo de Contrato:</Text>
      <View style={styles.chipRow}>
        {['indefinido', 'determinado'].map((t) => (
          <TouchableOpacity key={t} style={[styles.chip, laboralForm.tipoContrato === t && styles.chipActive]}
            onPress={() => setLaboralForm({ ...laboralForm, tipoContrato: t })}>
            <Text style={[styles.chipText, laboralForm.tipoContrato === t && { color: COLORS.textLight }]}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={styles.fieldLabel}>Causa de Terminación:</Text>
      <View style={styles.chipRow}>
        {['renuncia', 'despido_injustificado', 'despido_justificado', 'mutuo_acuerdo'].map((t) => (
          <TouchableOpacity key={t} style={[styles.chip, laboralForm.causaTerminacion === t && styles.chipActive]}
            onPress={() => setLaboralForm({ ...laboralForm, causaTerminacion: t })}>
            <Text style={[styles.chipText, laboralForm.causaTerminacion === t && { color: COLORS.textLight }]}>
              {t.replace(/_/g, ' ')}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderInteresesForm = () => (
    <View>
      <TextInput style={styles.input} placeholder="Monto (B/.) *" keyboardType="decimal-pad"
        value={interesesForm.monto} onChangeText={(v) => setInteresesForm({ ...interesesForm, monto: v })} />
      <TextInput style={styles.input} placeholder="Tasa Anual (%)"
        value={interesesForm.tasaAnual} onChangeText={(v) => setInteresesForm({ ...interesesForm, tasaAnual: v })} keyboardType="decimal-pad" />
      <TextInput style={styles.input} placeholder="Fecha de Inicio (YYYY-MM-DD) *"
        value={interesesForm.fechaInicio} onChangeText={(v) => setInteresesForm({ ...interesesForm, fechaInicio: v })} />
      <TextInput style={styles.input} placeholder="Fecha de Fin (YYYY-MM-DD, opcional)"
        value={interesesForm.fechaFin} onChangeText={(v) => setInteresesForm({ ...interesesForm, fechaFin: v })} />
      <Text style={styles.fieldLabel}>Tipo de Tasa:</Text>
      <View style={styles.chipRow}>
        {['legal', 'convencional', 'mora_bancaria'].map((t) => (
          <TouchableOpacity key={t} style={[styles.chip, interesesForm.tipoTasa === t && styles.chipActive]}
            onPress={() => setInteresesForm({ ...interesesForm, tipoTasa: t })}>
            <Text style={[styles.chipText, interesesForm.tipoTasa === t && { color: COLORS.textLight }]}>
              {t.replace(/_/g, ' ')}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderANATIForm = () => (
    <View>
      <TextInput style={styles.input} placeholder="Valor del Inmueble (B/.) *" keyboardType="decimal-pad"
        value={anatiForm.valorInmueble} onChangeText={(v) => setAnatiForm({ ...anatiForm, valorInmueble: v })} />
      <Text style={styles.fieldLabel}>Tipo de Operación:</Text>
      <View style={styles.chipRow}>
        {['compraventa', 'transmision', 'donacion'].map((t) => (
          <TouchableOpacity key={t} style={[styles.chip, anatiForm.tipoOperacion === t && styles.chipActive]}
            onPress={() => setAnatiForm({ ...anatiForm, tipoOperacion: t })}>
            <Text style={[styles.chipText, anatiForm.tipoOperacion === t && { color: COLORS.textLight }]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <TouchableOpacity style={styles.checkbox}
        onPress={() => setAnatiForm({ ...anatiForm, tieneHipoteca: !anatiForm.tieneHipoteca })}>
        <Text>{anatiForm.tieneHipoteca ? '☑' : '☐'} ¿Incluye Hipoteca?</Text>
      </TouchableOpacity>
      {anatiForm.tieneHipoteca && (
        <TextInput style={styles.input} placeholder="Valor de la Hipoteca (B/.)" keyboardType="decimal-pad"
          value={anatiForm.valorHipoteca} onChangeText={(v) => setAnatiForm({ ...anatiForm, valorHipoteca: v })} />
      )}
    </View>
  );

  const renderHonorariosForm = () => (
    <View>
      <Text style={styles.fieldLabel}>Tipo de Honorario:</Text>
      <View style={styles.chipRow}>
        {['tarifa_fija', 'contingencia', 'tarifa_hora'].map((t) => (
          <TouchableOpacity key={t} style={[styles.chip, honorariosForm.tipoHonorario === t && styles.chipActive]}
            onPress={() => setHonorariosForm({ ...honorariosForm, tipoHonorario: t })}>
            <Text style={[styles.chipText, honorariosForm.tipoHonorario === t && { color: COLORS.textLight }]}>
              {t.replace(/_/g, ' ')}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <TextInput style={styles.input} placeholder="Cuantía (B/.)" keyboardType="decimal-pad"
        value={honorariosForm.cuantia} onChangeText={(v) => setHonorariosForm({ ...honorariosForm, cuantia: v })} />
      {honorariosForm.tipoHonorario === 'contingencia' && (
        <TextInput style={styles.input} placeholder="% Contingencia" keyboardType="numeric"
          value={honorariosForm.porcentajeContingencia}
          onChangeText={(v) => setHonorariosForm({ ...honorariosForm, porcentajeContingencia: v })} />
      )}
      {honorariosForm.tipoHonorario === 'tarifa_hora' && (
        <>
          <TextInput style={styles.input} placeholder="Tarifa por Hora (B/.)" keyboardType="numeric"
            value={honorariosForm.tarifaHora}
            onChangeText={(v) => setHonorariosForm({ ...honorariosForm, tarifaHora: v })} />
          <TextInput style={styles.input} placeholder="Horas Estimadas" keyboardType="numeric"
            value={honorariosForm.horasEstimadas}
            onChangeText={(v) => setHonorariosForm({ ...honorariosForm, horasEstimadas: v })} />
        </>
      )}
      <Text style={styles.fieldLabel}>Complejidad:</Text>
      <View style={styles.chipRow}>
        {['baja', 'media', 'alta'].map((t) => (
          <TouchableOpacity key={t} style={[styles.chip, honorariosForm.complejidad === t && styles.chipActive]}
            onPress={() => setHonorariosForm({ ...honorariosForm, complejidad: t })}>
            <Text style={[styles.chipText, honorariosForm.complejidad === t && { color: COLORS.textLight }]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderProcesalForm = () => (
    <View>
      <TextInput style={styles.input} placeholder="Fecha de Inicio (YYYY-MM-DD) *"
        value={procesalForm.fechaInicio} onChangeText={(v) => setProcesalForm({ ...procesalForm, fechaInicio: v })} />
      <TextInput style={styles.input} placeholder="Días Hábiles *" keyboardType="numeric"
        value={procesalForm.diasHabiles} onChangeText={(v) => setProcesalForm({ ...procesalForm, diasHabiles: v })} />
    </View>
  );

  const renderResults = () => {
    if (!results) return null;
    const { type, data } = results;

    const renderRow = (label, value) => (
      <View style={styles.resultRow}>
        <Text style={styles.resultLabel}>{label}</Text>
        <Text style={styles.resultValue}>{value}</Text>
      </View>
    );

    if (type === 'laboral') {
      return (
        <Card title="Resultado de Prestaciones Laborales" icon="👷" titleColor={COLORS.primary}>
          {renderRow('Salario Mensual', formatCurrency(data.salarioMensual))}
          {renderRow('Años de Servicio', data.anosServicio)}
          {renderRow('Meses Trabajados', data.mesesServicio)}
          <View style={styles.divider} />
          {renderRow('Indemnización', formatCurrency(data.indemnizacion))}
          {renderRow('Prima de Antigüedad', formatCurrency(data.primaAntiguedad))}
          {renderRow('Vacaciones', formatCurrency(data.vacaciones))}
          {renderRow('Décimo Tercer Mes', formatCurrency(data.decimoTercerMes))}
          {renderRow('Preaviso', formatCurrency(data.preaviso))}
          <View style={styles.divider} />
          {renderRow('TOTAL', formatCurrency(data.total))}
        </Card>
      );
    }

    if (type === 'intereses') {
      return (
        <Card title="Cálculo de Intereses Moratorios" icon="💰" titleColor={COLORS.error}>
          {renderRow('Monto Original', formatCurrency(data.montoOriginal))}
          {renderRow('Tasa Anual', `${data.tasaAnual}%`)}
          {renderRow('Días Transcurridos', data.diasTranscurridos)}
          {renderRow('Intereses Generados', formatCurrency(data.interesesGenerados))}
          <View style={styles.divider} />
          {renderRow('Monto Total a Pagar', formatCurrency(data.montoTotal))}
        </Card>
      );
    }

    if (type === 'anati') {
      return (
        <Card title="Tasas Registrales ANATI" icon="🏠" titleColor={COLORS.primary}>
          <Text style={styles.resultSubtitle}>Base Imponible: {formatCurrency(data.detalle.baseImponible)}</Text>
          <View style={styles.divider} />
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
        <Card title="Honorarios del Abogado" icon="⚖️" titleColor={COLORS.primary}>
          {renderRow('Honorarios Base', formatCurrency(data.honorariosBase))}
          {renderRow('Factor Complejidad', data.factorComplejidad)}
          {renderRow('ITBM 7%', formatCurrency(data.itbm7))}
          <View style={styles.divider} />
          {renderRow('TOTAL', formatCurrency(data.total))}
        </Card>
      );
    }

    if (type === 'procesal') {
      return (
        <Card title="Fechas Procesales" icon="📅" titleColor={COLORS.primary}>
          {renderRow('Fecha de Inicio', data.fechaInicio)}
          {renderRow('Días Hábiles', data.diasHabiles)}
          {renderRow('Días Calendario', data.diasCalendario)}
          <View style={styles.divider} />
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
    <View style={styles.container}>
      <Header title="Calculadoras Legales" onBack={() => navigation.goBack()} />
      <View style={styles.tabRow}>
        {CALCULATOR_TABS.map((tab) => (
          <TouchableOpacity key={tab.key} style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => { setActiveTab(tab.key); setResults(null); }}>
            <Text style={styles.tabIcon}>{tab.icon}</Text>
            <Text style={[styles.tabLabel, activeTab === tab.key && styles.tabLabelActive]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.formContainer} keyboardShouldPersistTaps="handled">
        <Card title={`${CALCULATOR_TABS.find((t) => t.key === activeTab)?.label}`} icon={CALCULATOR_TABS.find((t) => t.key === activeTab)?.icon}>
          {forms[activeTab]()}
          <TouchableOpacity style={styles.calcBtn} onPress={calculate[activeTab]}>
            <Text style={styles.calcBtnText}>Calcular</Text>
          </TouchableOpacity>
        </Card>

        {renderResults()}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  tabRow: {
    flexDirection: 'row', backgroundColor: COLORS.surface,
    paddingVertical: 8, paddingHorizontal: 8,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  tab: {
    flex: 1, alignItems: 'center', paddingVertical: 8,
    borderRadius: 10,
  },
  tabActive: { backgroundColor: COLORS.primary + '15' },
  tabIcon: { fontSize: 20 },
  tabLabel: { fontSize: SIZES.xs, color: COLORS.textSecondary, marginTop: 2 },
  tabLabelActive: { color: COLORS.primary, fontWeight: '600' },
  formContainer: { padding: SIZES.padding, paddingBottom: 40 },
  input: {
    backgroundColor: COLORS.background, borderRadius: 10, paddingHorizontal: 15,
    height: 45, marginBottom: 10, fontSize: SIZES.md, color: COLORS.text,
    borderWidth: 1, borderColor: COLORS.border,
  },
  fieldLabel: { fontSize: SIZES.sm, color: COLORS.textSecondary, marginBottom: 6, marginTop: 4, fontWeight: '500' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10, gap: 6 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 16,
    borderWidth: 1, borderColor: COLORS.border,
  },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontSize: SIZES.xs, color: COLORS.text },
  checkbox: { paddingVertical: 8, fontSize: SIZES.md, color: COLORS.text },
  calcBtn: {
    backgroundColor: COLORS.primary, borderRadius: 12, height: 48,
    justifyContent: 'center', alignItems: 'center', marginTop: 10,
  },
  calcBtnText: { color: COLORS.textLight, fontSize: SIZES.md, fontWeight: '600' },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 8 },
  resultRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 6,
  },
  resultLabel: { fontSize: SIZES.sm, color: COLORS.textSecondary },
  resultValue: { fontSize: SIZES.sm, fontWeight: '600', color: COLORS.text },
  resultSubtitle: { fontSize: SIZES.sm, color: COLORS.textSecondary, textAlign: 'center', marginBottom: 4 },
});

export default LegalCalculatorsScreen;
