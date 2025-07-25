// Google Places API service for fetching real place photos

interface PlacePhoto {
  photo_reference: string;
  height: number;
  width: number;
}

interface PlaceDetails {
  place_id: string;
  photos?: PlacePhoto[];
  name: string;
  formatted_address: string;
}

interface PlacesSearchResponse {
  candidates: PlaceDetails[];
  status: string;
}

class GooglePlacesService {
  private readonly API_KEY = process.env.GOOGLE_PLACES_API_KEY || 'YOUR_API_KEY_HERE';
  private readonly BASE_URL = 'https://maps.googleapis.com/maps/api';
  private apiEnabled = true; // Flag to disable API calls if they consistently fail

  /**
   * Check if API is properly configured
   */
  private isApiConfigured(): boolean {
    return this.API_KEY !== 'YOUR_API_KEY_HERE' && this.API_KEY.length > 10;
  }

  /**
   * Search for a place and get its photo reference
   */
  async searchPlacePhoto(placeName: string, location: string): Promise<string | null> {
    // Skip API call if not configured or disabled
    if (!this.isApiConfigured() || !this.apiEnabled) {
      console.log('📸 Places API not configured or disabled, using fallback images');
      return null;
    }

    try {
      const query = `${placeName} ${location}`;
      const searchUrl = `${this.BASE_URL}/place/findplacefromtext/json?input=${encodeURIComponent(query)}&inputtype=textquery&fields=place_id,photos,name,formatted_address&key=${this.API_KEY}`;
      
      console.log('🔍 Searching for place:', query);
      
      const response = await fetch(searchUrl);
      const data: PlacesSearchResponse = await response.json();
      
      // Handle REQUEST_DENIED status
      if (data.status === 'REQUEST_DENIED') {
        console.warn('❌ Google Places API: REQUEST_DENIED - Check API key, billing, and permissions');
        this.apiEnabled = false; // Disable further API calls to avoid spam
        return null;
      }
      
      // Handle other error statuses
      if (data.status !== 'OK') {
        console.log(`⚠️ Places API returned status: ${data.status} for ${query}`);
        return null;
      }
      
      if (data.candidates?.[0]?.photos?.[0]) {
        const photoReference = data.candidates[0].photos[0].photo_reference;
        console.log('📸 Found real photo for:', placeName);
        return this.getPhotoUrl(photoReference);
      }
      
      console.log('📷 No photo available for:', query);
      return null;
    } catch (error) {
      console.error('💥 Error searching for place photo:', error);
      return null;
    }
  }

  /**
   * Convert photo reference to actual photo URL
   */
  private getPhotoUrl(photoReference: string, maxWidth: number = 400): string {
    return `${this.BASE_URL}/place/photo?maxwidth=${maxWidth}&photoreference=${photoReference}&key=${this.API_KEY}`;
  }

  /**
   * Get multiple photo URLs for a place (if available)
   */
  async getPlacePhotos(placeName: string, location: string, maxPhotos: number = 3): Promise<string[]> {
    try {
      const query = `${placeName} ${location}`;
      const searchUrl = `${this.BASE_URL}/place/findplacefromtext/json?input=${encodeURIComponent(query)}&inputtype=textquery&fields=place_id,photos&key=${this.API_KEY}`;
      
      const response = await fetch(searchUrl);
      const data: PlacesSearchResponse = await response.json();
      
      if (data.status === 'OK' && data.candidates?.[0]?.photos) {
        const photos = data.candidates[0].photos.slice(0, maxPhotos);
        return photos.map(photo => this.getPhotoUrl(photo.photo_reference));
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching place photos:', error);
      return [];
    }
  }

  /**
   * Batch fetch photos for multiple recommendations
   */
  async batchFetchPhotos(recommendations: Array<{name: string, location: string}>): Promise<{[key: string]: string | null}> {
    // Early return if API not configured
    if (!this.isApiConfigured() || !this.apiEnabled) {
      console.log('📸 Skipping batch photo fetch - API not available');
      const emptyMap: {[key: string]: string | null} = {};
      recommendations.forEach(rec => {
        emptyMap[`${rec.name}_${rec.location}`] = null;
      });
      return emptyMap;
    }

    console.log(`📸 Batch fetching photos for ${recommendations.length} places...`);
    
    // Add delay between requests to avoid rate limiting
    const photoPromises = recommendations.map(async (rec, index) => {
      // Stagger requests to avoid hitting rate limits
      if (index > 0) {
        await new Promise(resolve => setTimeout(resolve, index * 200)); // 200ms delay between requests
      }
      
      const photoUrl = await this.searchPlacePhoto(rec.name, rec.location);
      return {
        key: `${rec.name}_${rec.location}`,
        photoUrl
      };
    });

    const results = await Promise.allSettled(photoPromises);
    const photoMap: {[key: string]: string | null} = {};

    let successCount = 0;
    results.forEach((result, index) => {
      const rec = recommendations[index];
      const key = `${rec.name}_${rec.location}`;
      
      if (result.status === 'fulfilled' && result.value) {
        photoMap[key] = result.value.photoUrl;
        if (result.value.photoUrl) successCount++;
      } else {
        photoMap[key] = null;
      }
    });

    console.log(`📸 Batch fetch complete: ${successCount}/${recommendations.length} photos found`);
    return photoMap;
  }

  /**
   * Reset API enabled flag (for manual retry)
   */
  resetApiStatus(): void {
    this.apiEnabled = true;
    console.log('🔄 Google Places API status reset');
  }
}

export const googlePlacesService = new GooglePlacesService();
export default googlePlacesService;
