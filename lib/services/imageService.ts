// Image service for fetching destination-relevant images
const UNSPLASH_ACCESS_KEY = '9st2FVyfTHmGMusDgJ6KI7XBgVigKi6PlgOJTGSp4TM';

interface UnsplashImage {
  id: string;
  urls: {
    small: string;
    regular: string;
    full: string;
  };
  alt_description?: string;
  description?: string;
}

interface DestinationImage {
  url: string;
  alt: string;
  id: string;
}

class ImageService {
  private cache = new Map<string, DestinationImage>();
  private readonly CACHE_KEY = 'unsplash_destination_images';
  private readonly CACHE_EXPIRY_HOURS = 24; // Cache for 24 hours

  constructor() {
    this.loadCacheFromStorage();
  }

  // Load cache from AsyncStorage on initialization
  private async loadCacheFromStorage() {
    try {
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      const cachedData = await AsyncStorage.getItem(this.CACHE_KEY);
      if (cachedData) {
        const parsed = JSON.parse(cachedData);
        // Check if cache is still valid (not expired)
        const now = Date.now();
        Object.entries(parsed).forEach(([key, value]: [string, any]) => {
          if (value.timestamp && now - value.timestamp < this.CACHE_EXPIRY_HOURS * 60 * 60 * 1000) {
            this.cache.set(key, value.image);
          }
        });
      }
    } catch (error) {
      console.log('Could not load image cache from storage:', error);
    }
  }

  // Save cache to AsyncStorage
  private async saveCacheToStorage() {
    try {
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      const cacheData: { [key: string]: { image: DestinationImage; timestamp: number } } = {};
      
      this.cache.forEach((image, key) => {
        cacheData[key] = {
          image,
          timestamp: Date.now()
        };
      });
      
      await AsyncStorage.setItem(this.CACHE_KEY, JSON.stringify(cacheData));
    } catch (error) {
      console.log('Could not save image cache to storage:', error);
    }
  }

  // Fallback images for different types of destinations
  private fallbackImages = {
    beach: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=600&fit=crop',
    city: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800&h=600&fit=crop',
    mountain: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop',
    forest: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=600&fit=crop',
    desert: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=800&h=600&fit=crop',
    lake: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop',
    default: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&h=600&fit=crop'
  };

  async getDestinationImage(destination: string): Promise<DestinationImage> {
    if (!destination) {
      return this.getFallbackImage('default');
    }

    // Check cache first
    const cacheKey = destination.toLowerCase();
    if (this.cache.has(cacheKey)) {
      console.log('Using cached image for:', destination);
      return this.cache.get(cacheKey)!;
    }

    try {
      // Try to fetch from Unsplash
      console.log('Fetching new image from Unsplash for:', destination);
      const image = await this.fetchFromUnsplash(destination);
      this.cache.set(cacheKey, image);
      
      // Save to persistent storage
      this.saveCacheToStorage();
      
      return image;
    } catch (error) {
      console.log('Using fallback image for destination:', destination);
      // Return appropriate fallback based on destination keywords
      const fallbackImage = this.getFallbackImage(this.getDestinationType(destination));
      
      // Cache the fallback too to avoid repeated API calls
      this.cache.set(cacheKey, fallbackImage);
      this.saveCacheToStorage();
      
      return fallbackImage;
    }
  }

  private async fetchFromUnsplash(destination: string): Promise<DestinationImage> {
    try {
      const response = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(destination + ' travel destination')}&per_page=1&orientation=landscape`,
        {
          headers: {
            'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Unsplash API error');
      }

      const data = await response.json();
      if (data.results && data.results.length > 0) {
        const photo = data.results[0] as UnsplashImage;
        return {
          url: photo.urls.regular,
          alt: photo.alt_description || photo.description || `${destination} travel destination`,
          id: photo.id
        };
      }

      throw new Error('No images found');
    } catch (error) {
      console.error('Unsplash API error:', error);
      throw error;
    }
  }

  private getDestinationType(destination: string): keyof typeof this.fallbackImages {
    const dest = destination.toLowerCase();
    
    if (dest.includes('beach') || dest.includes('coast') || dest.includes('island') || 
        dest.includes('maldives') || dest.includes('bali') || dest.includes('hawaii')) {
      return 'beach';
    }
    
    if (dest.includes('mountain') || dest.includes('alps') || dest.includes('himalaya') || 
        dest.includes('everest') || dest.includes('peak') || dest.includes('summit')) {
      return 'mountain';
    }
    
    if (dest.includes('forest') || dest.includes('jungle') || dest.includes('amazon') || 
        dest.includes('rainforest') || dest.includes('woodland')) {
      return 'forest';
    }
    
    if (dest.includes('desert') || dest.includes('sahara') || dest.includes('sand') || 
        dest.includes('dune') || dest.includes('dubai') || dest.includes('morocco')) {
      return 'desert';
    }
    
    if (dest.includes('lake') || dest.includes('river') || dest.includes('waterfall') || 
        dest.includes('niagara') || dest.includes('victoria falls')) {
      return 'lake';
    }
    
    if (dest.includes('city') || dest.includes('urban') || dest.includes('tokyo') || 
        dest.includes('new york') || dest.includes('london') || dest.includes('paris')) {
      return 'city';
    }
    
    return 'default';
  }

  private getFallbackImage(type: keyof typeof this.fallbackImages): DestinationImage {
    return {
      url: this.fallbackImages[type],
      alt: `${type} destination`,
      id: `fallback-${type}`
    };
  }

  // Method to preload images for better performance
  async preloadImage(url: string): Promise<boolean> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = url;
    });
  }

  // Clear cache if needed
  async clearCache(): Promise<void> {
    this.cache.clear();
    try {
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      await AsyncStorage.removeItem(this.CACHE_KEY);
      console.log('Image cache cleared');
    } catch (error) {
      console.log('Could not clear image cache from storage:', error);
    }
  }

  // Get cache statistics
  getCacheStats(): { size: number; destinations: string[] } {
    return {
      size: this.cache.size,
      destinations: Array.from(this.cache.keys())
    };
  }

  // Check if destination is cached
  isCached(destination: string): boolean {
    return this.cache.has(destination.toLowerCase());
  }
}

export const imageService = new ImageService();
export type { DestinationImage };

