export interface Place {
  id: string;
  name: string;
  address: string;
  rating?: number;
  type: string;
  description?: string;
  category?: string; // Suggested category based on place type
  imageUrl?: string; // Photo URL from Google Places API
  photos?: string[]; // Multiple photo URLs if available
}

// Extended mock data with more variety and suggested categories
const mockPlaces: Place[] = [
  // Restaurants
  { 
    id: '1', 
    name: "Trattoria al Moro", 
    address: "Vicolo delle Bollette, 13, Rome", 
    rating: 4.3, 
    type: "Italian Restaurant",
    description: "Traditional Roman cuisine since 1929",
    category: "restaurant",
    imageUrl: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400"
  },
  { 
    id: '2', 
    name: "Da Enzo al 29", 
    address: "Via dei Vascellari, 29, Rome", 
    rating: 4.6, 
    type: "Trattoria",
    description: "Authentic local dishes in Trastevere",
    category: "restaurant",
    imageUrl: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400"
  },
  { 
    id: '3', 
    name: "Checchino dal 1887", 
    address: "Via di Monte Testaccio, 30, Rome", 
    rating: 4.4, 
    type: "Fine Dining",
    description: "Historic restaurant specializing in offal",
    category: "restaurant",
    imageUrl: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400"
  },

  // Attractions
  { 
    id: '4', 
    name: 'Colosseum', 
    address: 'Piazza del Colosseo, Rome', 
    rating: 4.6, 
    type: 'Historical Site',
    description: "Ancient amphitheater and iconic symbol of Rome",
    category: "attraction",
    imageUrl: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=400"
  },
  { 
    id: '5', 
    name: 'Vatican Museums', 
    address: 'Vatican City', 
    rating: 4.7, 
    type: 'Museum',
    description: "Home to the Sistine Chapel and papal collections",
    category: "attraction",
    imageUrl: "https://images.unsplash.com/photo-1531572753322-ad063cecc140?w=400"
  },
  { 
    id: '6', 
    name: 'Trevi Fountain', 
    address: 'Piazza di Trevi, Rome', 
    rating: 4.5, 
    type: 'Fountain',
    description: "Baroque fountain where wishes come true",
    category: "attraction",
    imageUrl: "https://images.unsplash.com/photo-1525874684015-58379d421a52?w=400"
  },
  { 
    id: '7', 
    name: 'Pantheon', 
    address: 'Piazza della Rotonda, Rome', 
    rating: 4.6, 
    type: 'Historical Site',
    description: "Best preserved Roman building with famous dome",
    category: "attraction"
  },
  { 
    id: '8', 
    name: 'Spanish Steps', 
    address: 'Piazza di Spagna, Rome', 
    rating: 4.3, 
    type: 'Landmark',
    description: "Famous stairway connecting Piazza di Spagna",
    category: "attraction"
  },

  // Hotels
  { 
    id: '9', 
    name: "Hotel Artemide", 
    address: "Via Nazionale, 22, Rome", 
    rating: 4.2, 
    type: "4-Star Hotel",
    description: "Elegant hotel near Termini Station",
    category: "hotel"
  },
  { 
    id: '10', 
    name: "The First Roma Arte", 
    address: "Via del Vantaggio, 14, Rome", 
    rating: 4.5, 
    type: "Boutique Hotel",
    description: "Modern luxury near Spanish Steps",
    category: "hotel"
  },

  // Activities
  { 
    id: '11', 
    name: "Roman Food Tour", 
    address: "Campo de' Fiori, Rome", 
    rating: 4.8, 
    type: "Food Tour",
    description: "Guided culinary experience through Rome",
    category: "activity"
  },
  { 
    id: '12', 
    name: "Vespa Tour Rome", 
    address: "Via dei Cappuccini, 9, Rome", 
    rating: 4.7, 
    type: "Sightseeing Tour",
    description: "Explore Rome on a classic Vespa scooter",
    category: "activity"
  },
  { 
    id: '13', 
    name: "Roman Cooking Class", 
    address: "Via dei Cappuccini, 15, Rome", 
    rating: 4.9, 
    type: "Cooking Experience",
    description: "Learn to make authentic Roman pasta",
    category: "activity"
  },

  // Transport
  { 
    id: '14', 
    name: "Leonardo Express", 
    address: "Fiumicino Airport to Termini", 
    rating: 4.1, 
    type: "Airport Train",
    description: "Direct train from airport to city center",
    category: "transport"
  },
  { 
    id: '15', 
    name: "Rome Metro Day Pass", 
    address: "Rome Public Transport", 
    rating: 4.0, 
    type: "Public Transport",
    description: "Unlimited access to buses, metro, and trams",
    category: "transport"
  },

  // Shopping
  { 
    id: '16', 
    name: "Via del Corso", 
    address: "Via del Corso, Rome", 
    rating: 4.2, 
    type: "Shopping Street",
    description: "Main shopping street with international brands",
    category: "activity"
  },
  { 
    id: '17', 
    name: "Campo de' Fiori Market", 
    address: "Piazza Campo de' Fiori, Rome", 
    rating: 4.4, 
    type: "Local Market",
    description: "Historic market with fresh produce and flowers",
    category: "activity"
  },
];

