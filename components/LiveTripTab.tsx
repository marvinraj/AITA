import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Animated, Image, Text, TouchableOpacity, View } from 'react-native';
import { useProfile } from '../hooks/useProfile';
import { itineraryService } from '../lib/services/itineraryService';
import { tripsService } from '../lib/services/tripsService';
import { Trip } from '../types/database';
import ItineraryTab from './ItineraryTab';
import LiveTripHeader from './LiveTripHeader';
import SavesTab from './SavesTab';
import TravelHubTab from './TravelHubTab';

// tabs for live trip
const TABS = [
  { key: 'Travel Hub', component: TravelHubTab },
  { key: 'Itinerary', component: ItineraryTab },
  { key: 'Saves', component: SavesTab },
  // { key: 'Budget', component: BudgetTab },
];

interface LiveTripTabProps {
  onTripChange?: (trip: Trip | null) => void;
  onChatPress?: () => void;
  onMapPress?: () => void;
}

export default function LiveTripTab({ onTripChange, onChatPress, onMapPress }: LiveTripTabProps) {
  const router = useRouter();
  const { profileData } = useProfile();
  
  // state to manage active tab
  const [activeTab, setActiveTab] = useState('Travel Hub');
  // trip state
  const [currentTrip, setCurrentTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  // state for itinerary items to analyze trip context
  const [itineraryItems, setItineraryItems] = useState<any[]>([]);
  const [itineraryLoading, setItineraryLoading] = useState(false);
  // state for rotating chat messages
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  // state for typing animation
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [canRotate, setCanRotate] = useState(false);
  const fadeAnim = useState(new Animated.Value(1))[0];

  // SMART MESSAGE GENERATOR BASED ON TRIP CONTEXT
  const generateSmartMessages = useCallback(() => {
    if (!currentTrip || !currentTrip.start_date || !currentTrip.end_date) {
      return [`Hey ${profileData.name}, ready to plan your next adventure?`];
    }

    const now = new Date();
    const startDate = new Date(currentTrip.start_date);
    const endDate = new Date(currentTrip.end_date);
    const daysUntilTrip = Math.ceil((startDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const daysIntoTrip = Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const isCurrentlyOnTrip = now >= startDate && now <= endDate;
    const hour = now.getHours();
    
    // Time-sensitive greetings
    const timeGreeting = hour < 12 ? 'Good morning!' : hour < 17 ? 'Good afternoon!' : 'Good evening!';
    
    let messages: string[] = [];

    // Real-time relevance: During trip dates
    if (isCurrentlyOnTrip) {
      // Check for upcoming activities (within 1 hour)
      const upcomingActivity = itineraryItems.find(item => {
        if (!item.time || !item.date) return false;
        
        const itemDate = new Date(item.date);
        const [hours, minutes] = item.time.split(':').map(Number);
        const activityDateTime = new Date(itemDate);
        activityDateTime.setHours(hours, minutes, 0, 0);
        
        const timeDiff = activityDateTime.getTime() - now.getTime();
        const oneHour = 60 * 60 * 1000; // 1 hour in milliseconds
        
        // Activity is within the next hour (but not past)
        return timeDiff > 0 && timeDiff <= oneHour;
      });

      if (upcomingActivity) {
        const [hours, minutes] = upcomingActivity.time.split(':').map(Number);
        const timeString = `${hours}:${minutes.toString().padStart(2, '0')}`;
        messages.push(`Reminder: ${upcomingActivity.title} at ${timeString} - less than 1 hour away!`);
        messages.push(`Don't forget your ${upcomingActivity.title} activity at ${timeString}!`);
      } else {
        messages.push(`How's your ${currentTrip.destination} trip going?`);
        messages.push(`${timeGreeting} Enjoying ${currentTrip.destination}?`);
        messages.push(`Need real-time tips for ${currentTrip.destination}?`);
      }
      return messages;
    }

    // Nearby trip dates (within 14 days)
    if (daysUntilTrip <= 14 && daysUntilTrip > 0) {
      if (daysUntilTrip === 1) {
        messages.push(`Your ${currentTrip.destination} trip starts tomorrow - need last-minute tips?`);
        messages.push(`Final preparations for ${currentTrip.destination}?`);
      } else {
        // Countdown messaging
        messages.push(`T-minus ${daysUntilTrip} days to your ${currentTrip.destination} vacation!`);
        messages.push(`${daysUntilTrip} days until ${currentTrip.destination} - getting excited?`);
      }
    }

    // Analyze itinerary completeness
    if (itineraryItems.length === 0) {
      // Empty itinerary
      messages.push(`Let's add some activities to your ${currentTrip.destination} trip!`);
      messages.push(`Your ${currentTrip.destination} itinerary is empty - let's fill it up!`);
    } else {
      // Check for incomplete planning - analyze gaps
      const tripDuration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      const daysCovered = new Set(itineraryItems.map(item => item.date)).size;
      
      if (daysCovered < tripDuration) {
        const missingDays = tripDuration - daysCovered;
        messages.push(`Missing plans for ${missingDays} day${missingDays > 1 ? 's' : ''} of your ${currentTrip.destination} trip. TRAVA's here to help you plan!`);
      }

      // Check for missing meal plans
      const hasDinnerPlans = itineraryItems.some(item => 
        item.time && parseInt(item.time.split(':')[0]) >= 18 && 
        (item.category === 'restaurant' || item.title.toLowerCase().includes('dinner'))
      );
      
      if (!hasDinnerPlans) {
        messages.push(`Missing dinner plans for your ${currentTrip.destination} trip?`);
      }

      // Check for day-specific gaps (simplified example for day 2)
      const day2Date = new Date(startDate);
      day2Date.setDate(day2Date.getDate() + 1);
      const day2Items = itineraryItems.filter(item => item.date === day2Date.toISOString().split('T')[0]);
      
      if (tripDuration >= 2 && day2Items.length === 0) {
        messages.push(`Missing plans for day 2 of your ${currentTrip.destination} trip?`);
      }
    }

    // Time-sensitive planning messages
    if (hour < 12) {
      messages.push(`${timeGreeting} Ready to plan today's ${currentTrip.destination} adventure?`);
    } else if (hour >= 18) {
      messages.push(`Evening planning session for ${currentTrip.destination}?`);
    }

    // Default fallback messages with trip context
    if (messages.length === 0) {
      messages.push(`Need help planning your ${currentTrip.destination} trip?`);
      messages.push(`Ready to explore ${currentTrip.destination}, ${profileData.name}?`);
      messages.push(`Let's make your ${currentTrip.destination} trip unforgettable!`);
    }

    return messages.slice(0, 4); // Return max 3 messages for rotation
  }, [currentTrip, itineraryItems, profileData.name]);

  // Dynamic messages for AI chat button - now smart and context-aware
  const chatMessages = useMemo(() => {
    return generateSmartMessages();
  }, [generateSmartMessages]);

  // Load current trip on component mount
  useEffect(() => {
    loadCurrentTrip();
  }, []);

  // Typing animation function - memoized with useCallback
  const typeMessage = useCallback((message: string) => {
    setIsTyping(true);
    setCanRotate(false);
    setDisplayedText('');
    
    let index = 0;
    const typingInterval = setInterval(() => {
      if (index < message.length) {
        setDisplayedText(message.substring(0, index + 1));
        index++;
      } else {
        clearInterval(typingInterval);
        setIsTyping(false);
        // Allow rotation only after typing is complete and a brief pause
        setTimeout(() => {
          setCanRotate(true);
        }, 6000); // 6 second pause after typing completes
      }
    }, 50);
  }, []);

  // Initialize with first message when profile data is available
  useEffect(() => {
    if (profileData.name && chatMessages.length > 0) {
      typeMessage(chatMessages[0]);
    }
  }, [profileData.name, typeMessage, chatMessages]);

  // Rotate chat messages with typing animation
  useEffect(() => {
    if (!profileData.name || chatMessages.length === 0 || !canRotate) return;
    
    const interval = setInterval(() => {
      // Only rotate if we're allowed to (typing is complete)
      if (canRotate && !isTyping) {
        // Fade out current text
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          // Change message index
          setCurrentMessageIndex((prevIndex) => {
            const newIndex = (prevIndex + 1) % chatMessages.length;
            // Start typing new message
            typeMessage(chatMessages[newIndex]);
            return newIndex;
          });
          
          // Fade in new text
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }).start();
        });
      }
    }, 1000); // Check every second if we can rotate

    return () => clearInterval(interval);
  }, [profileData.name, chatMessages, typeMessage, fadeAnim, canRotate, isTyping]);

  const loadCurrentTrip = async () => {
    try {
      setLoading(true);
      
      // Try to get the most recent trip
      const trip = await tripsService.getCurrentTrip();
      
      if (!trip) {
        // No trips found - don't create a default one
        setCurrentTrip(null);
        setItineraryItems([]);
        onTripChange?.(null);
      } else {
        setCurrentTrip(trip);
        onTripChange?.(trip);
        
        // Load itinerary items for smart messaging
        await loadItineraryItems(trip.id);
      }
    } catch (err) {
      console.error('Error loading current trip:', err);
      // Don't create fallback trip - let user start fresh
      setCurrentTrip(null);
      setItineraryItems([]);
      onTripChange?.(null);
    } finally {
      setLoading(false);
    }
  };

  // Load itinerary items for trip context analysis
  const loadItineraryItems = async (tripId: string) => {
    try {
      setItineraryLoading(true);
      const items = await itineraryService.getItineraryByTrip(tripId);
      setItineraryItems(items || []);
    } catch (error) {
      console.error('Error loading itinerary items:', error);
      setItineraryItems([]);
    } finally {
      setItineraryLoading(false);
    }
  };

  // Handle trip updates from the header
  const handleTripUpdate = async (updatedTrip: Trip) => {
    setCurrentTrip(updatedTrip);
    onTripChange?.(updatedTrip);
    // Reload itinerary items for updated context
    await loadItineraryItems(updatedTrip.id);
  };

  // Handle trip selection change from the header
  const handleTripChange = async (selectedTrip: Trip) => {
    setCurrentTrip(selectedTrip);
    onTripChange?.(selectedTrip);
    // Load itinerary items for new trip context
    await loadItineraryItems(selectedTrip.id);
  };

  // Handle chat button press
  const handleChatPress = () => {
    if (onChatPress) {
      onChatPress();
    } else if (currentTrip) {
      // Pass trip data as navigation params to help with context
      router.push({
        pathname: '/chatAI',
        params: {
          tripId: currentTrip.id,
          tripName: currentTrip.name,
          destination: currentTrip.destination,
          startDate: currentTrip.start_date,
          endDate: currentTrip.end_date,
          companions: currentTrip.companions,
          activities: currentTrip.activities,
          budget: currentTrip.budget
        }
      });
    }
  };

  // Handle map button press
  const handleMapPress = () => {
    if (onMapPress) {
      onMapPress();
    } else if (currentTrip) {
      // @ts-ignore - Router types not updated yet for new map route
      router.push(`/map?tripId=${currentTrip.id}`);
    }
  };
  
  // determine the active component based on the active tab
  const ActiveComponent = TABS.find(tab => tab.key === activeTab)?.component || TravelHubTab;

  // Handle get started button press
  const handleGetStarted = () => {
    // Navigate to create new trip page (TravelAI)
    router.push('/travelai');
  };

  // Show loading state while trip is being loaded
  if (loading) {
    return (
      <View className="flex-1 bg-primaryBG justify-center items-center">
        <Text className="text-secondaryFont">Loading your trips...</Text>
      </View>
    );
  }

  // Show new user experience if no trip exists
  if (!currentTrip) {
    return (
      <View className="flex-1 bg-primaryBG px-6">
        {/* Greeting */} 
        <View className="pt-4 pb-1">
          <Text className="text-primaryFont text-base font-UrbanistSemiBold">
            Welcome,  <Text className="text-2xl italic text-accentFont font-BellezaRegular">{profileData.name}</Text>
          </Text>
        </View>

        {/* New User Welcome Content */}
        <View className="flex-1 justify-center items-center px-4 mt-16">
          {/* GIF Animation */}
          <View className="items-center mb-6">
            <Image
              source={require('../assets/images/map3.gif')}
              style={{
                width: 200,
                height: 200,
                borderRadius: 16,
              }}
              resizeMode="cover"
            />
          </View>

          <View className="items-center mb-8">
            <Text className="text-primaryFont text-4xl font-BellezaRegular text-center mb-4">
              Build the perfect trip
            </Text>
            <Text className="text-secondaryFont text-base font-UrbanistSemiBold text-center leading-6 opacity-90">
              Create personalized itineraries with TRAVA's assistance.{'\n'}
              {/* Discover amazing places, save favorites, and{'\n'}
              plan every detail of your adventure. */}
            </Text>
          </View>

          <TouchableOpacity 
            onPress={handleGetStarted}
            className="bg-accentFont px-8 py-4 rounded-xl shadow-lg active:opacity-80"
          >
            <Text className="text-primaryBG text-lg font-UrbanistSemiBold font-semibold">
              Get Started
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-primaryBG">
      {/* greeting */} 
      <View className="pt-4 pb-1">
        <Text className="text-primaryFont text-base font-UrbanistSemiBold">
          Welcome,  <Text className="text-2xl italic text-accentFont font-BellezaRegular">{profileData.name}</Text>
        </Text>
      </View>
      
      {/* main header component with white shadow  */}
      <View style={{
        shadowColor: '#ffffff',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 10,
      }}>
        <LiveTripHeader 
          trip={currentTrip} 
          onTripUpdate={handleTripUpdate} 
          onTripChange={handleTripChange}
          onMapPress={handleMapPress}
        />
      </View>

      {/* AI Chat Banner Button */}
      <View className="">
        <TouchableOpacity onPress={handleChatPress} activeOpacity={0.8}>
          <LinearGradient
            colors={['#16213e', '#EF4444']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              borderRadius: 16,
              padding: 14,
              opacity: 0.8,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3,
            }}
          >
            <View className="flex-row items-center justify-center">
              <Ionicons name="sparkles" size={14} color="#FFFFFF" style={{ marginRight: 12 }} />
              <Animated.View style={{ opacity: fadeAnim, flex: 1 }}>
                <Text className="text-white text-base font-UrbanistSemiBold">
                  {displayedText}
                  {isTyping && (
                    <Text className="text-white text-base font-UrbanistSemiBold">|</Text>
                  )}
                </Text>
              </Animated.View>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </View>
      
      {/* live trip tabs */}
      <View className="flex-row items-end border-border mb-2 mt-6">
        {TABS.map(tab => {
          const isActive = activeTab === tab.key;
          return (
            <View key={tab.key} style={{ position: 'relative', marginRight: 24, paddingBottom: 4, alignItems: 'center' }}>
              <Text
                className={
                  isActive
                    ? 'text-[#f48080] font-UrbanistSemiBold text-base'
                    : 'text-secondaryFont font-UrbanistSemiBold text-base'
                }
                onPress={() => setActiveTab(tab.key)}
              >
                {tab.key}
              </Text>
              {isActive && (
                <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 2, backgroundColor: '#f48080', borderRadius: 2 }} />
              )}
            </View>
          );
        })}
      </View>
      
      {/* Active Tab Content - SCROLLABLE */}
      <View className="flex-1">
        <ActiveComponent trip={currentTrip} onTripUpdate={setCurrentTrip} />
      </View>
    </View>
  );
}
