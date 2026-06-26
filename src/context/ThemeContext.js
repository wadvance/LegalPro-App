import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const THEME_KEY = '@arauz_theme';

export const lightColors = {
  primary: '#1A237E',
  primaryLight: '#534BAE',
  primaryDark: '#000051',
  secondary: '#C5A028',
  secondaryLight: '#F9D14A',
  accent: '#D32F2F',
  background: '#F5F5F5',
  surface: '#FFFFFF',
  text: '#212121',
  textSecondary: '#757575',
  textLight: '#FFFFFF',
  border: '#E0E0E0',
  error: '#D32F2F',
  success: '#388E3C',
  warning: '#F57C00',
  info: '#1976D2',
  disabled: '#BDBDBD',
  cardShadow: '#00000020',
  headerBg: '#1A237E',
  tabActive: '#C5A028',
  tabInactive: '#9E9E9E',
  gradientStart: '#1A237E',
  gradientEnd: '#534BAE',
  cardBg: '#FFFFFF',
  cardBorder: '#E8E8E8',
  overlay: 'rgba(0,0,0,0.05)',
};

export const darkColors = {
  primary: '#5C6BC0',
  primaryLight: '#8E99D6',
  primaryDark: '#1A237E',
  secondary: '#F9D14A',
  secondaryLight: '#FFE082',
  accent: '#EF5350',
  background: '#121212',
  surface: '#1E1E1E',
  text: '#E0E0E0',
  textSecondary: '#AAAAAA',
  textLight: '#FFFFFF',
  border: '#333333',
  error: '#EF5350',
  success: '#66BB6A',
  warning: '#FFA726',
  info: '#42A5F5',
  disabled: '#666666',
  cardShadow: '#00000080',
  headerBg: '#1A1A2E',
  tabActive: '#F9D14A',
  tabInactive: '#666666',
  gradientStart: '#1A1A2E',
  gradientEnd: '#16213E',
  cardBg: '#2A2A2A',
  cardBorder: '#3A3A3A',
  overlay: 'rgba(255,255,255,0.05)',
};

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY).then((value) => {
      setIsDark(value === 'dark');
      setLoaded(true);
    }).catch(() => setLoaded(true));
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    AsyncStorage.setItem(THEME_KEY, next ? 'dark' : 'light').catch(() => {});
  };

  const colors = isDark ? darkColors : lightColors;

  if (!loaded) return null;

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);

export default ThemeContext;
