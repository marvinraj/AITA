import { Place } from './placesService';

export interface GooglePlacePhoto {
  photo_reference: string;
  height: number;
  width: number;
}

export interface GooglePlace {
  place_id: string;
  name: string;
  formatted_address: string;
  rating?: number;
  types: string[];
  photos?: GooglePlacePhoto[];
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  price_level?: number;
  user_ratings_total?: number;
}

export interface GooglePlacesResponse {
  results: GooglePlace[];
  status: string;
  next_page_token?: string;
}

export interface PlaceDetails {
  place_id: string;
  name: string;
  formatted_address: string;
  rating?: number;
  types: string[];
  photos?: GooglePlacePhoto[];
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  price_level?: number;
  user_ratings_total?: number;
  formatted_phone_number?: string;
  website?: string;
  opening_hours?: {
    open_now: boolean;
    weekday_text: string[];
  };
  reviews?: Array<{
    author_name: string;
    rating: number;
    text: string;
    time: number;
  }>;
}

class GooglePlacesService {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://maps.googleapis.com/maps/api/place';
  private apiEnabled = true; // Circuit breaker for API failures
  private photoCache = new Map<string, string | null>(); // Cache to prevent duplicate requests

  constructor() {
    this.apiKey = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY || '';
    if (!this.apiKey) {
      console.warn('⚠️ Google Places API key not found. Please set EXPO_PUBLIC_GOOGLE_PLACES_API_KEY in your environment variables.');
      console.warn('📸 Photo fetching will use fallback images only.');
    }
  }

  private isApiConfigured(): boolean {
    return this.apiKey.length > 10 && this.apiEnabled;
  }

  private getPhotoUrl(photoReference: string, maxWidth: number = 400): string {
    return `${this.baseUrl}/photo?maxwidth=${maxWidth}&photo_reference=${photoReference}&key=${this.apiKey}`;
  }

  private categorizePlace(types: string[]): string {
    // Map Google Places types to our categories
    const categoryMapping: { [key: string]: string } = {
      'restaurant': 'restaurant',
      'food': 'restaurant',
      'meal_takeaway': 'restaurant',
      'meal_delivery': 'restaurant',
      'cafe': 'restaurant',
      'bar': 'restaurant',
      'lodging': 'hotel',
      'tourist_attraction': 'attraction',
      'amusement_park': 'attraction',
      'aquarium': 'attraction',
      'art_gallery': 'attraction',
      'museum': 'attraction',
      'zoo': 'attraction',
      'park': 'attraction',
      'shopping_mall': 'shopping',
      'store': 'shopping',
      'clothing_store': 'shopping',
      'night_club': 'nightlife',
      'hospital': 'health',
      'gym': 'health',
      'spa': 'health',
      'airport': 'transport',
      'bus_station': 'transport',
      'subway_station': 'transport',
      'train_station': 'transport',
    };

    for (const type of types) {
      if (categoryMapping[type]) {
        return categoryMapping[type];
      }
    }
    return 'other';
  }

  private transformGooglePlaceToPlace(googlePlace: GooglePlace): Place {
    const primaryType = googlePlace.types[0] || 'establishment';
    const category = this.categorizePlace(googlePlace.types);
    
    return {
      id: googlePlace.place_id,
      name: googlePlace.name,
      address: googlePlace.formatted_address,
      rating: googlePlace.rating,
      type: primaryType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      category,
      imageUrl: googlePlace.photos?.[0] 
        ? this.getPhotoUrl(googlePlace.photos[0].photo_reference)
        : undefined,
      photos: googlePlace.photos?.map(photo => 
        this.getPhotoUrl(photo.photo_reference)
      ),
    };
  }

  async searchPlaces(query: string, location?: string): Promise<Place[]> {
    if (!this.apiKey) {
      console.warn('Google Places API key not configured, returning empty results');
      return [];
    }

    try {
      let url = `${this.baseUrl}/textsearch/json?query=${encodeURIComponent(query)}&key=${this.apiKey}`;
      
      if (location) {
        url += `&location=${encodeURIComponent(location)}&radius=50000`;
      }

      const response = await fetch(url);
      const data: GooglePlacesResponse = await response.json();

      if (data.status === 'OK') {
        return data.results.map(place => this.transformGooglePlaceToPlace(place));
      } else {
        console.error('Google Places API error:', data.status);
        return [];
      }
    } catch (error) {
      console.error('Error searching places:', error);
      return [];
    }
  }

