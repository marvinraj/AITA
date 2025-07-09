import React from 'react';
import { Text, View } from 'react-native';
import { Trip } from '../types/database';

interface SavesTabProps {
  trip: Trip;
}

export default function SavesTab({ trip }: SavesTabProps) {
  return (
    <View className="flex-1 items-center justify-center px-4">
      <Text className="text-primaryFont text-lg">Saves for {trip.name}</Text>
    </View>
  )
}