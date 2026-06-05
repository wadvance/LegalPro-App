import { parseDate } from './helpers';

export const calcularPrestacionesLaborales = ({
  salarioMensual,
  fechaIngreso,
  fechaSalida,
  tipoContrato = 'indefinido',
  causaTerminacion = 'renuncia',
  tieneDecimoTercerMes = true,
  tieneVacaciones = true,
  tienePrimaAntiguedad = true,
  periodoPrueba = false,
}) => {
  const salarioAnual = salarioMensual * 12;
  const salarioSemanal = salarioMensual / 4.33;
  const salarioDiario = salarioMensual / 30;

  const ingreso = parseDate(fechaIngreso) || new Date();
  const salida = parseDate(fechaSalida) || new Date();
  const anosServicio = (salida - ingreso) / (365.25 * 24 * 60 * 60 * 1000);
  const mesesServicio = anosServicio * 12;
  const diasServicio = Math.floor((salida - ingreso) / (24 * 60 * 60 * 1000));

  let indemnizacion = 0;
  let primaAntiguedad = 0;
  let vacaciones = 0;
  let decimoTercerMes = 0;
  let preaviso = 0;

  switch (causaTerminacion) {
    case 'renuncia':
      if (tipoContrato === 'indefinido') {
        if (anosServicio >= 2) {
          preaviso = calcularPreaviso(salarioMensual, anosServicio, tipoContrato);
        }
      }
      break;

    case 'despido_injustificado':
      preaviso = calcularPreaviso(salarioMensual, anosServicio, tipoContrato);
      indemnizacion = calcularIndemnizacion(salarioMensual, anosServicio);
      break;

    case 'despido_justificado':
      break;

    case 'mutuo_acuerdo':
      preaviso = calcularPreaviso(salarioMensual, anosServicio, tipoContrato);
      indemnizacion = calcularIndemnizacion(salarioMensual, anosServicio) * 0.5;
      break;

    case 'muerte':
      indemnizacion = calcularIndemnizacion(salarioMensual, anosServicio);
      break;

    case 'jubilacion':
      primaAntiguedad = calcularPrimaAntiguedad(salarioMensual, anosServicio);
      break;
  }

  if (tienePrimaAntiguedad && causaTerminacion !== 'jubilacion') {
    if (anosServicio >= 1) {
      primaAntiguedad = calcularPrimaAntiguedad(salarioMensual, anosServicio);
    }
  }

  vacaciones = calcularVacaciones(salarioDiario, mesesServicio);
  decimoTercerMes = calcularDecimoTercerMes(salarioMensual, mesesServicio);

  const total = indemnizacion + primaAntiguedad + vacaciones + decimoTercerMes + preaviso;

  return {
    salarioMensual,
    salarioDiario: salarioDiario.toFixed(2),
    anosServicio: anosServicio.toFixed(2),
    mesesServicio: Math.floor(mesesServicio),
    diasServicio,
    indemnizacion: indemnizacion.toFixed(2),
    primaAntiguedad: primaAntiguedad.toFixed(2),
    vacaciones: vacaciones.toFixed(2),
    decimoTercerMes: decimoTercerMes.toFixed(2),
    preaviso: preaviso.toFixed(2),
    total: total.toFixed(2),
    detalle: {
      indemnizacion: `${anosServicio < 1 ? 'No aplica (menos de 1 año)' : `${getIndemnizacionMeses(anosServicio)} meses de salario`}`,
      primaAntiguedad: `${anosServicio < 1 ? 'No aplica' : `${getPrimaMeses(anosServicio)} semanas de salario`}`,
      vacaciones: `${Math.floor(mesesServicio * 1.25)} días (${(mesesServicio * 1.25).toFixed(2)} días)` ,
      decimoTercerMes: `${(mesesServicio / 12 * salarioMensual).toFixed(2)}`,
    },
  };
};

const calcularPreaviso = (salarioMensual, anosServicio) => {
  let semanas = 0;
  if (anosServicio < 1) semanas = 0;
  else if (anosServicio < 2) semanas = 2;
  else if (anosServicio < 5) semanas = 4;
  else if (anosServicio < 10) semanas = 6;
  else semanas = 8;
  return (salarioMensual / 4.33) * semanas;
};

const calcularIndemnizacion = (salarioMensual, anosServicio) => {
  if (anosServicio <= 0) return 0;
  const meses = Math.min(Math.floor(anosServicio * 12), 36);
  return (salarioMensual / 30) * meses;
};

const calcularPrimaAntiguedad = (salarioMensual, anosServicio) => {
  if (anosServicio < 1) return 0;
  const semanas = Math.min(Math.floor(anosServicio * 2) + 1, 20);
  return (salarioMensual / 4.33) * semanas;
};

const calcularVacaciones = (salarioDiario, mesesServicio) => {
  const diasVacacion = Math.min(mesesServicio * 1.25, 30);
  return salarioDiario * diasVacacion;
};

const calcularDecimoTercerMes = (salarioMensual, mesesServicio) => {
  return (salarioMensual / 12) * Math.min(mesesServicio, 12);
};

const getIndemnizacionMeses = (anos) => {
  if (anos < 1) return 0;
  if (anos < 2) return 1;
  if (anos < 5) return 3;
  if (anos < 10) return 6;
  return 12;
};

