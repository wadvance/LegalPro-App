import {
  collection,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../../firebase/firebase';

const getCol = (name) => collection(db, name);
const getDocRef = (colName, docId) => doc(db, colName, docId);

export const createDocument = async (collectionName, data) => {
  try {
    const docRef = await addDoc(getCol(collectionName), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const setDocument = async (collectionName, docId, data) => {
  try {
    await setDoc(getDocRef(collectionName, docId), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }, { merge: true });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const updateDocument = async (collectionName, docId, data) => {
  try {
    await updateDoc(getDocRef(collectionName, docId), {
      ...data,
      updatedAt: serverTimestamp(),
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const deleteDocument = async (collectionName, docId) => {
  try {
    await deleteDoc(getDocRef(collectionName, docId));
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getDocument = async (collectionName, docId) => {
  try {
    const docSnap = await getDoc(getDocRef(collectionName, docId));
    if (docSnap.exists()) {
      return { success: true, data: { id: docSnap.id, ...docSnap.data() } };
    }
    return { success: false, error: 'Documento no encontrado' };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

const buildConditions = (conditions = []) => {
  const constraints = [];
  conditions.forEach(({ field, operator, value }) => {
    if (operator === '==') constraints.push(where(field, '==', value));
    else if (operator === '>') constraints.push(where(field, '>', value));
    else if (operator === '<') constraints.push(where(field, '<', value));
    else if (operator === '>=') constraints.push(where(field, '>=', value));
    else if (operator === '<=') constraints.push(where(field, '<=', value));
    else if (operator === 'array-contains') constraints.push(where(field, 'array-contains', value));
  });
  return constraints;
};

export const queryDocuments = async (collectionName, conditions = [], orderByField = null, orderDirection = 'asc', limitCount = null) => {
  try {
    const constraints = buildConditions(conditions);
    if (orderByField) constraints.push(orderBy(orderByField, orderDirection));
    if (limitCount) constraints.push(limit(limitCount));

    const q = constraints.length > 0
      ? query(getCol(collectionName), ...constraints)
      : query(getCol(collectionName));

    const querySnapshot = await getDocs(q);
    const data = [];
    querySnapshot.forEach((docSnap) => {
      data.push({ id: docSnap.id, ...docSnap.data() });
    });
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message, data: [] };
  }
};

export const getAllDocuments = async (collectionName) => {
  try {
    const querySnapshot = await getDocs(getCol(collectionName));
    const data = [];
    querySnapshot.forEach((docSnap) => {
      data.push({ id: docSnap.id, ...docSnap.data() });
    });
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message, data: [] };
  }
};

export const subscribeToCollection = (collectionName, callback, conditions = []) => {
  const constraints = buildConditions(conditions);
  const q = constraints.length > 0
    ? query(getCol(collectionName), ...constraints)
    : query(getCol(collectionName));

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const data = [];
    snapshot.forEach((docSnap) => {
      data.push({ id: docSnap.id, ...docSnap.data() });
    });
    callback(data);
  }, (error) => {
    console.error('Firestore subscribe error:', error);
    callback([]);
  });

  return unsubscribe;
};

export const subscribeToDocument = (collectionName, docId, callback) => {
  const unsubscribe = onSnapshot(getDocRef(collectionName, docId), (docSnap) => {
    if (docSnap.exists()) {
      callback({ id: docSnap.id, ...docSnap.data() });
    } else {
      callback(null);
    }
  });

  return unsubscribe;
};

const toDate = (val) => {
  if (val instanceof Timestamp) return val.toDate();
  if (val && typeof val === 'object' && val.seconds) return new Date(val.seconds * 1000);
  return new Date(val);
};

export const getDashboardStats = async (userId) => {
  try {
    const [clientesSnap, citasSnap, cobrosSnap, expedientesSnap] = await Promise.all([
      getDocs(query(getCol('clientes'), where('abogadoId', '==', userId))),
      getDocs(query(getCol('citas'), where('abogadoId', '==', userId))),
      getDocs(query(getCol('cobros'), where('abogadoId', '==', userId))),
      getDocs(query(getCol('expedientes'), where('abogadoId', '==', userId))),
    ]);

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    let cobrosDelMes = 0;
    cobrosSnap.forEach((d) => {
      const data = d.data();
      const cAt = data.createdAt;
      const cDate = cAt ? toDate(cAt) : null;
      if (cDate && cDate >= startOfMonth) {
        cobrosDelMes += parseFloat(data.monto) || 0;
      }
    });

    let citasPendientes = 0;
    citasSnap.forEach((d) => {
      if (d.data().estado === 'pendiente') citasPendientes++;
    });

    return {
      success: true,
      data: {
        totalClientes: clientesSnap.size,
        totalExpedientes: expedientesSnap.size,
        cobrosDelMes,
        citasPendientes,
      },
    };
  } catch (error) {
    return { success: false, error: error.message, data: null };
  }
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