  async searchNearbyPlaces(
    latitude: number, 
    longitude: number, 
    radius: number = 5000, 
    type?: string
  ): Promise<Place[]> {
    if (!this.apiKey) {
      console.warn('Google Places API key not configured, returning empty results');
      return [];
    }

    try {
      let url = `${this.baseUrl}/nearbysearch/json?location=${latitude},${longitude}&radius=${radius}&key=${this.apiKey}`;
      
      if (type) {
        url += `&type=${type}`;
      }

      const response = await fetch(url);
      const data: GooglePlacesResponse = await response.json();

      if (data.status === 'OK') {
        return data.results.map(place => this.transformGooglePlaceToPlace(place));
      } else {
        console.error('Google Places API error:', data.status);
        return [];
      }
    } catch (error) {
      console.error('Error searching nearby places:', error);
      return [];
    }
  }

  async getPlaceDetails(placeId: string): Promise<PlaceDetails | null> {
    if (!this.apiKey) {
      console.warn('Google Places API key not configured');
      return null;
    }

    try {
      const url = `${this.baseUrl}/details/json?place_id=${placeId}&fields=place_id,name,formatted_address,rating,types,photos,geometry,price_level,user_ratings_total,formatted_phone_number,website,opening_hours,reviews&key=${this.apiKey}`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK') {
        return data.result;
      } else {
        console.error('Google Places API error:', data.status);
        return null;
      }
    } catch (error) {
      console.error('Error getting place details:', error);
      return null;
    }
  }

  async searchGooglePlaces(query: string, location?: string): Promise<GooglePlace[]> {
    if (!this.apiKey) {
      console.warn('Google Places API key not configured, returning empty results');
      return [];
    }

    try {
      let url = `${this.baseUrl}/textsearch/json?query=${encodeURIComponent(query)}&key=${this.apiKey}`;
      
      if (location) {
        url += `&location=${encodeURIComponent(location)}&radius=50000`;
      }

      const response = await fetch(url);
      const data: GooglePlacesResponse = await response.json();

      if (data.status === 'OK') {
        return data.results;
      } else {
        console.error('Google Places API error:', data.status);
        return [];
      }
    } catch (error) {
      console.error('Error searching Google places:', error);
      return [];
    }
  }

  /**
   * Get cached photo URL without making API calls (for instant lookup)
   */
  getCachedPhoto(placeName: string, location: string): string | null {
    const cacheKey = `${placeName}_${location}`;
    return this.photoCache.get(cacheKey) || null;
  }

  /**
   * Check if a photo is already cached
   */
  isPhotoCached(placeName: string, location: string): boolean {
    const cacheKey = `${placeName}_${location}`;
    return this.photoCache.has(cacheKey);
  }

  /**
   * Search for a place and get its photo URL for recommendation cards
   */
  async searchPlacePhoto(placeName: string, location: string): Promise<string | null> {
    // Create cache key
    const cacheKey = `${placeName}_${location}`;
    
    // Check cache first
    if (this.photoCache.has(cacheKey)) {
      const cachedUrl = this.photoCache.get(cacheKey);
      console.log('📸 Using cached photo for:', placeName, cachedUrl ? '✓' : '✗');
      return cachedUrl || null;
    }

    // Check if API is configured and enabled
    if (!this.isApiConfigured()) {
      console.log('📸 Places API not configured or disabled, using fallback images');
      this.photoCache.set(cacheKey, null);
      return null;
    }

    try {
      const query = `${placeName} ${location}`;
      const searchUrl = `${this.baseUrl}/findplacefromtext/json?input=${encodeURIComponent(query)}&inputtype=textquery&fields=place_id,photos&key=${this.apiKey}`;
      
      console.log('🔍 Searching for place photo:', query);
      
      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
      
      const response = await fetch(searchUrl, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Handle REQUEST_DENIED status
      if (data.status === 'REQUEST_DENIED') {
        console.warn('❌ Google Places API: REQUEST_DENIED');
        console.warn('🔧 Check: 1) API key validity 2) Places API enabled 3) Billing enabled 4) Domain restrictions');
        this.apiEnabled = false; // Disable further API calls
        this.photoCache.set(cacheKey, null);
        return null;
      }
      
      // Handle quota exceeded
      if (data.status === 'OVER_QUERY_LIMIT') {
        console.warn('💰 Google Places API: OVER_QUERY_LIMIT - Daily quota exceeded');
        this.apiEnabled = false;
        this.photoCache.set(cacheKey, null);
        return null;
      }
      
      // Handle other error statuses
      if (data.status !== 'OK') {
        console.log(`⚠️ Places API returned status: ${data.status} for ${query}`);
        this.photoCache.set(cacheKey, null);
        return null;
      }
      
      if (data.candidates?.[0]?.photos?.[0]) {
        const photoReference = data.candidates[0].photos[0].photo_reference;
        const photoUrl = this.getPhotoUrl(photoReference);
        console.log('📸 Found real photo for:', placeName);
        this.photoCache.set(cacheKey, photoUrl);
        return photoUrl;
      }
      
      console.log('📷 No photo available for:', query);
      this.photoCache.set(cacheKey, null);
      return null;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.warn('⏰ Photo request timed out for:', placeName);
      } else {
        console.error('💥 Error searching for place photo:', error);
      }
      this.photoCache.set(cacheKey, null);
      return null;
    }
  }

  /**
   * Batch fetch photos for multiple recommendations with deduplication
   */
  async batchFetchPhotos(recommendations: Array<{name: string, location: string}>): Promise<{[key: string]: string | null}> {
    if (!this.isApiConfigured()) {
      console.log('📸 Places API not configured or disabled, using fallback images');
      const emptyMap: {[key: string]: string | null} = {};
      recommendations.forEach(rec => {
        emptyMap[`${rec.name}_${rec.location}`] = null;
      });
      return emptyMap;
    }

    // Deduplicate requests - remove duplicates based on name + location
    const uniqueRecommendations = recommendations.filter((rec, index, self) => 
      index === self.findIndex(r => r.name === rec.name && r.location === rec.location)
    );

    console.log(`📸 Batch fetching photos for ${uniqueRecommendations.length} unique places (${recommendations.length} total requests)`);

    // Separate already cached items from new requests
    const cachedResults: {[key: string]: string | null} = {};
    const uncachedItems: Array<{name: string, location: string}> = [];

    uniqueRecommendations.forEach(rec => {
      const cacheKey = `${rec.name}_${rec.location}`;
      if (this.photoCache.has(cacheKey)) {
        cachedResults[cacheKey] = this.photoCache.get(cacheKey) || null;
      } else {
        uncachedItems.push(rec);
      }
    });

    console.log(`📸 Found ${Object.keys(cachedResults).length} cached photos, fetching ${uncachedItems.length} new ones`);

    // If everything is cached, return immediately
    if (uncachedItems.length === 0) {
      const finalResults: {[key: string]: string | null} = {};
      recommendations.forEach(rec => {
        const key = `${rec.name}_${rec.location}`;
        finalResults[key] = cachedResults[key] || null;
      });
      return finalResults;
    }

    // Increase concurrency limit for faster processing but don't overwhelm the API
    const concurrencyLimit = 5;
    const newResults: {[key: string]: string | null} = {};

    for (let i = 0; i < uncachedItems.length; i += concurrencyLimit) {
      const batch = uncachedItems.slice(i, i + concurrencyLimit);
      
      const batchPromises = batch.map(async (rec) => {
        try {
          const photoUrl = await this.searchPlacePhoto(rec.name, rec.location);
          return {
            key: `${rec.name}_${rec.location}`,
            photoUrl
          };
        } catch (error) {
          console.error(`Error fetching photo for ${rec.name}:`, error);
          return {
            key: `${rec.name}_${rec.location}`,
            photoUrl: null
          };
        }
      });

      const batchResults = await Promise.allSettled(batchPromises);
      
      batchResults.forEach((result, batchIndex) => {
        const rec = batch[batchIndex];
        const key = `${rec.name}_${rec.location}`;
        
        if (result.status === 'fulfilled' && result.value) {
          newResults[result.value.key] = result.value.photoUrl;
        } else {
          newResults[key] = null;
        }
      });

      // If API was disabled during this batch, break early
      if (!this.apiEnabled) {
        console.log('🛑 API disabled during batch processing, stopping');
        break;
      }

      // Reduce delay between batches for faster loading
      if (i + concurrencyLimit < uncachedItems.length) {
        await new Promise(resolve => setTimeout(resolve, 50)); // Reduced from 100ms
      }
    }

    // Combine cached and new results
    const allResults = { ...cachedResults, ...newResults };

    // Fill in results for all original recommendations (including duplicates)
    const finalResults: {[key: string]: string | null} = {};
    recommendations.forEach(rec => {
      const key = `${rec.name}_${rec.location}`;
      finalResults[key] = allResults[key] || null;
    });

    const totalSuccessCount = Object.values(finalResults).filter(url => url !== null).length;
    console.log(`📸 Batch complete: ${totalSuccessCount}/${recommendations.length} photos available (${Object.keys(newResults).filter(k => newResults[k]).length} newly fetched)`);

    return finalResults;
  }
}

export const googlePlacesService = new GooglePlacesService();