const getPrimaMeses = (anos) => {
  if (anos < 1) return 0;
  return Math.min(Math.floor(anos * 2) + 1, 20);
};

export const calcularInteresesMoratorios = ({
  monto,
  tasaAnual = 6,
  fechaInicio,
  fechaFin,
  tipoTasa = 'legal',
}) => {
  const inicio = parseDate(fechaInicio) || new Date();
  const fin = fechaFin ? parseDate(fechaFin) || new Date() : new Date();
  const dias = Math.floor((fin - inicio) / (24 * 60 * 60 * 1000));

  let tasa = tasaAnual;
  if (tipoTasa === 'legal') tasa = 6;
  if (tipoTasa === 'convencional') tasa = tasaAnual || 6;
  if (tipoTasa === 'mora_bancaria') tasa = 10;

  const tasaDiaria = tasa / 100 / 360;
  const intereses = monto * tasaDiaria * dias;
  const montoTotal = monto + intereses;

  return {
    montoOriginal: monto.toFixed(2),
    tasaAnual: tasa,
    tasaDiaria: (tasaDiaria * 100).toFixed(4) + '%',
    diasTranscurridos: dias,
    interesesGenerados: intereses.toFixed(2),
    montoTotal: montoTotal.toFixed(2),
  };
};

export const calcularTasasRegistralesANATI = ({
  tipoOperacion = 'compraventa',
  valorInmueble,
  tipoInmueble = 'urbano',
  tieneHipoteca = false,
  valorHipoteca = 0,
  esPrimeraInscripcion = false,
}) => {
  const baseImponible = valorInmueble;
  let derechoRegistro = 0;
  let impuestoTransmision = 0;
  let timbreRegistro = 0;
  let inscripcionHipoteca = 0;
  let otros = 0;

  const tasaDerechoRegistro = 0.01;
  derechoRegistro = baseImponible * tasaDerechoRegistro;

  if (tipoOperacion === 'compraventa' || tipoOperacion === 'transmision') {
    if (baseImponible <= 30000) {
      impuestoTransmision = 0;
    } else {
      impuestoTransmision = (baseImponible - 30000) * 0.02;
    }
  }

  timbreRegistro = Math.max(50, baseImponible * 0.001);

  if (tieneHipoteca && valorHipoteca > 0) {
    inscripcionHipoteca = valorHipoteca * 0.005;
  }

  if (esPrimeraInscripcion) {
    otros = baseImponible * 0.005;
  }

  const total = derechoRegistro + impuestoTransmision + timbreRegistro + inscripcionHipoteca + otros;

  return {
    derechoRegistro: derechoRegistro.toFixed(2),
    impuestoTransmision: impuestoTransmision.toFixed(2),
    timbreRegistro: timbreRegistro.toFixed(2),
    inscripcionHipoteca: inscripcionHipoteca.toFixed(2),
    otros: otros.toFixed(2),
    total: total.toFixed(2),
    detalle: {
      baseImponible: baseImponible.toFixed(2),
      tasaDerechoRegistro: '1%',
      tasaTransmision: baseImponible <= 30000 ? 'Exento' : '2% sobre excedente de B/.30,000',
      timbre: 'B/.50 o 0.1% (el mayor)',
    },
  };
};

export const calcularHonorariosAbogado = ({
  tipoCaso,
  cuantia = 0,
  complejidad = 'media',
  tipoHonorario = 'contingencia',
  porcentajeContingencia = 30,
  tarifaHora = 150,
  horasEstimadas = 0,
}) => {
  let honorariosBase = 0;
  let factorComplejidad = complejidad === 'alta' ? 1.5 : complejidad === 'baja' ? 0.7 : 1.0;

  switch (tipoHonorario) {
    case 'contingencia':
      if (cuantia > 0) {
        honorariosBase = cuantia * (porcentajeContingencia / 100);
      }
      break;
    case 'tarifa_fija':
      const tarifas = {
        consulta: 150,
        civil_menor: 500,
        civil_mayor: 2000,
        penal: 3000,
        laboral: 1500,
        comercial: 2500,
        administrativo: 2000,
        familia: 1200,
      };
      honorariosBase = tarifas[tipoCaso] || 1000;
      honorariosBase *= factorComplejidad;
      break;
    case 'tarifa_hora':
      honorariosBase = tarifaHora * horasEstimadas;
      break;
  }

  return {
    tipoHonorario,
    honorariosBase: honorariosBase.toFixed(2),
    factorComplejidad,
    itbm7: (honorariosBase * 0.07).toFixed(2),
    total: (honorariosBase * 1.07).toFixed(2),
  };
};

export const calcularFechasProcesales = ({ fechaInicio, tipoPlazo, diasHabiles = 0 }) => {
  const inicio = parseDate(fechaInicio) || new Date();
  const resultado = new Date(inicio);
  let contados = 0;

  while (contados < diasHabiles) {
    resultado.setDate(resultado.getDate() + 1);
    const diaSem = resultado.getDay();
    if (diaSem !== 0 && diaSem !== 6) {
      contados++;
    }
  }

  return {
    fechaInicio: inicio.toLocaleDateString('es-PA'),
    fechaVencimiento: resultado.toLocaleDateString('es-PA'),
    diasHabiles,
    diasCalendario: Math.floor((resultado - inicio) / (24 * 60 * 60 * 1000)),
  };
};
