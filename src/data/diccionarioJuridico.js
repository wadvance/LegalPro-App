import { codigoCivil, buscarEnCodigoCivil } from './codigoCivil';
import { codigoPenal, buscarEnCodigoPenal } from './codigoPenal';
import { codigoLaboral, buscarEnCodigoLaboral } from './codigoLaboral';
import { codigoComercio, buscarEnCodigoComercio } from './codigoComercio';
import {
  constitucion, codigoFamilia, codigoFiscal, leyesEspeciales,
  normasInternacionales, decretosImportantes, acuerdosImportantes,
  competenciaYConsumidor, tribunalesSuperiores,
} from './leyesPanama';

export const CODIGOS = {
  constitucion,
  civil: codigoCivil,
  penal: codigoPenal,
  laboral: codigoLaboral,
  comercio: codigoComercio,
  familia: codigoFamilia,
  fiscal: codigoFiscal,
  especiales: leyesEspeciales,
  normas: normasInternacionales,
  decretos: decretosImportantes,
  acuerdos: acuerdosImportantes,
  competencia: competenciaYConsumidor,
  tribunales: tribunalesSuperiores,
};

const buscarGenerico = (codigo, termino) => {
  const terminoLower = termino.toLowerCase();
  return (codigo.articulos || []).filter(
    (a) =>
      a.titulo.toLowerCase().includes(terminoLower) ||
      a.contenido.toLowerCase().includes(terminoLower) ||
      a.categoria.toLowerCase().includes(terminoLower)
  );
};

export const buscarEnTodosLosCodigos = (termino) => {
  if (!termino || termino.trim() === '') {
    return Object.fromEntries(
      Object.entries(CODIGOS).map(([key, val]) => [key, val.articulos])
    );
  }
  return {
    civil: buscarEnCodigoCivil(termino),
    penal: buscarEnCodigoPenal(termino),
    laboral: buscarEnCodigoLaboral(termino),
    comercio: buscarEnCodigoComercio(termino),
    constitucion: buscarGenerico(constitucion, termino),
    familia: buscarGenerico(codigoFamilia, termino),
    fiscal: buscarGenerico(codigoFiscal, termino),
    especiales: buscarGenerico(leyesEspeciales, termino),
    normas: buscarGenerico(normasInternacionales, termino),
    decretos: buscarGenerico(decretosImportantes, termino),
    acuerdos: buscarGenerico(acuerdosImportantes, termino),
    competencia: buscarGenerico(competenciaYConsumidor, termino),
    tribunales: buscarGenerico(tribunalesSuperiores, termino),
  };
};

export const obtenerCodigoPorTipo = (tipo) => CODIGOS[tipo] || null;

export const obtenerArticulo = (tipoCodigo, articuloId) => {
  const codigo = CODIGOS[tipoCodigo];
  if (!codigo) return null;
  return codigo.articulos?.find((a) => a.id === articuloId) || null;
};

export const CATEGORIAS_POR_CODIGO = Object.fromEntries(
  Object.entries(CODIGOS).map(([key, val]) => [
    key,
    [...new Set((val.articulos || []).map((a) => a.categoria))],
  ])
);

export const obtenerArticulosRelacionados = (tipoCodigo, articuloId, max = 5) => {
  const codigo = CODIGOS[tipoCodigo];
  if (!codigo?.articulos) return [];
  const articulo = codigo.articulos.find((a) => a.id === articuloId);
  if (!articulo) return [];
  return codigo.articulos
    .filter((a) => a.id !== articuloId && a.categoria === articulo.categoria)
    .slice(0, max);
};

export const obtenerInfoCodigo = (tipoCodigo) => {
  const codigo = CODIGOS[tipoCodigo];
  if (!codigo) return null;
  return codigo.info || null;
};

export {
  codigoCivil, codigoPenal, codigoLaboral, codigoComercio,
  constitucion, codigoFamilia, codigoFiscal, leyesEspeciales,
  normasInternacionales, decretosImportantes, acuerdosImportantes,
  competenciaYConsumidor, tribunalesSuperiores,
};
