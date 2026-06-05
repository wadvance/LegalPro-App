import React from 'react';
import { StatusBar, LogBox } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';

LogBox.ignoreLogs(['Setting a timer', 'AsyncStorage', 'firebase']);

export default function App() {
  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#1A237E" />
      <AppNavigator />
    </>
  );
}
