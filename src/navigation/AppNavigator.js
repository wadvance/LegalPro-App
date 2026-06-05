import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SIZES } from '../utils/theme';

import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import ClientsScreen from '../screens/ClientsScreen';
import CompaniesScreen from '../screens/CompaniesScreen';
import ExpedientesScreen from '../screens/ExpedientesScreen';
import AppointmentsScreen from '../screens/AppointmentsScreen';
import PaymentsScreen from '../screens/PaymentsScreen';
import ReportsScreen from '../screens/ReportsScreen';
import LegalDictionaryScreen from '../screens/LegalDictionaryScreen';
import LegalCalculatorsScreen from '../screens/LegalCalculatorsScreen';
import CaseTrackingScreen from '../screens/CaseTrackingScreen';
import ChatbotScreen from '../screens/ChatbotScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const TabIcon = ({ icon, label, focused }) => (
  <View style={tabStyles.iconContainer}>
    <Text style={[tabStyles.icon, focused && tabStyles.iconFocused]}>{icon}</Text>
    <Text style={[tabStyles.label, focused && tabStyles.labelFocused]}>{label}</Text>
  </View>
);

const tabStyles = StyleSheet.create({
  iconContainer: { alignItems: 'center', justifyContent: 'center' },
  icon: { fontSize: 22, marginBottom: 2 },
  iconFocused: { fontSize: 24 },
  label: { fontSize: 10, color: COLORS.tabInactive, fontWeight: '500' },
  labelFocused: { color: COLORS.tabActive, fontWeight: '700' },
});

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopWidth: 0,
          height: 65,
          paddingBottom: 8,
          paddingTop: 8,
          elevation: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.1,
          shadowRadius: 6,
        },
        tabBarShowLabel: false,
        tabBarActiveTintColor: COLORS.tabActive,
        tabBarInactiveTintColor: COLORS.tabInactive,
      }}
    >
      <Tab.Screen
        name="Inicio"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon="🏠" label="Inicio" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Clients"
        component={ClientsScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon="👥" label="Clientes" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Expedientes"
        component={ExpedientesScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon="📁" label="Exp." focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Appointments"
        component={AppointmentsScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon="📅" label="Citas" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Payments"
        component={PaymentsScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon="💰" label="Cobros" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          cardStyle: { backgroundColor: COLORS.background },
        }}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Main" component={MainTabs} />
        <Stack.Screen name="Companies" component={CompaniesScreen} />
        <Stack.Screen name="Reports" component={ReportsScreen} />
        <Stack.Screen name="Laws" component={LegalDictionaryScreen} />
        <Stack.Screen name="Calculators" component={LegalCalculatorsScreen} />
        <Stack.Screen name="CaseTracking" component={CaseTrackingScreen} />
        <Stack.Screen name="Chat" component={ChatbotScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
