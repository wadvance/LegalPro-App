import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { onAuthChange, waitForAuthReady } from '../../firebase/auth';

const AuthLoader = ({ navigation }) => {
  const mounted = useRef(true);
  const unsubRef = useRef(null);

  useEffect(() => {
    waitForAuthReady().then(() => {
      if (!mounted.current) return;
      unsubRef.current = onAuthChange((user) => {
        if (!mounted.current) return;
        if (user) {
          navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
        } else {
          navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
        }
      });
    });

    return () => {
      mounted.current = false;
      if (unsubRef.current) unsubRef.current();
    };
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