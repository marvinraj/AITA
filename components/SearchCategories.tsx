import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../constants/colors';

export interface SearchCategory {
  id: string;
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  query: string;
}

interface SearchCategoriesProps {
  onCategorySelect: (query: string) => void;
}

const searchCategories: SearchCategory[] = [
  { id: 'restaurants', name: 'Restaurants', icon: 'restaurant', query: 'restaurants' },
  { id: 'hotels', name: 'Hotels', icon: 'bed', query: 'hotels' },
  { id: 'attractions', name: 'Attractions', icon: 'camera', query: 'tourist attractions' },
  { id: 'shopping', name: 'Shopping', icon: 'bag', query: 'shopping malls' },
  { id: 'entertainment', name: 'Entertainment', icon: 'musical-notes', query: 'entertainment' },
  { id: 'museums', name: 'Museums', icon: 'library', query: 'museums' },
  { id: 'parks', name: 'Parks', icon: 'leaf', query: 'parks' },
  { id: 'cafes', name: 'Cafes', icon: 'cafe', query: 'cafes' },
];

export default function SearchCategories({ onCategorySelect }: SearchCategoriesProps) {
  return (
    <View className="mb-4">
      <Text className="text-primaryFont text-lg font-semibold mb-3">Browse Categories</Text>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 4 }}
      >
        {searchCategories.map((category) => (
          <TouchableOpacity
            key={category.id}
            onPress={() => onCategorySelect(category.query)}
            className="items-center mr-4 bg-inputBG rounded-lg p-3 min-w-[80px]"
          >
            <View className="w-12 h-12 rounded-full bg-accentFont/20 items-center justify-center mb-2">
              <Ionicons 
                name={category.icon} 
                size={24} 
                color={colors.accentFont} 
              />
            </View>
            <Text className="text-primaryFont text-xs text-center font-medium">
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}
