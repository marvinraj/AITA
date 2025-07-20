import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

export interface SearchCategory {
  id: string;
  name: string;
  query: string;
}

interface SearchCategoriesProps {
  selectedCategory?: string | null;
  onCategorySelect: (query: string, categoryId: string) => void;
}

const searchCategories: SearchCategory[] = [
  { id: 'restaurants', name: 'Restaurants', query: 'restaurants' },
  { id: 'hotels', name: 'Hotels', query: 'hotels' },
  { id: 'attractions', name: 'Attractions', query: 'tourist attractions' },
  { id: 'shopping', name: 'Shopping', query: 'shopping malls' },
  { id: 'entertainment', name: 'Entertainment', query: 'entertainment' },
  { id: 'museums', name: 'Museums', query: 'museums' },
  { id: 'parks', name: 'Parks', query: 'parks' },
  { id: 'cafes', name: 'Cafes', query: 'cafes' },
];

export default function SearchCategories({ selectedCategory, onCategorySelect }: SearchCategoriesProps) {
  return (
    <View className="mb-4">
      {/* <Text className="text-white text-lg font-semibold mb-3">Browse Categories</Text> */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 4 }}
      >
        {searchCategories.map((category) => {
          const isSelected = selectedCategory === category.id;
          return (
            <TouchableOpacity
              key={category.id}
              onPress={() => onCategorySelect(category.query, category.id)}
              className={`items-center mr-3 rounded-lg px-4 py-3 ${
                isSelected ? 'bg-blue-500' : 'bg-white/10'
              }`}
            >
              <Text className={`text-sm text-center font-medium ${
                isSelected ? 'text-white' : 'text-white'
              }`}>
                {category.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}
