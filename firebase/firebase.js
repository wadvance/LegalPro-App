import { initializeApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDzer5VsFrJj4PG_4ooXsgv2NjdXJKFVWM",
  authDomain: "bufete-abogados.firebaseapp.com",
  projectId: "bufete-abogados",
  storageBucket: "bufete-abogados.firebasestorage.app",
  messagingSenderId: "697819738127",
  appId: "1:697819738127:web:31a9e4cd06eb2eaa6a337a"
};

let app;
let auth;
let db;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  setPersistence(auth, browserLocalPersistence);
  db = getFirestore(app);
} catch (e) {
  console.error('Firebase init error:', e);
}

export { auth, db };
export default app;
