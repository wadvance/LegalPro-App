import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../firebase/firebase';

const AuthLoader = ({ navigation }) => {
  const mounted = useRef(true);
  const timer = useRef(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!mounted.current) return;
      if (user) {
        if (timer.current) clearTimeout(timer.current);
        try {
          const snap = await getDoc(doc(db, 'usuarios', user.uid));
          if (!snap.exists()) {
            const parts = (user.displayName || '').split(' ');
            await setDoc(doc(db, 'usuarios', user.uid), {
              uid: user.uid, email: user.email,
              nombre: parts[0] || '', apellido: parts.slice(1).join(' ') || '',
              telefono: '', cedula: '', rol: 'abogado', activo: true,
              createdAt: serverTimestamp(), lastLogin: serverTimestamp(),
            });
          }
        } catch {}
        if (mounted.current) navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
      } else {
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => {
          if (mounted.current) navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
        }, 8000);
      }
    });

    return () => { mounted.current = false; unsub(); if (timer.current) clearTimeout(timer.current); };
  }, [navigation]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#1A237E" />
      <Text style={styles.text}>Verificando sesión...</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F5F5' },
  text: { marginTop: 16, fontSize: 16, color: '#757575' },
});

export default AuthLoader;