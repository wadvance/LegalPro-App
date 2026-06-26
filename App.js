import React, { useRef, useEffect, useCallback } from 'react';
import { StatusBar, LogBox, View, Text, StyleSheet, AppState, Keyboard } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import AppNavigator from './src/navigation/AppNavigator';
import { logoutUser, getCurrentUser } from './firebase/auth';

const IDLE_TIMEOUT = 10 * 60 * 1000; // 10 minutos de inactividad

function IdleTimerProvider({ children, navigationRef }) {
  const timerRef = useRef(null);
  const lastActivityRef = useRef(Date.now());
  const appStateRef = useRef(AppState.currentState);

  const handleLogout = useCallback(async () => {
    try {
      const session = await getCurrentUser();
      if (session) {
        await logoutUser();
        navigationRef.current?.reset({ index: 0, routes: [{ name: 'Login' }] });
      }
    } catch {}
  }, [navigationRef]);

  const resetTimer = useCallback(() => {
    lastActivityRef.current = Date.now();
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(handleLogout, IDLE_TIMEOUT);
  }, [handleLogout]);

  useEffect(() => {
    resetTimer();

    const handleAppState = (nextState) => {
      if (appStateRef.current.match(/inactive|background/) && nextState === 'active') {
        const elapsed = Date.now() - lastActivityRef.current;
        if (elapsed >= IDLE_TIMEOUT) {
          handleLogout();
        } else {
          resetTimer();
        }
      }
      appStateRef.current = nextState;
    };
    const appStateSub = AppState.addEventListener('change', handleAppState);

    const keyboardSub = Keyboard.addListener('keyboardDidShow', resetTimer);

    // Safety check: cada 30s verifica si se excedió el tiempo límite
    const safetyInterval = setInterval(() => {
      const elapsed = Date.now() - lastActivityRef.current;
      if (elapsed >= IDLE_TIMEOUT) {
        handleLogout();
      }
    }, 30000);

    // Detectores de actividad en web
    let cleanupDomEvents;
    if (typeof document !== 'undefined') {
      const events = ['mousedown', 'keydown', 'touchstart', 'pointerdown'];
      const onActivity = () => resetTimer();
      events.forEach((e) => document.addEventListener(e, onActivity));
      cleanupDomEvents = () => events.forEach((e) => document.removeEventListener(e, onActivity));
    }

    return () => {
      clearInterval(safetyInterval);
      appStateSub?.remove();
      keyboardSub?.remove();
      if (cleanupDomEvents) cleanupDomEvents();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [resetTimer, handleLogout]);

  return (
    <View
      style={{ flex: 1 }}
      onStartShouldSetResponderCapture={() => { resetTimer(); return false; }}
      onMoveShouldSetResponderCapture={() => { resetTimer(); return false; }}
    >
      {children}
    </View>
  );
}

LogBox.ignoreLogs(['Setting a timer', 'AsyncStorage', 'firebase']);

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Error al cargar la aplicación</Text>
          <Text style={styles.errorMessage}>{this.state.error?.message}</Text>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F5F5', padding: 20 },
  errorTitle: { fontSize: 18, fontWeight: 'bold', color: '#D32F2F', marginBottom: 10 },
  errorMessage: { fontSize: 14, color: '#333', textAlign: 'center' },
});

function AppContent({ navigationRef }) {
  const { isDark } = useTheme();
  return (
    <IdleTimerProvider navigationRef={navigationRef}>
      <StatusBar barStyle="light-content" backgroundColor="#1A237E" />
      <AppNavigator navigationRef={navigationRef} />
    </IdleTimerProvider>
  );
}

export default function App() {
  const navigationRef = useRef(null);
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ErrorBoundary>
        <ThemeProvider>
          <AppContent navigationRef={navigationRef} />
        </ThemeProvider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}
