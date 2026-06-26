import { Linking, Alert, Platform } from 'react-native';

export const openGoogleMaps = (destination) => {
  const encoded = encodeURIComponent(destination);
  const url = `https://www.google.com/maps/dir/?api=1&destination=${encoded}`;
  Linking.openURL(url).catch(() =>
    Alert.alert('Error', 'No se pudo abrir Google Maps')
  );
};

export const openWaze = (destination) => {
  const encoded = encodeURIComponent(destination);
  const url = `https://waze.com/ul?q=${encoded}&navigate=yes`;
  Linking.openURL(url).catch(() =>
    Alert.alert('Error', 'No se pudo abrir Waze')
  );
};

export const navigateToAddress = (address, label) => {
  if (!address || address.trim() === '') {
    Alert.alert('Sin dirección', 'No hay una dirección registrada');
    return;
  }
  Alert.alert(
    'Navegar a',
    label || address,
    [
      { text: 'Google Maps', onPress: () => openGoogleMaps(address) },
      { text: 'Waze', onPress: () => openWaze(address) },
      { text: 'Cancelar', style: 'cancel' },
    ]
  );
};
