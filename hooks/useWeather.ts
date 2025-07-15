import { useEffect, useState } from 'react';
import { WeatherData, weatherService } from '../lib/services/weatherService';

export const useWeather = (destination?: string) => {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWeather = async (city: string) => {
    if (!city) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const weather = await weatherService.getWeatherByCity(city);
      setWeatherData(weather);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch weather';
      setError(errorMessage);
      setWeatherData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchWeatherByCoords = async (lat: number, lon: number) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const weather = await weatherService.getWeatherByCoordinates(lat, lon);
      setWeatherData(weather);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch weather';
      setError(errorMessage);
      setWeatherData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshWeather = () => {
    if (destination) {
      fetchWeather(destination);
    }
  };

  // Auto-fetch weather when destination changes
  useEffect(() => {
    if (destination) {
      fetchWeather(destination);
    }
  }, [destination]);

  return {
    weatherData,
    isLoading,
    error,
    fetchWeather,
    fetchWeatherByCoords,
    refreshWeather
  };
};
