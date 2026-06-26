import AsyncStorage from '@react-native-async-storage/async-storage';

export const getItem = async (key) => {
  try { return await AsyncStorage.getItem(key) } catch { return null }
};

export const setItem = async (key, value) => {
  try { await AsyncStorage.setItem(key, value) } catch {}
};

export const removeItem = async (key) => {
  try { await AsyncStorage.removeItem(key) } catch {}
};

export const getAllKeys = async () => {
  try { return await AsyncStorage.getAllKeys() } catch { return [] }
};

export const multiRemove = async (keys) => {
  try { await AsyncStorage.multiRemove(keys) } catch {}
};

export const clear = async () => {
  try { await AsyncStorage.clear() } catch {}
};

export default { getItem, setItem, removeItem, getAllKeys, multiRemove, clear };