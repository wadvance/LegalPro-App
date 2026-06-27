import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase';

export const registerUser = async (email, password, userData) => {
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const uid = cred.user.uid;

    const profile = {
      uid,
      email,
      nombre: userData.nombre || '',
      apellido: userData.apellido || '',
      telefono: userData.telefono || '',
      cedula: userData.cedula || '',
      rol: userData.rol || 'abogado',
      activo: true,
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp(),
    };

    await setDoc(doc(db, 'usuarios', uid), profile);

    return {
      success: true,
      user: {
        uid,
        email,
        displayName: `${profile.nombre} ${profile.apellido}`.trim(),
      },
    };
  } catch (error) {
    let msg = error.message;
    if (error.code === 'auth/email-already-in-use') msg = 'El correo ya está registrado';
    else if (error.code === 'auth/weak-password') msg = 'La contraseña debe tener al menos 6 caracteres';
    else if (error.code === 'auth/invalid-email') msg = 'Correo electrónico inválido';
    return { success: false, error: msg };
  }
};

export const loginUser = async (email, password) => {
  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const uid = cred.user.uid;

    const profile = await getDoc(doc(db, 'usuarios', uid));
    const data = profile.data() || {};

    return {
      success: true,
      user: {
        uid,
        email: cred.user.email,
        displayName: `${data.nombre || ''} ${data.apellido || ''}`.trim(),
      },
    };
  } catch (error) {
    let msg = 'Credenciales inválidas';
    if (error.code === 'auth/user-not-found') msg = 'Correo no registrado';
    else if (error.code === 'auth/wrong-password') msg = 'Contraseña incorrecta';
    else if (error.code === 'auth/invalid-email') msg = 'Correo electrónico inválido';
    else if (error.code === 'auth/too-many-requests') msg = 'Demasiados intentos. Intente más tarde.';
    else if (error.code === 'auth/invalid-credential') msg = 'Credenciales inválidas';
    return { success: false, error: msg };
  }
};

export const loginWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  try {
    await signInWithRedirect(auth, provider);
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Error al iniciar sesión con Google' };
  }
};

export const getGoogleRedirectResult = async () => {
  try {
    const result = await getRedirectResult(auth);
    if (!result) return null;

    const user = result.user;
    const profileSnap = await getDoc(doc(db, 'usuarios', user.uid));
    if (!profileSnap.exists()) {
      const displayName = user.displayName || '';
      const parts = displayName.split(' ');
      const nombre = parts[0] || '';
      const apellido = parts.slice(1).join(' ') || '';

      await setDoc(doc(db, 'usuarios', user.uid), {
        uid: user.uid,
        email: user.email,
        nombre,
        apellido,
        telefono: '',
        cedula: '',
        rol: 'abogado',
        activo: true,
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
      });
    }

    return {
      success: true,
      user: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || user.email,
      },
    };
  } catch (error) {
    if (error.code === 'auth/popup-closed-by-user') {
      return { success: false, error: '' };
    }
    return { success: false, error: 'Error al iniciar sesión con Google' };
  }
};

export const logoutUser = async () => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const resetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
    return { success: true, password: '' };
  } catch (error) {
    let msg = 'Error al enviar correo de restablecimiento';
    if (error.code === 'auth/user-not-found') msg = 'Correo no registrado';
    else if (error.code === 'auth/invalid-email') msg = 'Correo electrónico inválido';
    return { success: false, error: msg };
  }
};

export const getCurrentUser = () => {
  const user = auth.currentUser;
  if (!user) return null;
  return { uid: user.uid, email: user.email, displayName: user.displayName };
};

export const getUserProfile = async (uid) => {
  try {
    const docSnap = await getDoc(doc(db, 'usuarios', uid));
    if (docSnap.exists()) {
      const { password, ...profile } = docSnap.data();
      return { success: true, data: profile };
    }
    return { success: false, error: 'Perfil no encontrado' };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const onAuthChange = (callback) => {
  const unsubscribe = onAuthStateChanged(auth, (user) => {
    if (user) {
      callback({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
      });
    } else {
      callback(null);
    }
  });
  return unsubscribe;
};
