function getStorage() {
  try {
    localStorage.getItem('__test');
    return localStorage;
  } catch {
    return null;
  }
}

const storage = getStorage();

export const getItem = async (key) => {
  try { const v = storage.getItem(key); return v } catch { return null }
};

export const setItem = async (key, value) => {
  try { storage.setItem(key, value) } catch {}
};

export const removeItem = async (key) => {
  try { storage.removeItem(key) } catch {}
};

export const getAllKeys = async () => {
  try {
    const keys = [];
    for (let i = 0; i < storage.length; i++) keys.push(storage.key(i));
    return keys;
  } catch { return [] }
};

export const multiRemove = async (keys) => {
  try { keys.forEach(k => storage.removeItem(k)) } catch {}
};

export const clear = async () => {
  try { storage.clear() } catch {}
};

export default { getItem, setItem, removeItem, getAllKeys, multiRemove, clear };
