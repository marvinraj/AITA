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

  constructor() {
    this.apiKey = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY || '';
    if (!this.apiKey) {
      console.warn('Google Places API key not found. Please set EXPO_PUBLIC_GOOGLE_PLACES_API_KEY in your environment variables.');
    }
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
}

export const googlePlacesService = new GooglePlacesService();
