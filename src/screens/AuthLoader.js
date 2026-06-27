import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { getCurrentUser, getGoogleRedirectResult } from '../../firebase/auth';

const AuthLoader = ({ navigation }) => {
  const mounted = useRef(true);

  useEffect(() => {
    const run = async () => {
      try {
        const redirectResult = await getGoogleRedirectResult();
        if (!mounted.current) return;
        if (redirectResult && redirectResult.success) {
          navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
          return;
        }
      } catch {}

      try {
        const user = await getCurrentUser();
        if (!mounted.current) return;
        if (user) {
          navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
        } else {
          navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
        }
      } catch {
        if (mounted.current) {
          navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
        }
      }
    };

    run();
    return () => { mounted.current = false; };
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