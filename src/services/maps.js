import { Linking, Alert, Platform } from 'react-native';

const openURL = (url) => {
  if (Platform.OS === 'web') {
    window.open(url, '_blank');
  } else {
    Linking.openURL(url).catch(() =>
      Alert.alert('Error', 'No se pudo abrir la aplicación')
    );
  }
};

export const openGoogleMaps = (destination, origin = null) => {
  const dest = encodeURIComponent(destination);
  let url = `https://www.google.com/maps/dir/?api=1&destination=${dest}`;
  if (origin) {
    const orig = encodeURIComponent(origin);
    url += `&origin=${orig}`;
  }
  openURL(url);
};

export const openWaze = (destination) => {
  const encoded = encodeURIComponent(destination);
  const url = `https://waze.com/ul?q=${encoded}&navigate=yes`;
  openURL(url);
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
