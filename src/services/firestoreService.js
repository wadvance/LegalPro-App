import {
  addDocument,
  updateDocument as localUpdate,
  deleteDocument as localDelete,
  getDocument as localGet,
  queryCollection,
  subscribeCollection,
  getAllFromCollection,
} from './localStorage';

export const createDocument = async (collectionName, data) => {
  return addDocument(collectionName, data);
};

export const setDocument = async (collectionName, docId, data) => {
  const result = await localGet(collectionName, docId);
  if (result.success) {
    return localUpdate(collectionName, docId, data);
  }
  return addDocument(collectionName, { ...data, id: docId });
};

export const updateDocument = async (collectionName, docId, data) => {
  return localUpdate(collectionName, docId, data);
};

export const deleteDocument = async (collectionName, docId) => {
  return localDelete(collectionName, docId);
};

export const getDocument = async (collectionName, docId) => {
  return localGet(collectionName, docId);
};

export const queryDocuments = async (collectionName, conditions = [], orderByField = null, orderDirection = 'asc', limitCount = null) => {
  const filters = {};
  conditions.forEach(({ field, operator, value }) => {
    if (operator === '==') filters[field] = value;
  });

  const result = await queryCollection(collectionName, filters);
  if (result.success && result.data) {
    let items = [...result.data];
    if (orderByField) {
      items.sort((a, b) => {
        const va = a[orderByField] || '';
        const vb = b[orderByField] || '';
        return orderDirection === 'asc' ? va > vb ? 1 : -1 : va < vb ? 1 : -1;
      });
    }
    if (limitCount) items = items.slice(0, limitCount);
    return { success: true, data: items };
  }
  return result;
};

export const getAllDocuments = async (collectionName) => {
  return getAllFromCollection(collectionName);
};

export const subscribeToCollection = (collectionName, callback, conditions = []) => {
  const filters = {};
  conditions.forEach(({ field, operator, value }) => {
    if (operator === '==') filters[field] = value;
  });
  return subscribeCollection(collectionName, callback, filters);
};

export const subscribeToDocument = (collectionName, docId, callback) => {
  const interval = setInterval(async () => {
    const result = await localGet(collectionName, docId);
    if (result.success) callback(result.data);
  }, 2000);
  return () => clearInterval(interval);
};

export const getDashboardStats = async (userId) => {
  const [clientes, citas, cobros, expedientes] = await Promise.all([
    queryCollection('clientes', { abogadoId: userId }),
    queryCollection('citas', { abogadoId: userId }),
    queryCollection('cobros', { abogadoId: userId }),
    queryCollection('expedientes', { abogadoId: userId }),
  ]);

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const cobrosDelMes = (cobros.data || [])
    .filter((c) => c.createdAt >= startOfMonth)
    .reduce((sum, c) => sum + (parseFloat(c.monto) || 0), 0);

  const citasPendientes = (citas.data || []).filter((c) => c.estado === 'pendiente').length;

  return {
    success: true,
    data: {
      totalClientes: (clientes.data || []).length,
      totalExpedientes: (expedientes.data || []).length,
      cobrosDelMes,
      citasPendientes,
    },
  };
};

export const FIRESTORE_COLLECTIONS = {
  CLIENTES: 'clientes',
  ABOGADOS: 'abogados',
  EMPRESAS: 'empresas',
  EXPEDIENTES: 'expedientes',
  CITAS: 'citas',
  COBROS: 'cobros',
  FACTURAS: 'facturas',
  NOTIFICACIONES: 'notificaciones',
  USUARIOS: 'usuarios',
};
