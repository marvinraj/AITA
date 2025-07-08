export interface Category {
  id: string;
  label: string;
  icon: string;
  description?: string;
}

export const ACTIVITY_CATEGORIES: Category[] = [
  { 
    id: 'restaurant', 
    label: 'Restaurant', 
    icon: '🍽️',
    description: 'Dining experiences and food venues'
  },
  { 
    id: 'hotel', 
    label: 'Hotel', 
    icon: '🏨',
    description: 'Accommodation and lodging'
  },
  { 
    id: 'activity', 
    label: 'Activity', 
    icon: '🎯',
    description: 'Tours, experiences, and entertainment'
  },
  { 
    id: 'attraction', 
    label: 'Attraction', 
    icon: '🎫',
    description: 'Museums, landmarks, and sightseeing'
  },
  { 
    id: 'transport', 
    label: 'Transport', 
    icon: '🚗',
    description: 'Getting around and travel'
  },
  { 
    id: 'flight', 
    label: 'Flight', 
    icon: '✈️',
    description: 'Air travel and airports'
  },
  { 
    id: 'shopping', 
    label: 'Shopping', 
    icon: '🛍️',
    description: 'Markets, stores, and retail'
  },
  { 
    id: 'nightlife', 
    label: 'Nightlife', 
    icon: '🌙',
    description: 'Bars, clubs, and evening entertainment'
  },
  { 
    id: 'other', 
    label: 'Other', 
    icon: '📝',
    description: 'Miscellaneous activities and tasks'
  }
];

// Helper function to get category by id
export const getCategoryById = (id: string): Category | undefined => {
  return ACTIVITY_CATEGORIES.find(category => category.id === id);
};

// Helper function to get category icon
export const getCategoryIcon = (categoryId: string): string => {
  const category = getCategoryById(categoryId);
  return category?.icon || '📍';
};

// Helper function to get suggested categories based on place type
export const getSuggestedCategories = (placeType: string): Category[] => {
  const type = placeType.toLowerCase();
  
  if (type.includes('restaurant') || type.includes('dining') || type.includes('food')) {
    return [
      getCategoryById('restaurant'),
      getCategoryById('activity')
    ].filter(Boolean) as Category[];
  }
  
  if (type.includes('hotel') || type.includes('accommodation')) {
    return [
      getCategoryById('hotel')
    ].filter(Boolean) as Category[];
  }
  
  if (type.includes('museum') || type.includes('monument') || type.includes('historical')) {
    return [
      getCategoryById('attraction'),
      getCategoryById('activity')
    ].filter(Boolean) as Category[];
  }
  
  if (type.includes('tour') || type.includes('experience') || type.includes('class')) {
    return [
      getCategoryById('activity'),
      getCategoryById('attraction')
    ].filter(Boolean) as Category[];
  }
  
  if (type.includes('transport') || type.includes('train') || type.includes('bus')) {
    return [
      getCategoryById('transport')
    ].filter(Boolean) as Category[];
  }
  
  if (type.includes('shopping') || type.includes('market') || type.includes('store')) {
    return [
      getCategoryById('shopping'),
      getCategoryById('activity')
    ].filter(Boolean) as Category[];
  }
  
  // Default suggestions
  return [
    getCategoryById('activity'),
    getCategoryById('attraction')
  ].filter(Boolean) as Category[];
};
