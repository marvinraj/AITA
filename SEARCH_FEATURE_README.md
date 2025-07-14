# Search & Save Places Feature

## Overview
The search page (Discover tab) allows users to search for places using the Google Places API and save their favorite places for easy access.

## Features

### 🔍 Search Functionality
- **Text Search**: Search for any type of place (restaurants, hotels, attractions, etc.)
- **Category Filters**: Quick search buttons for popular categories
- **Recent Searches**: Quick access to recently searched terms
- **Real-time Results**: Instant search results with place details

### ❤️ Save Places
- **One-tap Save**: Heart icon to save/unsave places
- **Personal Notes**: Add custom notes when saving places
- **Folder Organization**: Create custom folders to organize saved places
- **All Saves Folder**: Default folder containing all saved places
- **Persistent Storage**: Folders and places saved to database

### 📍 Place Details
- **Rich Information**: Name, address, rating, photos, and reviews
- **Visual Cards**: Clean card layout with place images
- **Tap for Details**: Tap any place card for more information

## How to Use

### Searching for Places
1. Open the **Discover** tab
2. Either:
   - Type in the search bar and press search
   - Tap on a category button (Restaurants, Hotels, etc.)
   - Tap on a recent search term

### Saving Places
1. Find a place you like in search results
2. Tap the heart icon on the right side of the place card
3. Optionally add a personal note when prompted
4. The place will be saved to your Saves tab

### Viewing Saved Places
1. Go to your profile and select the **Saves** tab
2. Browse folders or tap "All Saves" to see everything
3. Create new folders by tapping the + button
4. Tap any folder to view places inside it
5. Tap the heart icon to remove places from saved

### Managing Folders
1. Tap the + button to create a new folder
2. Enter a folder name when prompted
3. Navigate between folders using the back arrow
4. All places are automatically in "All Saves" folder

## Technical Implementation

### Google Places API Integration
- Uses Google Places Text Search API
- Fetches place photos, ratings, and details
- Handles API rate limiting and error states

### Database Storage
- Saved places stored in Supabase `saved_places` table
- Custom folders stored in Supabase `saved_folders` table
- User-specific data with Row Level Security
- Includes place metadata and user notes
- Folder organization with place counts

### Key Components
- **discover.tsx**: Main search interface
- **SavedPlacesTab.tsx**: Folder and saved places display
- **SearchCategories.tsx**: Category filter buttons
- **googlePlacesService.ts**: API service layer
- **savedPlacesService.ts**: Database operations for places
- **savedFoldersService.ts**: Database operations for folders

## Environment Setup
Make sure you have set up your Google Places API key in the `.env` file:
```
EXPO_PUBLIC_GOOGLE_PLACES_API_KEY=your_api_key_here
```

## Future Enhancements
- [ ] Location-based search
- [ ] Advanced filters (price range, ratings)
- [ ] Place reviews and photos
- [ ] Move places between folders
- [ ] Folder sharing with friends
- [ ] Export saved places to itineraries
- [ ] Bulk folder operations
