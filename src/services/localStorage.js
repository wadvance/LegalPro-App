import AsyncStorage from '@react-native-async-storage/async-storage';

const COLLECTION_PREFIX = '@arauz_carrillo_';

const getCollectionKey = (name) => `${COLLECTION_PREFIX}${name}`;

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const getAllFromCollection = async (collectionName) => {
  try {
    const key = getCollectionKey(collectionName);
    const json = await AsyncStorage.getItem(key);
    const data = json ? JSON.parse(json) : [];
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message, data: [] };
  }
};

export const saveToCollection = async (collectionName, data) => {
  try {
    const key = getCollectionKey(collectionName);
    await AsyncStorage.setItem(key, JSON.stringify(data));
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const addDocument = async (collectionName, docData) => {
  try {
    const result = await getAllFromCollection(collectionName);
    const items = result.data || [];
    const id = Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
    const newDoc = {
      ...docData,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    items.push(newDoc);
    await saveToCollection(collectionName, items);
    return { success: true, id, data: newDoc };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const updateDocument = async (collectionName, docId, updates) => {
  try {
    const result = await getAllFromCollection(collectionName);
    const items = result.data || [];
    const index = items.findIndex((d) => d.id === docId);
    if (index === -1) return { success: false, error: 'Documento no encontrado' };
    items[index] = {
      ...items[index],
      ...updates,
      id: docId,
      updatedAt: new Date().toISOString(),
    };
    await saveToCollection(collectionName, items);
    return { success: true, data: items[index] };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const deleteDocument = async (collectionName, docId) => {
  try {
    const result = await getAllFromCollection(collectionName);
    const items = (result.data || []).filter((d) => d.id !== docId);
    await saveToCollection(collectionName, items);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getDocument = async (collectionName, docId) => {
  try {
    const result = await getAllFromCollection(collectionName);
    const doc = (result.data || []).find((d) => d.id === docId);
    if (doc) return { success: true, data: doc };
    return { success: false, error: 'Documento no encontrado' };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const queryCollection = async (collectionName, filters = {}) => {
  try {
    const result = await getAllFromCollection(collectionName);
    let items = result.data || [];

    if (filters && Object.keys(filters).length > 0) {
      items = items.filter((item) => {
        return Object.entries(filters).every(([key, value]) => {
          return item[key] === value;
        });
      });
    }

    return { success: true, data: items };
  } catch (error) {
    return { success: false, error: error.message, data: [] };
  }
};

export const subscribeCollection = (collectionName, callback, filters = {}) => {
  const poll = async () => {
    const result = await queryCollection(collectionName, filters);
    if (result.success) callback(result.data);
  };

  poll();
  const interval = setInterval(poll, 2000);
  return () => clearInterval(interval);
};

export const clearCollection = async (collectionName) => {
  try {
    const key = getCollectionKey(collectionName);
    await AsyncStorage.removeItem(key);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const clearAllData = async () => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const appKeys = keys.filter((k) => k.startsWith(COLLECTION_PREFIX));
    await AsyncStorage.multiRemove(appKeys);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export default {
  getAllFromCollection,
  saveToCollection,
  addDocument,
  updateDocument,
  deleteDocument,
  getDocument,
  queryCollection,
  subscribeCollection,
  clearCollection,
  clearAllData,
};