class PlacesService {
  // Search places based on query
  async searchPlaces(query: string, limit: number = 10): Promise<Place[]> {
    const GOOGLE_PLACES_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY;
    
    if (!GOOGLE_PLACES_API_KEY) {
      console.warn('Google Places API key not found, using mock data');
      return this.searchPlacesMock(query, limit);
    }
    
    if (!query.trim()) {
      return [];
    }

    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${GOOGLE_PLACES_API_KEY}`
      );
      
      if (!response.ok) {
        throw new Error(`Google Places API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.status === 'REQUEST_DENIED') {
        throw new Error(`API request denied: ${data.error_message}`);
      }
      
      if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
        console.warn(`Google Places API status: ${data.status}`, data.error_message);
      }
      
      console.log(`Google Places API returned ${data.results?.length || 0} results for query: "${query}"`);
      
      if (!data.results || data.results.length === 0) {
        return [];
      }
      
      return data.results.slice(0, limit).map((place: any) => {
        const photoUrls = place.photos?.slice(0, 3).map((photo: any) => 
          `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photo.photo_reference}&key=${GOOGLE_PLACES_API_KEY}`
        ) || [];
        
        console.log(`Place: ${place.name}, Photos available: ${place.photos?.length || 0}, Photo URLs generated: ${photoUrls.length}`);
        
        return {
          id: place.place_id || `place_${Date.now()}_${Math.random()}`,
          name: place.name || 'Unknown Place',
          address: place.formatted_address || 'Address not available',
          rating: place.rating || 0,
          type: place.types?.[0]?.replace(/_/g, ' ') || 'place',
          description: `${place.name || 'Unknown Place'} - ${place.types?.[0]?.replace(/_/g, ' ') || 'place'}`,
          category: this.mapGoogleTypeToCategory(place.types?.[0] || 'establishment'),
          imageUrl: place.photos?.[0] ? 
            `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${place.photos[0].photo_reference}&key=${GOOGLE_PLACES_API_KEY}` 
            : undefined,
          photos: photoUrls
        };
      });
      
    } catch (error) {
      console.error('Google Places API error:', error);
      // Fallback to mock data on error
      return this.searchPlacesMock(query, limit);
    }
  }

  // Fallback mock search method
  private async searchPlacesMock(query: string, limit: number = 10): Promise<Place[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const filtered = mockPlaces.filter(place => 
      place.name.toLowerCase().includes(query.toLowerCase()) ||
      place.address.toLowerCase().includes(query.toLowerCase()) ||
      place.type.toLowerCase().includes(query.toLowerCase()) ||
      place.description?.toLowerCase().includes(query.toLowerCase())
    );

    return filtered.slice(0, limit);
  }

  // Map Google Place types to our categories
  private mapGoogleTypeToCategory(googleType: string): string {
    const typeMapping: { [key: string]: string } = {
      'restaurant': 'restaurant',
      'food': 'restaurant',
      'meal_takeaway': 'restaurant',
      'cafe': 'restaurant',
      'tourist_attraction': 'attraction',
      'museum': 'attraction',
      'park': 'attraction',
      'zoo': 'attraction',
      'amusement_park': 'attraction',
      'lodging': 'hotel',
      'hospital': 'health',
      'pharmacy': 'health',
      'shopping_mall': 'shopping',
      'store': 'shopping',
      'bank': 'finance',
      'atm': 'finance',
      'gas_station': 'transport',
      'subway_station': 'transport',
      'airport': 'transport'
    };
    
    return typeMapping[googleType] || 'activity';
  }

  // Get popular places (for when no search query)
  async getPopularPlaces(limit: number = 6): Promise<Place[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Return top-rated places
    const popular = mockPlaces
      .filter(place => place.rating && place.rating >= 4.5)
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, limit);

    return popular;
  }

  // Get places by category
  async getPlacesByCategory(category: string, limit: number = 5): Promise<Place[]> {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const filtered = mockPlaces
      .filter(place => place.category === category)
      .slice(0, limit);

    return filtered;
  }

  // Get recent searches (mock implementation)
  async getRecentSearches(): Promise<string[]> {
    // In a real app, this would come from local storage or user preferences
    return [
      "Colosseum",
      "Vatican Museums", 
      "Trevi Fountain",
      "Roman Food Tour"
    ];
  }

  // Get suggested category for a place
  getSuggestedCategory(place: Place): string {
    return place.category || 'activity';
  }
}

export const placesService = new PlacesService();
