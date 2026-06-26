import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { getCurrentUser } from '../../firebase/auth';

const AuthLoader = ({ navigation }) => {
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      current: true
    };

    const run = async () => {
      if (!checkAuth.current) return;
      try {
        const user = await getCurrentUser();
        if (!checkAuth.current) return;
        if (user) {
          navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
        } else {
          navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
        }
      } catch {
        if (checkAuth.current) {
          navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
        }
      } finally {
        if (checkAuth.current) setChecked(true);
      }
    };

    run();
    return () => { checkAuth.current = false; };
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