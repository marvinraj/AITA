import React from 'react';
import { Text, View } from 'react-native';
import { Trip } from '../types/database';
import ItineraryTab from './ItineraryTab';

interface ItineraryWrapperProps {
  trip: Trip | null;                    // from chatAI (can be null)
  height: number;                       // height constraint from chatAI
  onTripUpdate?: (updatedTrip: Trip) => void; // optional callback to update chatAI state
}

export default function ItineraryWrapper({ 
  trip, 
  height, 
  onTripUpdate 
}: ItineraryWrapperProps) {
  
  // handle trip updates from ItineraryTab
  const handleTripUpdate = (updatedTrip: Trip) => {
    console.log('ItineraryWrapper: Trip updated', updatedTrip);
    
    // call parent callback if provided
    if (onTripUpdate) {
      onTripUpdate(updatedTrip);
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
      className="flex-1 bg-primaryBG overflow-hidden"
      style={{ height }}
    >
      <ItineraryTab 
        trip={trip}
        onTripUpdate={handleTripUpdate}
      />
    </View>
  );
}
