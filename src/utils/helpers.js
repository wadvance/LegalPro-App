export const formatCurrency = (amount) => {
  return `B/. ${Number(amount).toFixed(2)}`;
};

export const parseDate = (date) => {
  if (!date) return null;
  if (date instanceof Date) return date;
  if (typeof date === 'string') return new Date(date);
  if (date.toDate) return date.toDate();
  if (date.seconds) return new Date(date.seconds * 1000);
  return new Date(date);
};

export const formatDate = (date) => {
  const d = parseDate(date);
  if (!d) return '';
  return d.toLocaleDateString('es-PA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const formatDateTime = (date) => {
  const d = parseDate(date);
  if (!d) return '';
  return d.toLocaleDateString('es-PA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatShortDate = (date) => {
  const d = parseDate(date);
  if (!d) return '';
  return d.toLocaleDateString('es-PA', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

export const truncateText = (text, maxLength = 50) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

export const getStatusColor = (status) => {
  const colors = {
    activo: '#388E3C',
    inactivo: '#BDBDBD',
    pendiente: '#F57C00',
    completado: '#1976D2',
    cancelado: '#D32F2F',
    pagado: '#388E3C',
    vencido: '#D32F2F',
  };
  return colors[status?.toLowerCase()] || '#757575';
};

export const getStatusLabel = (status) => {
  const labels = {
    activo: 'Activo',
    inactivo: 'Inactivo',
    pendiente: 'Pendiente',
    completado: 'Completado',
    cancelado: 'Cancelado',
    pagado: 'Pagado',
    vencido: 'Vencido',
  };
  return labels[status?.toLowerCase()] || status;
};

export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const validateCedula = (cedula) => {
  const re = /^\d{1,2}-\d{1,4}-\d{1,6}$/;
  return re.test(cedula);
};

export const validateRuc = (ruc) => {
  const re = /^\d{1,12}-\d{1,2}-\d{1,6}$/;
  return re.test(ruc);
};
