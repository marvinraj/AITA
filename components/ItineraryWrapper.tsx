import { Ionicons } from '@expo/vector-icons';
import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Trip } from '../types/database';
import ItineraryMapView from './ItineraryMapView';
import ItineraryTab, { ItineraryTabRef } from './ItineraryTab';

interface ItineraryWrapperProps {
  trip: Trip | null;                    // from chatAI (can be null)
  height: number;                       // height constraint from chatAI
  onTripUpdate?: (updatedTrip: Trip) => void; // optional callback to update chatAI state
  onItineraryChange?: () => void;       // callback when itinerary items change
  hasOverlayHeader?: boolean;           // whether there's a transparent header overlapping the content
}

export interface ItineraryWrapperRef {
  refreshItinerary: () => Promise<void>;
}

export default forwardRef<ItineraryWrapperRef, ItineraryWrapperProps>(function ItineraryWrapper({ 
  trip, 
  height, 
  onTripUpdate,
  onItineraryChange,
  hasOverlayHeader = false
}, ref) {
  
  const itineraryTabRef = useRef<ItineraryTabRef>(null);
  const [viewMode, setViewMode] = useState<'itinerary' | 'map'>('itinerary');
  const [mapKey, setMapKey] = useState(0); // Force map re-render when itinerary changes

  // Expose refresh function to parent components
  useImperativeHandle(ref, () => ({
    refreshItinerary: async () => {
      await itineraryTabRef.current?.refreshItinerary();
    }
  }), []);
  
  // handle trip updates from ItineraryTab
  const handleTripUpdate = (updatedTrip: Trip) => {
    console.log('ItineraryWrapper: Trip updated', updatedTrip);
    
    // call parent callback if provided
    if (onTripUpdate) {
      onTripUpdate(updatedTrip);
    }
  };

  // handle itinerary changes and refresh map
  const handleItineraryChange = () => {
    console.log('ItineraryWrapper: Itinerary changed, refreshing map');
    
    // Force map re-render by updating key
    setMapKey(prev => prev + 1);
    
    // call parent callback if provided
    if (onItineraryChange) {
      onItineraryChange();
    }
  };
  
  // handle case where trip is not loaded yet
  if (!trip) {
    return (
      <View 
        className="flex-1 items-center justify-center px-4 bg-primaryBG" 
        style={{ height }}
      >
        <Text className="text-secondaryFont text-sm">Loading trip...</Text>
      </View>
    );
  }

  // handle case where trip dates are not set
  if (!trip.start_date || !trip.end_date) {
    return (
      <View 
        className="flex-1 items-center justify-center px-4 bg-primaryBG" 
        style={{ height }}
      >
        <Text className="text-secondaryFont text-sm text-center">
          Trip dates not set.{'\n'}Set your dates to view itinerary.
        </Text>
      </View>
    );
  }

  // render ItineraryTab with height constraint
  return (
    <View 
      className="flex-1 bg-primaryBG overflow-hidden relative"
      style={{ height }}
    >
      {/* Content */}
      <View className="flex-1">
        {viewMode === 'itinerary' ? (
          <View className={`flex-1 ${hasOverlayHeader ? 'pt-20' : ''}`}>
            <ItineraryTab 
              ref={itineraryTabRef}
              trip={trip}
              onTripUpdate={handleTripUpdate}
              onItineraryChange={handleItineraryChange}
            />
          </View>
        ) : (
          <ItineraryMapView 
            key={mapKey}
            trip={trip}
            height={height}
          />
        )}
      </View>

      {/* Toggle Icons - Bottom Right Corner */}
      <View className="absolute top-40 right-4 flex-col bg-secondaryBG rounded-full border border-border shadow-lg">
        <TouchableOpacity
          onPress={() => setViewMode('itinerary')}
          className={`px-4 py-4 rounded-full ${
            viewMode === 'itinerary' ? 'bg-primaryFont' : 'bg-transparent'
          }`}
        >
          <Ionicons 
            name="calendar-outline" 
            size={18} 
            color={viewMode === 'itinerary' ? '#0B0705' : '#828282'} 
          />
        </TouchableOpacity>
        
        <TouchableOpacity
          onPress={() => setViewMode('map')}
          className={`px-4 py-4 rounded-full ${
            viewMode === 'map' ? 'bg-primaryFont' : 'bg-transparent'
          }`}
        >
          <Ionicons 
            name="map-outline" 
            size={18} 
            color={viewMode === 'map' ? '#0B0705' : '#828282'} 
          />
        </TouchableOpacity>
      </View>
    </View>
  );
});
