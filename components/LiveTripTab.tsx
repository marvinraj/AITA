import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Animated, Image, Text, TouchableOpacity, View } from 'react-native';
import { useProfile } from '../hooks/useProfile';
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
  // state for rotating chat messages
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  // state for typing animation
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [canRotate, setCanRotate] = useState(false);
  const fadeAnim = useState(new Animated.Value(1))[0];

  // Dynamic messages for AI chat button - memoized to prevent re-creation
  const chatMessages = useMemo(() => [
    `Hey, need help with planning your trip?`,
    `Ready to explore ${profileData.name}? Let's plan together!`,
    `${profileData.name}, I can help you discover amazing places!`,
    `Planning made easy, ${profileData.name}. Just ask me!`,
    `${profileData.name}, let's make your trip unforgettable!`
  ], [profileData.name]);

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
        }, 6000); // 4 second pause after typing completes
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
        onTripChange?.(null);
      } else {
        setCurrentTrip(trip);
        onTripChange?.(trip);
      }
    } catch (err) {
      console.error('Error loading current trip:', err);
      // Don't create fallback trip - let user start fresh
      setCurrentTrip(null);
      onTripChange?.(null);
    } finally {
      setLoading(false);
    }
  };

  // Handle trip updates from the header
  const handleTripUpdate = (updatedTrip: Trip) => {
    setCurrentTrip(updatedTrip);
    onTripChange?.(updatedTrip);
  };

  // Handle trip selection change from the header
  const handleTripChange = (selectedTrip: Trip) => {
    setCurrentTrip(selectedTrip);
    onTripChange?.(selectedTrip);
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
          activities: currentTrip.activities
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
        <View className="pt-4 pb-4">
          <Text className="text-primaryFont text-3xl font-BellezaRegular">
            Hey, {profileData.name}
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
              Create personalized itineraries with AITA's assistance.{'\n'}
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
      <View className="pt-4 pb-4">
        <Text className="text-primaryFont text-3xl font-BellezaRegular">
          Hey, {profileData.name}
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
