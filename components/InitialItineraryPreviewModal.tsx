import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Animated, Easing, Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { travaApi } from '../lib/api';
import { formatDayHeader, generateDateRange, getDayOfWeek } from '../lib/utils/dateUtils';
import { DailyItinerary, GeneratedActivity, ItineraryItem, TripFormData } from '../types/database';
import DailyItinerarySection from './DailyItinerarySection';
import DatePicker from './DatePicker';

interface InitialItineraryPreviewModalProps {
  visible: boolean;
  tripData: TripFormData;
  onComplete: (keepActivities: boolean, itineraryItems?: ItineraryItem[]) => void;
  onCancel: () => void;
}

const LOADING_MESSAGES = [
  "🎯 Analyzing your preferences...",
  "🗺️ Exploring your destination...",
  "⭐ Finding the best activities...",
  "📅 Organizing your perfect itinerary...",
  "✨ Almost ready..."
];

// Generate AI-powered itinerary
const generateAIItinerary = async (tripData: TripFormData): Promise<GeneratedActivity[]> => {
  const budgetGuidance = tripData.budget && tripData.budget !== 'any' ? `
Budget style: ${tripData.budget === 'budget' ? 'Budget traveler - focus on free/low-cost activities and affordable dining' :
tripData.budget === 'mid-range' ? 'Mid-range explorer - balance value and comfort, include mix of budget and premium options' :
tripData.budget === 'comfort' ? 'Comfort seeker - prioritize quality experiences and comfortable dining/activities' :
tripData.budget === 'luxury' ? 'Luxury experience - include premium restaurants, exclusive activities, and high-end experiences' : ''}`
: '';

  const prompt = `Generate a travel itinerary for a trip to ${tripData.destination} from ${tripData.startDate} to ${tripData.endDate}. 

Trip details:
- Destination: ${tripData.destination}
- Travel dates: ${tripData.startDate} to ${tripData.endDate}
- Traveling with: ${tripData.companions}
- Interested in: ${tripData.activities}${budgetGuidance}

IMPORTANT GUIDELINES:
1. Create 8-12 LOCAL activities/experiences in ${tripData.destination} only
2. DO NOT include transportation TO or FROM ${tripData.destination} (no flights, departures, arrivals)
3. DO NOT include hotel check-in/check-out activities
4. Focus on attractions, restaurants, activities, and experiences WITHIN the destination
5. Ensure activities are realistic and can be done in ${tripData.destination}
6. Distribute activities evenly across all trip days${tripData.budget && tripData.budget !== 'any' ? `
7. Consider the ${tripData.budget} budget preference when selecting activities and restaurants` : ''}

For each activity, provide:
1. Activity name/title (specific to ${tripData.destination})
2. Brief description (30-50 words)
3. Time (in HH:MM format like 09:00)
4. Specific location/address in ${tripData.destination}
5. Category (activity, restaurant, attraction, shopping, nightlife, other)
6. Priority (low, medium, high)

Respond ONLY with a JSON array of activities. No other text or formatting. Example format:
[
  {
    "title": "Local Activity in ${tripData.destination}",
    "description": "Experience something unique in this destination",
    "time": "09:00",
    "location": "Specific address in ${tripData.destination}",
    "category": "activity",
    "priority": "high"
  }
]`;

  const messages = [
    {
      role: 'user' as const,
      text: prompt,
      time: new Date().toISOString(),
      tripContext: {
        destination: tripData.destination,
        dates: `${tripData.startDate} to ${tripData.endDate}`,
        companions: tripData.companions,
        activities: tripData.activities,
        budget: tripData.budget
      }
    }
  ];

  try {
    console.log('Calling AI API...');
    const response = await travaApi.createChatCompletion(messages, {
      tripDetails: {
        tripName: tripData.tripName,
        destination: tripData.destination,
        startDate: tripData.startDate,
        endDate: tripData.endDate,
        companions: tripData.companions,
        activities: tripData.activities,
        budget: tripData.budget
      },
      currentFocus: 'planning'
    });
    
    console.log('AI API response received, length:', response?.length || 0);
    
    if (!response || response.trim().length === 0) {
      throw new Error('Empty response from AI');
    }

    let activitiesArray: any[] = [];
    
    try {
      // Clean the response - remove any markdown formatting
      let cleanResponse = response.trim();
      
      // Remove markdown code blocks if present - be more aggressive
      cleanResponse = cleanResponse.replace(/```json\s*/gi, '').replace(/```\s*/g, '');
      
      // Remove any leading/trailing whitespace and newlines
      cleanResponse = cleanResponse.trim();
      
      // Try to find JSON array specifically first
      let jsonMatch = cleanResponse.match(/\[[\s\S]*\]/);
      
      if (jsonMatch) {
        cleanResponse = jsonMatch[0];
      } else {
        // If no array found, try to find any JSON object
        jsonMatch = cleanResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          cleanResponse = jsonMatch[0];
        }
      }
      
      console.log('Attempting to parse:', cleanResponse.substring(0, 200) + '...');
      console.log('Full cleaned response length:', cleanResponse.length);
      
      const parsed = JSON.parse(cleanResponse);
      
      // Handle both array and object responses
      if (Array.isArray(parsed)) {
        activitiesArray = parsed;
      } else if (parsed && typeof parsed === 'object') {
        // If it's an object with dates as keys, flatten it
        activitiesArray = Object.values(parsed).flat();
      }
      
      console.log('Parsed activities array, length:', activitiesArray.length);
      
    } catch (jsonError) {
      console.error('JSON parsing failed:', jsonError);
      console.log('Raw response:', response.substring(0, 500));
      
      // Try alternative parsing approaches
      try {
        console.log('Attempting alternative JSON parsing...');
        
        // Try to fix common JSON issues
        let fixedResponse = response.trim();
        
        // Remove markdown blocks more aggressively
        fixedResponse = fixedResponse.replace(/```[\w]*\s*/gi, '').replace(/```/g, '');
        
        // Remove any text before the first [ or {
        const firstBracket = fixedResponse.search(/[\[\{]/);
        if (firstBracket !== -1) {
          fixedResponse = fixedResponse.substring(firstBracket);
        }
        
        // Remove any text after the last ] or }
        const lastBracket = Math.max(fixedResponse.lastIndexOf(']'), fixedResponse.lastIndexOf('}'));
        if (lastBracket !== -1) {
          fixedResponse = fixedResponse.substring(0, lastBracket + 1);
        }
        
        console.log('Fixed response preview:', fixedResponse.substring(0, 200));
        
        const altParsed = JSON.parse(fixedResponse);
        
        if (Array.isArray(altParsed)) {
          activitiesArray = altParsed;
          console.log('Alternative parsing successful, length:', activitiesArray.length);
        } else if (altParsed && typeof altParsed === 'object') {
          activitiesArray = Object.values(altParsed).flat();
          console.log('Alternative parsing successful (object), length:', activitiesArray.length);
        }
        
      } catch (altError) {
        console.error('Alternative parsing also failed:', altError);
        throw new Error('Failed to parse AI response as JSON');
      }
    }
    
    // Convert to GeneratedActivity format
    const allActivities: GeneratedActivity[] = activitiesArray
      .filter((activity: any) => {
        // Filter out transport/hotel activities that might slip through
        const title = (activity.title || activity.name || '').toLowerCase();
        const description = (activity.description || '').toLowerCase();
        
        // Skip activities that are clearly transportation or accommodation
        const isTransport = title.includes('flight') || title.includes('departure') || 
                           title.includes('arrival') || title.includes('airport') ||
                           title.includes('check-in') || title.includes('check-out') ||
                           description.includes('depart') || description.includes('arrive');
        
        return !isTransport;
      })
      .map((activity: any, index: number) => {
        // Validate and normalize category
        const validCategories = ['activity', 'restaurant', 'hotel', 'transport', 'flight', 'attraction', 'shopping', 'nightlife', 'other'];
        let category = activity.category || 'activity';
        
        // Normalize common variations
        if (category === 'dining' || category === 'food') category = 'restaurant';
        if (category === 'sightseeing' || category === 'tourism') category = 'attraction';
        if (category === 'entertainment') category = 'nightlife';
        if (category === 'accommodation') category = 'hotel';
        if (category === 'travel' || category === 'transportation') category = 'transport';
        
        // Ensure category is valid, default to 'other' if not
        if (!validCategories.includes(category)) {
          console.warn(`Invalid category "${activity.category}" for activity "${activity.title}", using "other"`);
          category = 'other';
        }
        
        return {
          id: `ai_activity_${index}`,
          title: activity.title || activity.name || `Activity ${index + 1}`,
          description: activity.description || 'No description provided',
          time: activity.time || activity.suggested_time || '12:00',
          location: activity.location || activity.address || `${tripData.destination}`,
          category: category as 'activity' | 'restaurant' | 'hotel' | 'transport' | 'flight' | 'attraction' | 'shopping' | 'nightlife' | 'other',
          priority: ['low', 'medium', 'high'].includes(activity.priority) ? activity.priority : 'medium'
        };
      });
    
    console.log('Successfully converted to GeneratedActivity format:', allActivities.length);
    
    if (allActivities.length === 0) {
      throw new Error('No valid activities generated');
    }
    
    return allActivities;
    
  } catch (apiError) {
    console.error('AI API call failed:', apiError);
    const errorMessage = apiError instanceof Error ? apiError.message : 'Unknown error';
    throw new Error(`AI generation failed: ${errorMessage}`);
  }
};

// Fallback function using mock data
const generateMockActivities = (tripData: TripFormData): GeneratedActivity[] => {
  const { destination, activities, companions } = tripData;
  const isCouple = companions.toLowerCase().includes('partner') || companions.toLowerCase().includes('spouse');
  const isFamilyWithKids = companions.toLowerCase().includes('children') || companions.toLowerCase().includes('kids');
  const isGroupTravel = companions.toLowerCase().includes('friends') || companions.includes('4') || companions.includes('5');
  
  // Map destination to realistic activities based on popular locations
  const destinationActivities: Record<string, any[]> = {
    // New York activities
    'New York': [
      {
        title: 'Empire State Building Observation Deck',
        description: 'Experience breathtaking 360° views of NYC from the 86th floor observation deck.',
        time: '09:00',
        location: '20 W 34th St, New York, NY 10001',
        category: 'attraction',
        priority: 'high'
      },
      {
        title: 'Central Park Bike Tour',
        description: 'Cycle through the scenic paths of Central Park with a guided tour of famous landmarks.',
        time: '11:00',
        location: 'Central Park, New York, NY',
        category: 'activity',
        priority: 'high'
      },
      {
        title: 'Metropolitan Museum of Art',
        description: 'Explore one of the world\'s largest art museums with over 2 million works.',
        time: '14:00',
        location: '1000 5th Ave, New York, NY 10028',
        category: 'attraction',
        priority: 'medium'
      },
      {
        title: 'Katz\'s Delicatessen',
        description: 'Taste the world-famous pastrami sandwich at this iconic New York deli.',
        time: '13:00',
        location: '205 E Houston St, New York, NY 10002',
        category: 'restaurant',
        priority: 'high'
      },
      {
        title: 'Broadway Show - Hamilton',
        description: 'Watch the award-winning musical that revolutionized Broadway.',
        time: '19:00',
        location: 'Richard Rodgers Theatre, 226 W 46th St',
        category: 'nightlife',
        priority: 'high'
      },
      {
        title: 'Brooklyn Bridge Walk',
        description: 'Walk across the iconic Brooklyn Bridge for spectacular Manhattan skyline views.',
        time: '16:30',
        location: 'Brooklyn Bridge, New York, NY 10038',
        category: 'activity',
        priority: 'medium'
      },
      {
        title: 'The High Line Park',
        description: 'Stroll along this elevated linear park built on a former freight rail line.',
        time: '15:00',
        location: 'The High Line, New York, NY 10011',
        category: 'activity',
        priority: 'medium'
      },
      {
        title: 'Chelsea Market Food Tour',
        description: 'Sample artisanal foods from various vendors in this famous food hall.',
        time: '12:00',
        location: '75 9th Ave, New York, NY 10011',
        category: 'restaurant',
        priority: 'medium'
      },
      {
        title: 'MoMA (Museum of Modern Art)',
        description: 'View masterpieces by Van Gogh, Picasso, Warhol, and other modern artists.',
        time: '10:00',
        location: '11 W 53rd St, New York, NY 10019',
        category: 'attraction',
        priority: 'medium'
      },
      {
        title: 'Helicopter Tour of Manhattan',
        description: 'See the city from above with a breathtaking helicopter tour.',
        time: '11:30',
        location: '6 E River Piers, New York, NY 10004',
        category: 'activity',
        priority: 'high'
      },
      {
        title: '9/11 Memorial & Museum',
        description: 'Pay tribute at this moving memorial and museum dedicated to the events of 9/11.',
        time: '09:30',
        location: '180 Greenwich St, New York, NY 10007',
        category: 'attraction',
        priority: 'high'
      },
      {
        title: 'Fifth Avenue Shopping',
        description: 'Shop at world-famous luxury stores along New York\'s premier shopping street.',
        time: '14:30',
        location: 'Fifth Avenue, New York, NY',
        category: 'shopping',
        priority: 'medium'
      },
      {
        title: 'Little Italy Culinary Experience',
        description: 'Enjoy authentic Italian cuisine in this historic neighborhood.',
        time: '19:00',
        location: 'Mulberry St, New York, NY 10013',
        category: 'restaurant',
        priority: 'medium'
      }
    ],
    
    // Paris activities
    'Paris': [
      {
        title: 'Eiffel Tower Summit Visit',
        description: 'Ascend to the top of the Eiffel Tower for panoramic views of Paris.',
        time: '09:30',
        location: 'Champ de Mars, 5 Av. Anatole France, 75007 Paris',
        category: 'attraction',
        priority: 'high'
      },
      {
        title: 'Louvre Museum Guided Tour',
        description: 'Discover masterpieces including the Mona Lisa with an expert guide.',
        time: '10:00',
        location: 'Rue de Rivoli, 75001 Paris',
        category: 'attraction',
        priority: 'high'
      },
      {
        title: 'Seine River Dinner Cruise',
        description: 'Enjoy French cuisine while cruising past illuminated landmarks.',
        time: '20:00',
        location: 'Port de la Bourdonnais, 75007 Paris',
        category: 'restaurant',
        priority: 'high'
      },
      {
        title: 'Notre-Dame Cathedral Exterior',
        description: 'View the Gothic masterpiece from the exterior during reconstruction.',
        time: '14:00',
        location: '6 Parvis Notre-Dame, 75004 Paris',
        category: 'attraction',
        priority: 'medium'
      },
      {
        title: 'Montmartre & Sacré-Cœur Walking Tour',
        description: 'Explore the artistic neighborhood and visit the stunning basilica.',
        time: '15:30',
        location: '35 Rue du Chevalier de la Barre, 75018 Paris',
        category: 'activity',
        priority: 'medium'
      },
      {
        title: 'Café Les Deux Magots',
        description: 'Have coffee at the famous café once frequented by Hemingway and Picasso.',
        time: '16:00',
        location: '6 Pl. Saint-Germain des Prés, 75006 Paris',
        category: 'restaurant',
        priority: 'medium'
      },
      {
        title: 'Champs-Élysées Stroll',
        description: 'Walk along one of the world\'s most famous avenues with luxury shops.',
        time: '11:00',
        location: 'Champs-Élysées, 75008 Paris',
        category: 'shopping',
        priority: 'medium'
      },
      {
        title: 'Musée d\'Orsay Visit',
        description: 'View the world\'s largest collection of impressionist masterpieces.',
        time: '13:00',
        location: '1 Rue de la Légion d\'Honneur, 75007 Paris',
        category: 'attraction',
        priority: 'high'
      },
      {
        title: 'Palace of Versailles Day Trip',
        description: 'Tour the opulent royal château and its magnificent gardens.',
        time: '09:00',
        location: 'Place d\'Armes, 78000 Versailles',
        category: 'attraction',
        priority: 'high'
      },
      {
        title: 'Ladurée Macaron Tasting',
        description: 'Sample the world-famous macarons at the legendary patisserie.',
        time: '15:00',
        location: '75 Av. des Champs-Élysées, 75008 Paris',
        category: 'restaurant',
        priority: 'medium'
      },
      {
        title: 'Moulin Rouge Show',
        description: 'Experience the iconic cabaret show with dinner and champagne.',
        time: '21:00',
        location: '82 Bd de Clichy, 75018 Paris',
        category: 'nightlife',
        priority: 'high'
      },
      {
        title: 'Arc de Triomphe Climb',
        description: 'Climb 284 steps to the top for stunning views down the Champs-Élysées.',
        time: '17:00',
        location: 'Pl. Charles de Gaulle, 75008 Paris',
        category: 'attraction',
        priority: 'medium'
      }
    ],
    
    // Tokyo activities
    'Tokyo': [
      {
        title: 'Tokyo Skytree Observation Deck',
        description: 'Visit Japan\'s tallest structure for breathtaking city views.',
        time: '10:00',
        location: '1 Chome-1-2 Oshiage, Sumida City, Tokyo 131-0045',
        category: 'attraction',
        priority: 'high'
      },
      {
        title: 'Tsukiji Outer Market Food Tour',
        description: 'Sample fresh seafood and Japanese delicacies at the famous market.',
        time: '08:00',
        location: '4 Chome-16-2 Tsukiji, Chuo City, Tokyo 104-0045',
        category: 'restaurant',
        priority: 'high'
      },
      {
        title: 'Meiji Shrine & Yoyogi Park',
        description: 'Visit the serene Shinto shrine dedicated to Emperor Meiji.',
        time: '09:00',
        location: '1-1 Yoyogikamizonocho, Shibuya City, Tokyo 151-8557',
        category: 'attraction',
        priority: 'medium'
      },
      {
        title: 'Shibuya Crossing Experience',
        description: 'Witness the world\'s busiest pedestrian crossing in action.',
        time: '19:00',
        location: '2 Chome-2-1 Dogenzaka, Shibuya City, Tokyo 150-0043',
        category: 'activity',
        priority: 'high'
      },
      {
        title: 'Robot Restaurant Show',
        description: 'Experience the wildest show in Tokyo with robots, dancers, and lasers.',
        time: '20:30',
        location: '1 Chome-7-1 Kabukicho, Shinjuku City, Tokyo 160-0021',
        category: 'nightlife',
        priority: 'medium'
      },
      {
        title: 'Sensō-ji Temple Visit',
        description: 'Explore Tokyo\'s oldest and most significant Buddhist temple.',
        time: '11:30',
        location: '2 Chome-3-1 Asakusa, Taito City, Tokyo 111-0032',
        category: 'attraction',
        priority: 'high'
      },
      {
        title: 'Akihabara Electronics Shopping',
        description: 'Browse the latest gadgets and anime merchandise in Electric Town.',
        time: '15:00',
        location: 'Akihabara, Taito City, Tokyo 110-0006',
        category: 'shopping',
        priority: 'medium'
      },
      {
        title: 'Authentic Sushi Making Class',
        description: 'Learn to make sushi from a professional Japanese chef.',
        time: '13:00',
        location: '1 Chome-4-5 Nihonbashimuromachi, Chuo City, Tokyo 103-0022',
        category: 'activity',
        priority: 'high'
      },
      {
        title: 'Harajuku Takeshita Street Tour',
        description: 'Experience Japan\'s youth fashion culture and quirky shops.',
        time: '14:30',
        location: 'Takeshita Street, Jingumae, Shibuya City, Tokyo 150-0001',
        category: 'shopping',
        priority: 'medium'
      },
      {
        title: 'Sumo Tournament or Stable Visit',
        description: 'Watch Japan\'s national sport in action or see morning practice.',
        time: '10:30',
        location: 'Ryogoku Kokugikan, 1 Chome-3-28 Yokoami, Sumida City, Tokyo 130-0015',
        category: 'activity',
        priority: 'high'
      },
      {
        title: 'Shinjuku Gyoen National Garden',
        description: 'Relax in one of Tokyo\'s most beautiful and spacious parks.',
        time: '14:00',
        location: '11 Naitomachi, Shinjuku City, Tokyo 160-0014',
        category: 'activity',
        priority: 'medium'
      },
      {
        title: 'Izakaya Hopping in Shinjuku',
        description: 'Experience Japanese pub culture with food and drinks at multiple venues.',
        time: '19:30',
        location: 'Omoide Yokocho, 1 Chome Nishishinjuku, Shinjuku City, Tokyo 160-0023',
        category: 'nightlife',
        priority: 'high'
      }
    ],
    
    // London activities
    'London': [
      {
        title: 'Tower of London & Crown Jewels',
        description: 'Explore the historic fortress and see the magnificent Crown Jewels.',
        time: '09:30',
        location: 'Tower Hill, London EC3N 4AB',
        category: 'attraction',
        priority: 'high'
      },
      {
        title: 'British Museum Guided Tour',
        description: 'Discover world treasures including the Rosetta Stone and Egyptian mummies.',
        time: '10:00',
        location: 'Great Russell St, Bloomsbury, London WC1B 3DG',
        category: 'attraction',
        priority: 'high'
      },
      {
        title: 'London Eye Experience',
        description: 'Enjoy breathtaking 360° views of London from Europe\'s tallest observation wheel.',
        time: '16:00',
        location: 'Riverside Building, County Hall, London SE1 7PB',
        category: 'attraction',
        priority: 'high'
      },
      {
        title: 'Westminster Abbey Visit',
        description: 'Tour the historic gothic church where British monarchs are crowned.',
        time: '11:30',
        location: '20 Deans Yd, Westminster, London SW1P 3PA',
        category: 'attraction',
        priority: 'medium'
      },
      {
        title: 'Traditional Afternoon Tea at The Ritz',
        description: 'Indulge in the quintessential British tradition of afternoon tea.',
        time: '15:30',
        location: '150 Piccadilly, St. James\'s, London W1J 9BR',
        category: 'restaurant',
        priority: 'medium'
      },
      {
        title: 'Buckingham Palace Changing of the Guard',
        description: 'Watch the elaborate ceremony of the Queen\'s Guard handover.',
        time: '10:45',
        location: 'Buckingham Palace, Westminster, London SW1A 1AA',
        category: 'attraction',
        priority: 'high'
      },
      {
        title: 'Shakespeare\'s Globe Theatre Tour',
        description: 'Visit the reconstruction of Shakespeare\'s historic playhouse.',
        time: '13:00',
        location: '21 New Globe Walk, London SE1 9DT',
        category: 'attraction',
        priority: 'medium'
      },
      {
        title: 'Camden Market Shopping',
        description: 'Browse hundreds of stalls selling crafts, clothing, and street food.',
        time: '14:30',
        location: 'Camden Lock Place, London NW1 8AF',
        category: 'shopping',
        priority: 'medium'
      },
      {
        title: 'West End Show - "The Phantom of the Opera"',
        description: 'Experience one of London\'s longest-running and most spectacular musicals.',
        time: '19:30',
        location: 'Her Majesty\'s Theatre, Haymarket, London SW1Y 4QL',
        category: 'nightlife',
        priority: 'high'
      },
      {
        title: 'Borough Market Foodie Tour',
        description: 'Sample artisanal foods at London\'s most renowned food market.',
        time: '12:00',
        location: '8 Southwark St, London SE1 1TL',
        category: 'restaurant',
        priority: 'high'
      },
      {
        title: 'Churchill War Rooms',
        description: 'Explore the underground headquarters where Churchill directed WWII.',
        time: '14:00',
        location: 'Clive Steps, King Charles St, London SW1A 2AQ',
        category: 'attraction',
        priority: 'medium'
      },
      {
        title: 'Historic Pub Crawl',
        description: 'Visit centuries-old pubs with fascinating stories and traditional ales.',
        time: '18:00',
        location: 'The Prospect of Whitby, 57 Wapping Wall, London E1W 3SH',
        category: 'nightlife',
        priority: 'medium'
      }
    ],

    // Sydney activities
    'Sydney': [
      {
        title: 'Sydney Opera House Tour',
        description: 'Go behind the scenes of this UNESCO World Heritage masterpiece.',
        time: '10:00',
        location: 'Bennelong Point, Sydney NSW 2000',
        category: 'attraction',
        priority: 'high'
      },
      {
        title: 'Bondi to Coogee Coastal Walk',
        description: 'Experience stunning ocean views along this famous coastal trail.',
        time: '09:00',
        location: 'Notts Ave, Bondi Beach NSW 2026',
        category: 'activity',
        priority: 'high'
      },
      {
        title: 'Sydney Harbour Bridge Climb',
        description: 'Scale the iconic "Coathanger" for unparalleled harbour views.',
        time: '13:00',
        location: '3 Cumberland St, The Rocks NSW 2000',
        category: 'activity',
        priority: 'high'
      },
      {
        title: 'Taronga Zoo Sydney',
        description: 'See Australian wildlife and exotic animals with stunning harbour backdrops.',
        time: '09:30',
        location: 'Bradleys Head Rd, Mosman NSW 2088',
        category: 'attraction',
        priority: 'medium'
      },
      {
        title: 'Quay Restaurant Fine Dining',
        description: 'Enjoy award-winning cuisine with Opera House and Harbour Bridge views.',
        time: '19:00',
        location: 'Upper Level, Overseas Passenger Terminal, The Rocks NSW 2000',
        category: 'restaurant',
        priority: 'high'
      },
      {
        title: 'Royal Botanic Garden Tour',
        description: 'Explore Australia\'s oldest botanic garden with Aboriginal heritage guides.',
        time: '11:30',
        location: 'Mrs Macquaries Rd, Sydney NSW 2000',
        category: 'activity',
        priority: 'medium'
      },
      {
        title: 'Manly Beach Day Trip',
        description: 'Take the scenic ferry to this beautiful beach for swimming and surfing.',
        time: '10:00',
        location: 'Manly Beach, Manly NSW 2095',
        category: 'activity',
        priority: 'medium'
      },
      {
        title: 'The Rocks Historic District Walk',
        description: 'Discover Sydney\'s oldest neighborhood with cobblestone streets.',
        time: '15:00',
        location: 'The Rocks, Sydney NSW 2000',
        category: 'attraction',
        priority: 'medium'
      },
      {
        title: 'Sydney Fish Market Tour',
        description: 'Visit the 3rd largest fish market in the world with fresh seafood tastings.',
        time: '08:00',
        location: 'Bank St & Pyrmont Bridge Road, Sydney NSW 2009',
        category: 'activity',
        priority: 'medium'
      },
      {
        title: 'Blue Mountains Day Trip',
        description: 'Explore the stunning natural beauty, including the Three Sisters formation.',
        time: '08:30',
        location: 'Blue Mountains National Park, NSW',
        category: 'activity',
        priority: 'high'
      }
    ]
  };

  // Create array to hold all activities
  let allActivities: Omit<GeneratedActivity, 'id'>[] = [];
  
  // First, try to find destination-specific activities
  const matchedDestination = Object.keys(destinationActivities).find(
    place => destination.toLowerCase().includes(place.toLowerCase())
  );
  
  // If we have activities for this destination, use them
  if (matchedDestination && destinationActivities[matchedDestination]) {
    allActivities = [...destinationActivities[matchedDestination]];
  } else {
    // Otherwise, use generic activities with destination name inserted
    allActivities = [
      {
        title: `${destination} Walking Tour`,
        description: `Explore the historic center of ${destination} with a knowledgeable local guide.`,
        time: '09:00',
        location: `${destination} City Center`,
        category: 'activity',
        priority: 'high'
      },
      {
        title: `${destination} National Museum`,
        description: `Discover the history and culture of ${destination} through fascinating exhibits.`,
        time: '11:00',
        location: `Central Museum District, ${destination}`,
        category: 'attraction',
        priority: 'high'
      },
      {
        title: `${destination} Signature Restaurant`,
        description: `Experience authentic local cuisine at one of ${destination}'s most renowned restaurants.`,
        time: '13:00',
        location: `Gastronomy Quarter, ${destination}`,
        category: 'restaurant',
        priority: 'high'
      },
      {
        title: `${destination} Landmark Visit`,
        description: `See the most iconic landmark that ${destination} is famous for worldwide.`,
        time: '15:00',
        location: `Central District, ${destination}`,
        category: 'attraction',
        priority: 'high'
      },
      {
        title: `${destination} Local Market`,
        description: `Browse stalls selling local crafts, foods and unique souvenirs.`,
        time: '16:30',
        location: `Old Market Square, ${destination}`,
        category: 'shopping',
        priority: 'medium'
      },
      {
        title: `${destination} Panoramic Viewpoint`,
        description: `Enjoy breathtaking views of the entire city from this elevated viewpoint.`,
        time: '18:00',
        location: `Scenic Lookout, ${destination}`,
        category: 'attraction',
        priority: 'medium'
      },
      {
        title: `${destination} Cultural Performance`,
        description: `Watch a traditional performance showcasing local music and dance.`,
        time: '20:00',
        location: `Arts Center, ${destination}`,
        category: 'nightlife',
        priority: 'medium'
      },
      {
        title: `${destination} Historic District Tour`,
        description: `Wander through charming streets with centuries-old architecture.`,
        time: '10:00',
        location: `Old Town, ${destination}`,
        category: 'attraction',
        priority: 'medium'
      }
    ];
  }

  // Activity-specific additions based on user preferences
  if (activities.toLowerCase().includes('adventure') || activities.toLowerCase().includes('outdoor')) {
    allActivities.push({
      title: `${destination} Outdoor Adventure Park`,
      description: 'Experience thrilling outdoor activities like hiking, zip-lining, or water sports.',
      time: '10:00',
      location: `Adventure Center, ${destination} National Park`,
      category: 'activity',
      priority: 'medium'
    });
    
    allActivities.push({
      title: `${destination} Scenic Bike Tour`,
      description: 'Explore the natural beauty on two wheels with stunning panoramic views.',
      time: '14:00',
      location: `Bike Rental Center, ${destination} Park`,
      category: 'activity',
      priority: 'medium'
    });
  }

  if (activities.toLowerCase().includes('shopping') || activities.toLowerCase().includes('market')) {
    allActivities.push({
      title: `${destination} Premium Shopping Mall`,
      description: 'Shop at high-end boutiques and international brands in this luxury mall.',
      time: '13:00',
      location: `Fashion District, ${destination}`,
      category: 'shopping',
      priority: 'medium'
    });
    
    allActivities.push({
      title: `${destination} Artisan Craft Market`,
      description: 'Discover unique handmade goods and meet local artisans.',
      time: '16:00',
      location: `Artisan Quarter, ${destination}`,
      category: 'shopping',
      priority: 'medium'
    });
  }

  if (activities.toLowerCase().includes('nightlife') || activities.toLowerCase().includes('entertainment')) {
    allActivities.push({
      title: `${destination} Jazz Club Night`,
      description: 'Enjoy live music and cocktails at this renowned jazz venue.',
      time: '21:00',
      location: `Music District, ${destination}`,
      category: 'nightlife',
      priority: 'medium'
    });
    
    allActivities.push({
      title: `${destination} Rooftop Bar Experience`,
      description: 'Sip cocktails with stunning city views at this trendy rooftop venue.',
      time: '19:30',
      location: `Sky Lounge, Downtown ${destination}`,
      category: 'nightlife',
      priority: 'medium'
    });
  }

  if (activities.toLowerCase().includes('food') || activities.toLowerCase().includes('culinary')) {
    allActivities.push({
      title: `${destination} Food Walking Tour`,
      description: 'Sample local delicacies at multiple stops with an expert culinary guide.',
      time: '12:00',
      location: `Gourmet Quarter, ${destination}`,
      category: 'restaurant',
      priority: 'high'
    });
    
    allActivities.push({
      title: `${destination} Cooking Class`,
      description: 'Learn to prepare authentic local dishes with a professional chef.',
      time: '17:00',
      location: `Culinary Institute, ${destination}`,
      category: 'activity',
      priority: 'medium'
    });
  }

  if (activities.toLowerCase().includes('culture') || activities.toLowerCase().includes('history')) {
    allActivities.push({
      title: `${destination} Historical Museum Tour`,
      description: 'Discover fascinating artifacts and exhibits about the region\'s rich history.',
      time: '10:30',
      location: `National Museum, ${destination}`,
      category: 'attraction',
      priority: 'high'
    });
    
    allActivities.push({
      title: `${destination} Archaeological Site Visit`,
      description: 'Explore ancient ruins and historical landmarks with an expert guide.',
      time: '14:30',
      location: `Archaeological Park, ${destination}`,
      category: 'attraction',
      priority: 'medium'
    });
  }

  // Companion-specific modifications
  if (isCouple) {
    allActivities.push({
      title: `Romantic Dinner Cruise in ${destination}`,
      description: 'Enjoy a candlelit dinner while cruising through scenic waterways.',
      time: '19:00',
      location: `${destination} Harbor Marina`,
      category: 'restaurant',
      priority: 'high'
    });
    
    allActivities.push({
      title: `${destination} Couples Spa Retreat`,
      description: 'Relax with side-by-side massages and luxury spa treatments.',
      time: '15:00',
      location: `Luxury Spa Resort, ${destination}`,
      category: 'activity',
      priority: 'medium'
    });
  }

  if (isFamilyWithKids) {
    allActivities.push({
      title: `${destination} Interactive Children's Museum`,
      description: 'Let kids learn through play at this award-winning family attraction.',
      time: '10:00',
      location: `Children's Discovery Center, ${destination}`,
      category: 'attraction',
      priority: 'high'
    });
    
    allActivities.push({
      title: `${destination} Family Adventure Park`,
      description: 'Enjoy rides, games and attractions suitable for all ages.',
      time: '13:00',
      location: `Family Fun Center, ${destination}`,
      category: 'activity',
      priority: 'high'
    });
  }

  if (isGroupTravel) {
    allActivities.push({
      title: `${destination} Escape Room Challenge`,
      description: 'Work together to solve puzzles and escape within the time limit.',
      time: '16:00',
      location: `Puzzle House, ${destination}`,
      category: 'activity',
      priority: 'medium'
    });
    
    allActivities.push({
      title: `${destination} Group Karaoke Night`,
      description: 'Sing your favorite songs in a private room with friends.',
      time: '21:00',
      location: `Melody Karaoke Bar, ${destination}`,
      category: 'nightlife',
      priority: 'medium'
    });
  }

  // Ensure we have at least 10 activities
  while (allActivities.length < 10) {
    allActivities.push({
      title: `Explore ${destination} - Activity ${allActivities.length + 1}`,
      description: `Discover more of what ${destination} has to offer.`,
      time: `${10 + allActivities.length % 12}:00`,
      location: `${destination} City Area`,
      category: 'activity' as 'activity' | 'restaurant' | 'hotel' | 'transport' | 'flight' | 'attraction' | 'shopping' | 'nightlife' | 'other',
      priority: 'medium' as 'low' | 'medium' | 'high'
    });
  }

  // Shuffle and take appropriate number for multi-day trips
  const shuffledActivities = allActivities.sort(() => Math.random() - 0.5);
  
  // Add IDs and return
  return shuffledActivities.map((activity, index) => ({
    ...activity,
    id: `ai_activity_${index}`
  }));
};

// Distribute activities across trip days and convert to ItineraryItem format
const distributeActivitiesAcrossDays = (
  activities: GeneratedActivity[], 
  dateRange: string[],
  destination: string
): { [date: string]: ItineraryItem[] } => {
  const distributed: { [date: string]: ItineraryItem[] } = {};
  
  // Initialize each date with empty array
  dateRange.forEach(date => {
    distributed[date] = [];
  });

  // Sort activities by priority (high first) then by time
  const sortedActivities = [...activities].sort((a, b) => {
    if (a.priority !== b.priority) {
      const priorityOrder = { 'high': 0, 'medium': 1, 'low': 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    return a.time.localeCompare(b.time);
  });

  // Calculate optimal activities per day for even distribution
  const totalActivities = sortedActivities.length;
  const totalDays = dateRange.length;
  const baseActivitiesPerDay = Math.floor(totalActivities / totalDays);
  const extraActivities = totalActivities % totalDays;

  console.log(`Distributing ${totalActivities} activities across ${totalDays} days:`);
  console.log(`Base activities per day: ${baseActivitiesPerDay}, Extra activities to distribute: ${extraActivities}`);

  // Distribute activities evenly using round-robin approach
  let activityIndex = 0;
  
  // First, give each day the base number of activities
  for (let dayIndex = 0; dayIndex < totalDays; dayIndex++) {
    const targetDate = dateRange[dayIndex];
    const activitiesForThisDay = baseActivitiesPerDay + (dayIndex < extraActivities ? 1 : 0);
    
    console.log(`Day ${dayIndex + 1} (${targetDate}): ${activitiesForThisDay} activities`);
    
    for (let i = 0; i < activitiesForThisDay && activityIndex < totalActivities; i++) {
      const activity = sortedActivities[activityIndex];
      
      const itineraryItem: ItineraryItem = {
        id: activity.id,
        trip_id: '', // Empty in preview mode
        user_id: '', // Empty in preview mode
        title: activity.title,
        description: activity.description,
        date: targetDate,
        time: activity.time,
        location: activity.location,
        category: activity.category,
        priority: activity.priority,
        item_order: i + 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      distributed[targetDate].push(itineraryItem);
      activityIndex++;
    }
  }
  
  // Sort each day's activities by time and reassign item_order
  dateRange.forEach(date => {
    distributed[date].sort((a, b) => a.time.localeCompare(b.time));
    
    // Reassign item_order based on sorted time
    distributed[date].forEach((item, index) => {
      item.item_order = index + 1;
    });
    
    console.log(`Final day ${date}: ${distributed[date].length} activities`);
  });
  
  // If any day somehow has no activities (shouldn't happen with new logic), add a placeholder
  dateRange.forEach((date, index) => {
    if (distributed[date].length === 0) {
      console.warn(`Day ${date} has no activities, adding placeholder`);
      const genericItem: ItineraryItem = {
        id: `generic_${index}`,
        trip_id: '',
        user_id: '',
        title: `Explore ${destination} - Free Day`,
        description: 'This day is open for spontaneous exploration or relaxation.',
        date: date,
        time: '10:00',
        location: 'Your choice',
        category: 'activity',
        priority: 'medium',
        item_order: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      distributed[date].push(genericItem);
    }
  });
  
  return distributed;
};

export default function InitialItineraryPreviewModal({ 
  visible, 
  tripData, 
  onComplete, 
  onCancel 
}: InitialItineraryPreviewModalProps) {
  const [phase, setPhase] = useState<'loading' | 'preview'>('loading');
  const [currentLoadingMessage, setCurrentLoadingMessage] = useState(0);
  const [generatedActivities, setGeneratedActivities] = useState<GeneratedActivity[]>([]);
  const [dailyItineraries, setDailyItineraries] = useState<DailyItinerary[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | undefined>(undefined);
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());

  // Animation values
  const fadeAnim = new Animated.Value(1);
  const scaleAnim = new Animated.Value(1);
  const rotateAnim = new Animated.Value(0);

  // Loading animation
  useEffect(() => {
    if (phase === 'loading') {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(scaleAnim, {
              toValue: 1.1,
              duration: 1000,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(rotateAnim, {
              toValue: 1,
              duration: 2000,
              easing: Easing.linear,
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(scaleAnim, {
              toValue: 1,
              duration: 1000,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
          ]),
        ])
      );
      animation.start();
      
      return () => animation.stop();
    }
  }, [phase]);

  // Loading message rotation
  useEffect(() => {
    if (phase === 'loading') {
      const interval = setInterval(() => {
        setCurrentLoadingMessage(prev => (prev + 1) % LOADING_MESSAGES.length);
      }, 1200);
      
      return () => clearInterval(interval);
    }
  }, [phase]);

  // Main loading sequence
  useEffect(() => {
    if (visible && phase === 'loading') {
      const generateItinerary = async () => {
        console.log('Starting itinerary generation for:', tripData.destination);
        
        try {
          // Create date range first to ensure it works
          const dateRange = generateDateRange(tripData.startDate, tripData.endDate);
          console.log('Generated date range:', dateRange);
          
          let activities: GeneratedActivity[] = [];
          
          try {
            // Try to generate AI itinerary with longer timeout
            console.log('Attempting AI generation...');
            activities = await Promise.race([
              generateAIItinerary(tripData),
              new Promise<GeneratedActivity[]>((_, reject) => 
                setTimeout(() => reject(new Error('AI timeout')), 15000)
              )
            ]);
            console.log('AI generation successful, activities:', activities.length);
          } catch (aiError) {
            console.log('AI generation failed, using mock data:', aiError);
            activities = generateMockActivities(tripData);
            console.log('Mock generation successful, activities:', activities.length);
          }
          
          setGeneratedActivities(activities);
          
          // Create daily itinerary structure
          const distributedActivities = distributeActivitiesAcrossDays(activities, dateRange, tripData.destination);
          console.log('Distributed activities across days:', Object.keys(distributedActivities));
          
          const dailies: DailyItinerary[] = dateRange.map(date => ({
            date,
            dayOfWeek: getDayOfWeek(date),
            formattedDate: formatDayHeader(date),
            items: distributedActivities[date] || [],
            isExpanded: true, // Start with all days expanded for preview
            itemCount: (distributedActivities[date] || []).length
          }));
          
          console.log('Created daily itineraries:', dailies.length);
          setDailyItineraries(dailies);
          setExpandedDays(new Set(dateRange)); // Expand all days
          setPhase('preview');
        } catch (error) {
          console.error('Critical error in itinerary generation:', error);
          
          // Emergency fallback - just use mock data with minimal processing
          try {
            const activities = generateMockActivities(tripData);
            const dateRange = generateDateRange(tripData.startDate, tripData.endDate);
            const distributedActivities = distributeActivitiesAcrossDays(activities, dateRange, tripData.destination);
            
            const dailies: DailyItinerary[] = dateRange.map(date => ({
              date,
              dayOfWeek: getDayOfWeek(date),
              formattedDate: formatDayHeader(date),
              items: distributedActivities[date] || [],
              isExpanded: true,
              itemCount: (distributedActivities[date] || []).length
            }));
            
            setGeneratedActivities(activities);
            setDailyItineraries(dailies);
            setExpandedDays(new Set(dateRange));
            setPhase('preview');
          } catch (fallbackError) {
            console.error('Even fallback failed:', fallbackError);
            // Last resort - just show empty state but get out of loading
            setPhase('preview');
          }
        }
      };

      const timer = setTimeout(() => {
        generateItinerary();
      }, 5000); // Increased to 5 seconds to allow more time for AI
      
      return () => clearTimeout(timer);
    }
  }, [visible, tripData]);

  // Reset state when modal opens
  useEffect(() => {
    if (visible) {
      setPhase('loading');
      setCurrentLoadingMessage(0);
      setGeneratedActivities([]);
      setDailyItineraries([]);
      setExpandedDays(new Set());
      setSelectedDate(undefined);
      fadeAnim.setValue(1);
      scaleAnim.setValue(1);
      rotateAnim.setValue(0);
    }
  }, [visible]);

  // Handle date selection
  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setExpandedDays(prev => {
      const newSet = new Set(prev);
      if (newSet.has(date)) {
        newSet.delete(date);
      } else {
        newSet.add(date);
      }
      return newSet;
    });
  };

  // Handle day toggle
  const handleDayToggle = (date: string) => {
    setExpandedDays(prev => {
      const newSet = new Set(prev);
      if (newSet.has(date)) {
        newSet.delete(date);
      } else {
        newSet.add(date);
      }
      return newSet;
    });
    
    if (!expandedDays.has(date)) {
      setSelectedDate(date);
    }
  };

  // Handle keep activities
  const handleKeepActivities = () => {
    // Flatten the daily itineraries to get all items
    const allItems = dailyItineraries.flatMap(daily => daily.items);
    onComplete(true, allItems);
  };

  // Handle skip activities
  const handleSkipActivities = () => {
    onComplete(false);
  };

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onCancel}
    >
      <View className="flex-1 bg-primaryBG">
        {phase === 'loading' ? (
          // Loading Phase
          <View className="flex-1 justify-center items-center px-6">
            {/* Close button */}
            <TouchableOpacity
              onPress={onCancel}
              className="absolute top-12 right-6 z-10 p-3 rounded-full bg-white/10"
            >
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>

            {/* Loading Animation */}
            <Animated.View 
              style={{
                transform: [
                  { scale: scaleAnim },
                  { rotate: spin }
                ]
              }}
              className="mb-8"
            >
              <View className="w-24 h-24 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 items-center justify-center">
                <Ionicons name="airplane" size={40} color="white" />
              </View>
            </Animated.View>

            {/* Trip Info */}
            <View className="mb-8 items-center">
              <Text className="text-white text-3xl font-bold mb-2">
                {tripData.destination}
              </Text>
              <Text className="text-gray-300 text-lg">
                {new Date(tripData.startDate).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric' 
                })} - {new Date(tripData.endDate).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </Text>
            </View>

            {/* Loading Message */}
            <Animated.View style={{ opacity: fadeAnim }}>
              <Text className="text-white text-xl text-center mb-4">
                {LOADING_MESSAGES[currentLoadingMessage]}
              </Text>
            </Animated.View>

            {/* Loading Indicator */}
            <ActivityIndicator size="large" color="#60A5FA" />
            
            {/* Progress dots */}
            <View className="flex-row mt-8">
              {LOADING_MESSAGES.map((_, index) => (
                <View
                  key={index}
                  className={`w-2 h-2 rounded-full mx-1 ${
                    index <= currentLoadingMessage ? 'bg-blue-400' : 'bg-gray-600'
                  }`}
                />
              ))}
            </View>
          </View>
        ) : (
          // Preview Phase
          <View className="flex-1">
            {/* Header */}
            <View className="pt-12 pb-4 px-6 border-b border-white/10">
              <View className="flex-row justify-between items-center mb-4">
                <TouchableOpacity
                  onPress={onCancel}
                  className="p-2 rounded-full bg-white/10"
                >
                  <Ionicons name="close" size={24} color="white" />
                </TouchableOpacity>
                <Text className="text-white text-lg font-semibold">
                  Your Itinerary Preview
                </Text>
                <View className="w-10" />
              </View>
              
              <Text className="text-white text-2xl font-bold text-center">
                {tripData.destination}
              </Text>
              <Text className="text-gray-300 text-center mt-1">
                {new Date(tripData.startDate).toLocaleDateString('en-US', { 
                  weekday: 'long',
                  month: 'long', 
                  day: 'numeric' 
                })} - {new Date(tripData.endDate).toLocaleDateString('en-US', { 
                  weekday: 'long',
                  month: 'long', 
                  day: 'numeric' 
                })}
              </Text>
            </View>

            {/* Date Picker */}
            <DatePicker
              startDate={tripData.startDate}
              endDate={tripData.endDate}
              selectedDate={selectedDate}
              onDateSelect={handleDateSelect}
              onEditPress={() => {}} // Disabled in preview
            />

            {/* Itinerary Content */}
            <ScrollView 
              className="flex-1 px-4"
              showsVerticalScrollIndicator={false}
            >
              <Text className="text-gray-300 text-sm text-center mb-4 mx-4">
                ✨ Here's your AI-generated itinerary with personalized activities
              </Text>
              
              {dailyItineraries.map((daily) => (
                <DailyItinerarySection
                  key={daily.date}
                  date={daily.date}
                  items={daily.items}
                  isExpanded={expandedDays.has(daily.date)}
                  onToggle={handleDayToggle}
                  tripId="" // No trip ID in preview mode
                  onActivityAdded={() => {}} // Disabled in preview
                />
              ))}
              
              {/* Bottom padding for action buttons */}
              <View className="h-32" />
            </ScrollView>

            {/* Action Buttons */}
            <View className="absolute bottom-0 left-0 right-0 bg-black/20 backdrop-blur-lg border-t border-white/10">
              <View className="px-6 py-6">
                <View className="flex-row space-x-4">
                  <TouchableOpacity
                    onPress={handleSkipActivities}
                    className="flex-1 py-4 bg-white/10 rounded-xl border border-white/20"
                  >
                    <Text className="text-white text-center font-semibold text-lg">
                      Skip for Now
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    onPress={handleKeepActivities}
                    className="flex-1 py-4 bg-blue-500 rounded-xl"
                  >
                    <Text className="text-white text-center font-semibold text-lg">
                      Generate Itinerary
                    </Text>
                  </TouchableOpacity>
                </View>
                
                <Text className="text-gray-400 text-xs text-center mt-3">
                  You can always modify activities later in the chat
                </Text>
              </View>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
}
