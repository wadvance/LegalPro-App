import { getItem, setItem, removeItem } from '../src/utils/storage';
import { AUTH_STORAGE_KEY, SESSION_KEY } from './config';

const getUsers = async () => {
  try {
    const json = await getItem(AUTH_STORAGE_KEY);
    return json ? JSON.parse(json) : [];
  } catch {
    return [];
  }
};

const saveUsers = async (users) => {
  await setItem(AUTH_STORAGE_KEY, JSON.stringify(users));
};

export const registerUser = async (email, password, userData) => {
  try {
    const users = await getUsers();
    const exists = users.find((u) => u.email === email);
    if (exists) return { success: false, error: 'El correo ya está registrado' };
    if (password.length < 6) return { success: false, error: 'La contraseña debe tener al menos 6 caracteres' };

    const newUser = {
      ...userData,
      email,
      password, // En producción usar hash
      uid: Date.now().toString(36) + Math.random().toString(36).substring(2, 8),
      rol: userData.rol || 'abogado',
      activo: true,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
    };
    users.push(newUser);
    await saveUsers(users);

    const session = { uid: newUser.uid, email: newUser.email, nombre: newUser.nombre, rol: newUser.rol };
    await setItem(SESSION_KEY, JSON.stringify(session));

    return { success: true, user: { uid: newUser.uid, email: newUser.email, displayName: `${newUser.nombre} ${newUser.apellido}` } };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const loginUser = async (email, password) => {
  try {
    const users = await getUsers();
    const user = users.find((u) => u.email === email && u.password === password);
    if (!user) return { success: false, error: 'Credenciales inválidas' };

    user.lastLogin = new Date().toISOString();
    await saveUsers(users);

    const session = { uid: user.uid, email: user.email, nombre: user.nombre, rol: user.rol };
    await setItem(SESSION_KEY, JSON.stringify(session));

    return { success: true, user: { uid: user.uid, email: user.email, displayName: `${user.nombre} ${user.apellido}` } };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const logoutUser = async () => {
  try {
    await removeItem(SESSION_KEY);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const resetPassword = async (email) => {
  try {
    const users = await getUsers();
    const user = users.find((u) => u.email === email);
    if (!user) return { success: false, error: 'Correo no registrado' };
    return { success: true, password: user.password };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getCurrentUser = async () => {
  try {
    const json = await getItem(SESSION_KEY);
    if (!json) return null;
    const session = JSON.parse(json);
    return { uid: session.uid, email: session.email, displayName: session.nombre };
  } catch {
    return null;
  }
};

export const getUserProfile = async (uid) => {
  try {
    const users = await getUsers();
    const user = users.find((u) => u.uid === uid);
    if (user) {
      const { password, ...profile } = user;
      return { success: true, data: profile };
    }
    return { success: false, error: 'Perfil no encontrado' };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const onAuthChange = (callback) => {
  const poll = async () => {
    const session = await getCurrentUser();
    callback(session);
  };
  poll();
  const interval = setInterval(poll, 3000);
  return () => clearInterval(interval);
};
