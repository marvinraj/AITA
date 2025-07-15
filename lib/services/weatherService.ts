interface WeatherData {
  temperature: number;
  description: string;
  icon: string;
  humidity: number;
  windSpeed: number;
  city: string;
  country: string;
}

interface WeatherAPIResponse {
  location: {
    name: string;
    region: string;
    country: string;
    lat: number;
    lon: number;
  };
  current: {
    temp_c: number;
    condition: {
      text: string;
      icon: string;
      code: number;
    };
    humidity: number;
    wind_kph: number;
    wind_mph: number;
    feelslike_c: number;
    is_day: number;
  };
}

class WeatherService {
  private readonly API_KEY = process.env.EXPO_PUBLIC_WEATHERAPI_KEY;
  private readonly BASE_URL = 'http://api.weatherapi.com/v1';

  async getWeatherByCity(city: string): Promise<WeatherData | null> {
    try {
      if (!this.API_KEY || this.API_KEY === 'YOUR_WEATHERAPI_KEY') {
        console.error('WeatherAPI key not configured. Please set EXPO_PUBLIC_WEATHERAPI_KEY in .env file');
        return null;
      }

      const response = await fetch(
        `${this.BASE_URL}/current.json?key=${this.API_KEY}&q=${encodeURIComponent(city)}`
      );

      if (!response.ok) {
        if (response.status === 401) {
          console.error('WeatherAPI authentication failed. Please check your API key.');
        } else {
          console.error('WeatherAPI error:', response.status, response.statusText);
        }
        return null;
      }

      const data: WeatherAPIResponse = await response.json();
      
      return {
        temperature: Math.round(data.current.temp_c),
        description: data.current.condition.text,
        icon: data.current.condition.code.toString(),
        humidity: data.current.humidity,
        windSpeed: data.current.wind_kph,
        city: data.location.name,
        country: data.location.country
      };
    } catch (error) {
      console.error('Error fetching weather data:', error);
      return null;
    }
  }

  async getWeatherByCoordinates(lat: number, lon: number): Promise<WeatherData | null> {
    try {
      if (!this.API_KEY || this.API_KEY === 'YOUR_WEATHERAPI_KEY') {
        console.error('WeatherAPI key not configured. Please set EXPO_PUBLIC_WEATHERAPI_KEY in .env file');
        return null;
      }

      const response = await fetch(
        `${this.BASE_URL}/current.json?key=${this.API_KEY}&q=${lat},${lon}`
      );

      if (!response.ok) {
        if (response.status === 401) {
          console.error('WeatherAPI authentication failed. Please check your API key.');
        } else {
          console.error('WeatherAPI error:', response.status, response.statusText);
        }
        return null;
      }

      const data: WeatherAPIResponse = await response.json();
      
      return {
        temperature: Math.round(data.current.temp_c),
        description: data.current.condition.text,
        icon: data.current.condition.code.toString(),
        humidity: data.current.humidity,
        windSpeed: data.current.wind_kph,
        city: data.location.name,
        country: data.location.country
      };
    } catch (error) {
      console.error('Error fetching weather data:', error);
      return null;
    }
  }

  // Get weather emoji based on WeatherAPI condition code
  getWeatherEmoji(conditionCode: string): string {
    const code = parseInt(conditionCode);
    
    // WeatherAPI condition codes mapping
    const iconMap: { [key: number]: string } = {
      1000: '☀️', // Sunny
      1003: '⛅', // Partly cloudy
      1006: '☁️', // Cloudy
      1009: '☁️', // Overcast
      1030: '🌫️', // Mist
      1063: '�️', // Patchy rain possible
      1066: '🌨️', // Patchy snow possible
      1069: '🌧️', // Patchy sleet possible
      1072: '🌧️', // Patchy freezing drizzle possible
      1087: '⛈️', // Thundery outbreaks possible
      1114: '🌨️', // Blowing snow
      1117: '🌨️', // Blizzard
      1135: '🌫️', // Fog
      1147: '🌫️', // Freezing fog
      1150: '🌧️', // Patchy light drizzle
      1153: '🌧️', // Light drizzle
      1168: '🌧️', // Freezing drizzle
      1171: '🌧️', // Heavy freezing drizzle
      1180: '🌦️', // Patchy light rain
      1183: '🌧️', // Light rain
      1186: '🌧️', // Moderate rain at times
      1189: '🌧️', // Moderate rain
      1192: '🌧️', // Heavy rain at times
      1195: '🌧️', // Heavy rain
      1198: '🌧️', // Light freezing rain
      1201: '🌧️', // Moderate or heavy freezing rain
      1204: '🌧️', // Light sleet
      1207: '🌧️', // Moderate or heavy sleet
      1210: '🌨️', // Patchy light snow
      1213: '🌨️', // Light snow
      1216: '�️', // Patchy moderate snow
      1219: '🌨️', // Moderate snow
      1222: '🌨️', // Patchy heavy snow
      1225: '🌨️', // Heavy snow
      1237: '🌧️', // Ice pellets
      1240: '🌦️', // Light rain shower
      1243: '🌧️', // Moderate or heavy rain shower
      1246: '🌧️', // Torrential rain shower
      1249: '🌧️', // Light sleet showers
      1252: '🌧️', // Moderate or heavy sleet showers
      1255: '🌨️', // Light snow showers
      1258: '🌨️', // Moderate or heavy snow showers
      1261: '🌧️', // Light showers of ice pellets
      1264: '�️', // Moderate or heavy showers of ice pellets
      1273: '⛈️', // Patchy light rain with thunder
      1276: '⛈️', // Moderate or heavy rain with thunder
      1279: '⛈️', // Patchy light snow with thunder
      1282: '⛈️', // Moderate or heavy snow with thunder
    };
    
    return iconMap[code] || '🌤️';
  }

  // Format weather display string
  formatWeatherDisplay(weather: WeatherData): string {
    const emoji = this.getWeatherEmoji(weather.icon);
    return `${emoji} ${weather.temperature}°C, ${weather.description}`;
  }
}

export const weatherService = new WeatherService();
export type { WeatherData };

