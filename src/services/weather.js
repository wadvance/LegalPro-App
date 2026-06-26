const API_BASE = 'https://api.open-meteo.com/v1/forecast';

const PANAMA_CITY = { lat: 8.9825, lon: -79.5199 };

const WEATHER_DESCRIPTIONS = {
  0: 'Cielo despejado', 1: 'Mayormente despejado', 2: 'Parcialmente nublado',
  3: 'Nublado', 45: 'Niebla', 48: 'Niebla con escarcha',
  51: 'Llovizna ligera', 53: 'Llovizna moderada', 55: 'Llovizna densa',
  56: 'Llovizna helada ligera', 57: 'Llovizna helada densa',
  61: 'Lluvia ligera', 63: 'Lluvia moderada', 65: 'Lluvia fuerte',
  66: 'Lluvia helada ligera', 67: 'Lluvia helada fuerte',
  71: 'Nevada ligera', 73: 'Nevada moderada', 75: 'Nevada fuerte',
  77: 'Granos de nieve', 80: 'Chubascos ligeros', 81: 'Chubascos moderados',
  82: 'Chubascos violentos', 85: 'Chubascos de nieve ligeros',
  86: 'Chubascos de nieve fuertes', 95: 'Tormenta eléctrica',
  96: 'Tormenta con granizo ligero', 99: 'Tormenta con granizo fuerte',
};

const WEATHER_ICONS = {
  0: '☀️', 1: '🌤️', 2: '⛅', 3: '☁️', 45: '🌫️', 48: '🌫️',
  51: '🌦️', 53: '🌦️', 55: '🌧️', 56: '🌧️', 57: '🌧️',
  61: '🌧️', 63: '🌧️', 65: '🌧️', 66: '🌧️', 67: '🌧️',
  71: '🌨️', 73: '🌨️', 75: '🌨️', 77: '🌨️',
  80: '🌦️', 81: '🌧️', 82: '🌧️',
  85: '🌨️', 86: '🌨️',
  95: '⛈️', 96: '⛈️', 99: '⛈️',
};

export const getWeatherDescription = (code) => WEATHER_DESCRIPTIONS[code] || 'Desconocido';
export const getWeatherIcon = (code) => WEATHER_ICONS[code] || '🌡️';

export const fetchCurrentWeather = async (lat = PANAMA_CITY.lat, lon = PANAMA_CITY.lon) => {
  try {
    const params = new URLSearchParams({
      latitude: lat,
      longitude: lon,
      current: 'temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m',
      timezone: 'auto',
    });
    const res = await fetch(`${API_BASE}?${params}`);
    const data = await res.json();
    if (!data.current) throw new Error('No weather data');

    const c = data.current;
    return {
      temp: Math.round(c.temperature_2m),
      feelsLike: Math.round(c.apparent_temperature),
      humidity: c.relative_humidity_2m,
      windSpeed: c.wind_speed_10m,
      code: c.weather_code,
      description: getWeatherDescription(c.weather_code),
      icon: getWeatherIcon(c.weather_code),
      location: 'Ciudad de Panamá',
    };
  } catch {
    return null;
  }
};
