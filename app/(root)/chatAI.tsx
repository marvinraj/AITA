import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Dimensions, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { GestureHandlerRootView, PanGestureHandler } from 'react-native-gesture-handler';
import Markdown from 'react-native-markdown-display';
import Animated, { runOnJS, useAnimatedGestureHandler, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { AddToItineraryModal } from '../../components/AddToItineraryModal';
import EditTripModal from '../../components/EditTripModal';
import ItineraryWrapper, { ItineraryWrapperRef } from '../../components/ItineraryWrapper'; // New wrapper component
import { StructuredResponse } from '../../components/StructuredResponse';
import { TripContext, useAIChat } from '../../hooks/useAIChat';
import { ItineraryService } from '../../lib/services/itineraryService';
import { TripsService } from '../../lib/services/tripsService';
import { Trip } from '../../types/database';

// interface for trip context passed from smart form
// re-exporting from hook for consistency

// This enhancement gives the AI real-time awareness of the user's itinerary:
//
// REAL-TIME CONTEXT:
// - Loads current itinerary items when chat initializes
// - Refreshes AI context whenever items are added/deleted
// - Includes schedule info in all AI conversations
//
// SMART RECOMMENDATIONS:
// - AI avoids suggesting duplicate activities
// - Fills gaps in the schedule intelligently  
// - Suggests nearby activities to existing plans
// - Considers timing and logistics in recommendations
//
// USER BENEFITS:
// - Much more relevant and contextual suggestions
// - Better trip optimization and planning
// - Reduced duplicate recommendations
// - Smarter scheduling assistance
// ================================

//  constants
const HEADER_HEIGHT = 55;
const DIVIDER_HEIGHT = 4;
const SCREEN_HEIGHT = Dimensions.get('window').height;

const chatAI = () => {
  // get all trip context from navigation parameters (passed when navigating to this screen)
  const { 
    tripId, 
    tripName, 
    destination, 
    startDate, 
    endDate, 
    companions, 
    activities 
  } = useLocalSearchParams<{ 
    tripId: string;
    tripName?: string;
    destination?: string;
    startDate?: string;
    endDate?: string;
    companions?: string;
    activities?: string;
  }>();
  
  
  const router = useRouter();
  
  const tripsService = new TripsService();
  const itineraryService = new ItineraryService();
  
  const [trip, setTrip] = useState<Trip | null>(null);
  const [tripLoading, setTripLoading] = useState(true);
  
  // Add state for itinerary items to provide AI context
  const [itineraryItems, setItineraryItems] = useState<any[]>([]);
  const [itineraryLoading, setItineraryLoading] = useState(false);
  
  // Modal state for adding to itinerary
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedRecommendation, setSelectedRecommendation] = useState<any>(null);
  
  // Modal state for editing trip details
  const [showEditTripModal, setShowEditTripModal] = useState(false);
  
  // memoize trip context to prevent unnecessary re-creation and re-renders
  const tripContext: TripContext | undefined = useMemo(() => {
    console.log('Evaluating tripContext with:', {
      fromNavigation: { tripName, destination, startDate, endDate, companions, activities },
      fromTrip: trip ? { name: trip.name, destination: trip.destination, start_date: trip.start_date } : null,
      itineraryItemsCount: itineraryItems.length
    });
    
    // Format itinerary items for AI context
    const formattedItineraryItems = itineraryItems.map(item => ({
      date: item.date,
      time: item.time,
      title: item.title,
      description: item.description,
      location: item.location,
      category: item.category
    }));
    
    // First try to use navigation parameters (from smart form)
    if (tripName && destination && startDate && endDate && companions && activities) {
      return {
        tripName,
        destination,
        startDate,
        endDate,
        companions,
        activities,
        itineraryItems: formattedItineraryItems
      };
    }
    
    // Fallback to loaded trip data (when navigating from existing trips)
    if (trip && trip.destination && trip.start_date && trip.end_date && trip.companions && trip.activities) {
      return {
        tripName: trip.name && trip.name.trim() !== '' ? trip.name : `${trip.destination} Trip`,
        destination: trip.destination,
        startDate: trip.start_date,
        endDate: trip.end_date,
        companions: trip.companions,
        activities: trip.activities,
        itineraryItems: formattedItineraryItems
      };
    }
    
    return undefined;
  }, [tripName, destination, startDate, endDate, companions, activities, trip, itineraryItems]);

  // Add debugging for tripContext
  useEffect(() => {
    console.log('TripContext updated:', {
      tripName: tripContext?.tripName || 'undefined',
      itineraryItemsCount: tripContext?.itineraryItems?.length || 0,
      itineraryItems: tripContext?.itineraryItems?.map(item => `${item.date} ${item.time}: ${item.title}`).join(', ') || 'none'
    });
  }, [tripContext, trip, tripLoading, itineraryItems]);
  
  // use persistent AI chat hook - automatically loads/creates chat for this trip
  // Only initialize when we have either navigation params or loaded trip data AND itinerary data
  const shouldInitializeChat = useMemo(() => {
    // If we have navigation params, we can initialize immediately
    if (tripName && destination && startDate && endDate && companions && activities) {
      return true;
    }
    // If we're loading from existing trip, wait for both trip and itinerary data to load
    const canInitialize = !tripLoading && !itineraryLoading && trip !== null;
    console.log('Chat initialization decision:', {
      tripLoading,
      itineraryLoading,
      hasTrip: !!trip,
      canInitialize
    });
    return canInitialize;
  }, [tripName, destination, startDate, endDate, companions, activities, tripLoading, itineraryLoading, trip]);

  const {
    chat,
    messages,
    loading,
    error,
    sendMessage,
    isReady,
    generateSuggestions,
    isTyping
  } = useAIChat({
    tripId: tripId || '',
    autoLoad: shouldInitializeChat,
    tripContext
  });
  
  // state to manage the height of the top panel
  const initialTopHeight = (SCREEN_HEIGHT - HEADER_HEIGHT) * 0.2;
  const [topHeight, setTopHeight] = useState(initialTopHeight);
  
  // Animated values for smooth gesture handling
  const topHeightAnimated = useSharedValue(initialTopHeight);
  const gestureStartHeight = useSharedValue(0);
  
  // ref to store the initial height during gesture
  const initialTopHeightRef = useRef(initialTopHeight);
  // state to manage the input text
  const [input, setInput] = useState("");
  // ref for scrollview
  const scrollViewRef = useRef<ScrollView>(null);
  // ref for itinerary wrapper to trigger refresh
  const itineraryWrapperRef = useRef<ItineraryWrapperRef>(null);
  // state for smart suggestions
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // load trip data when component mounts
  useEffect(() => {
    const loadTrip = async () => {
      if (!tripId) return;
      
      try {
        setTripLoading(true);
        console.log('Loading trip data for tripId:', tripId);
        const tripData = await tripsService.getTripById(tripId);
        console.log('Loaded trip data:', tripData);
        console.log('Trip name from database:', tripData?.name);
        console.log('Trip name is empty or null:', !tripData?.name || tripData.name.trim() === '');
        setTrip(tripData);
        console.log('Trip state updated, tripContext should be re-evaluated');
      } catch (error) {
        console.error('Failed to load trip:', error);
      } finally {
        setTripLoading(false);
      }
    };

    loadTrip();
  }, [tripId]);

  // NEW: Load itinerary items for AI context
  const loadItineraryItems = async () => {
    if (!tripId) return;
    
    try {
      setItineraryLoading(true);
      console.log('Loading itinerary items for AI context...');
      const items = await itineraryService.getItineraryByTrip(tripId);
      console.log('Loaded itinerary items:', items.length);
      setItineraryItems(items);
    } catch (error) {
      console.error('Failed to load itinerary items:', error);
      setItineraryItems([]); // Set empty array on error
    } finally {
      setItineraryLoading(false);
    }
  };

  // Load itinerary items when trip is loaded
  useEffect(() => {
    if (trip) {
      loadItineraryItems();
    }
  }, [trip]);

  // Handle trip updates from ItineraryWrapper (e.g., when dates are edited)
  const handleTripUpdate = (updatedTrip: Trip) => {
    console.log('ChatAI: Trip updated from itinerary', updatedTrip);
    
    // Update local trip state
    setTrip(updatedTrip);
    
    // Refresh itinerary items when trip is updated
    loadItineraryItems();
    
    // TODO: Could also update AI chat context if trip context changes
    // This would refresh the AI with new trip information
  };

  // Function to update React state from animated value
  const updateTopHeight = (newHeight: number) => {
    setTopHeight(newHeight);
  };

  // Smooth gesture handler using reanimated
  const gestureHandler = useAnimatedGestureHandler({
    onStart: (_, context: { startHeight: number }) => {
      context.startHeight = topHeightAnimated.value;
      gestureStartHeight.value = topHeightAnimated.value;
    },
    onActive: (event, context: { startHeight: number }) => {
      const newHeight = context.startHeight + event.translationY;
      const constrainedHeight = Math.max(100, Math.min(newHeight, SCREEN_HEIGHT - HEADER_HEIGHT - 100 - DIVIDER_HEIGHT));
      topHeightAnimated.value = constrainedHeight;
    },
    onEnd: (event) => {
      const finalHeight = topHeightAnimated.value;
      // Use spring animation for smooth finish
      topHeightAnimated.value = withSpring(finalHeight, {
        damping: 20,
        stiffness: 90,
      });
      // Update React state for layout calculations
      runOnJS(updateTopHeight)(finalHeight);
    },
  });

  // Animated style for the top panel
  const animatedTopPanelStyle = useAnimatedStyle(() => {
    return {
      height: topHeightAnimated.value,
    };
  });

  // ----- MESSAGE HANDLING -----

  // Function to handle sending messages (now uses persistent storage)
  const handleSend = async () => {
    if (input.trim() === "" || loading || !isReady) return;
    
    try {
      await sendMessage(input);
      setInput(""); // Clear input after successful send
      setShowSuggestions(false); // Hide suggestions after sending
    } catch (error) {
      console.error('Error sending message:', error);
      // Error handling is already done in the hook
    }
  };

  // Handle suggestion tap
  const handleSuggestionTap = (suggestion: string) => {
    setInput(suggestion);
    setShowSuggestions(false);
  };

  // Handle adding recommendation to itinerary
  const handleAddToItinerary = async (item: any) => {
    console.log('Opening add to itinerary modal for:', item);
    setSelectedRecommendation(item);
    setShowAddModal(true);
  };

  // Handle the actual addition to itinerary after date selection
  const handleAddToItineraryConfirm = async (
    item: any, 
    selectedDate: string, 
    time: string // Now required
  ) => {
    try {
      if (!tripId) {
        Alert.alert('Error', 'Trip information not available');
        return;
      }

      // Map recommendation category to itinerary category
      const getCategoryFromItem = (item: any): 'activity' | 'restaurant' | 'attraction' | 'shopping' | 'nightlife' => {
        const description = item.description.toLowerCase();
        
        if (description.includes('restaurant') || description.includes('dining') || description.includes('food') || description.includes('cafe') || description.includes('coffee')) {
          return 'restaurant';
        }
        if (description.includes('museum') || description.includes('gallery') || description.includes('attraction')) {
          return 'attraction';
        }
        if (description.includes('shopping') || description.includes('market') || description.includes('store')) {
          return 'shopping';
        }
        if (description.includes('bar') || description.includes('club') || description.includes('nightlife')) {
          return 'nightlife';
        }
        
        return 'activity'; // Default category
      };

      const itineraryItem = {
        trip_id: tripId,
        title: item.name,
        description: item.description,
        date: selectedDate,
        time: time,
        location: item.location,
        category: getCategoryFromItem(item),
        priority: 'medium' as const,
        notes: undefined // No notes since we removed the notes feature
      };

      console.log('Adding to itinerary:', itineraryItem);
      
      await itineraryService.createItineraryItem(itineraryItem);
      
      // Refresh the itinerary display to show the new item immediately
      console.log('Refreshing itinerary after adding item...');
      await itineraryWrapperRef.current?.refreshItinerary();
      
      // NEW: Refresh itinerary items for AI context
      await loadItineraryItems();
      
      Alert.alert(
        'Added to Itinerary! 🎉',
        `"${item.name}" has been added to your ${selectedDate} itinerary.`,
        [{ text: 'OK' }]
      );
      
    } catch (error) {
      console.error('Error adding to itinerary:', error);
      Alert.alert('Error', 'Failed to add to itinerary. Please try again.');
    }
  };

  // Generate trip dates array for the modal
  const getTripDates = (): string[] => {
    if (!trip?.start_date || !trip?.end_date) return [];
    
    const startDate = new Date(trip.start_date);
    const endDate = new Date(trip.end_date);
    const dates: string[] = [];
    
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      dates.push(currentDate.toISOString().split('T')[0]); // YYYY-MM-DD format
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return dates;
  };

  // Manual suggestion generation function
  const handleGenerateSuggestions = async () => {
    if (loading) return;
    
    try {
      const newSuggestions = await generateSuggestions();
      setSuggestions(newSuggestions);
      setShowSuggestions(newSuggestions.length > 0);
    } catch (error) {
      console.error('Error generating suggestions:', error);
    }
  };

  const handleBackNavigation = () => {
    const cameFromSmartForm = tripName && destination && startDate && endDate && companions && activities;
    
    if (cameFromSmartForm) {
      router.push('/(root)/(tabs)/profile');
    } else {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.push('/(root)/(tabs)/profile');
      }
    }
  };

  const handleOpenEditTripModal = () => {
    setShowEditTripModal(true);
  };

  const handleCloseEditTripModal = () => {
    setShowEditTripModal(false);
  };

  const handleEditTripUpdate = (updatedTrip: Trip) => {
    setTrip(updatedTrip);
    setShowEditTripModal(false);
  };

  const handleTripDeleted = () => {
    setShowEditTripModal(false);
    if (router.canGoBack()) {
      router.back();
    } else {
      router.push('/(root)/(tabs)/profile');
    }
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View className="flex-1 bg-primaryBG">
        {/* header */}
        <View className="flex-row justify-between px-4 bg-primaryBG pt-4 border-b-2 border-border/50" style={{ height: HEADER_HEIGHT }}>
          <TouchableOpacity onPress={handleBackNavigation}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text className="font-InterBold text-xl text-primaryFont">
            {tripLoading ? 'Loading...' : trip?.destination || 'AI Assistant'}
          </Text>
          <TouchableOpacity onPress={handleOpenEditTripModal}>
            <Ionicons name="ellipsis-horizontal" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
        
        {/* panels */}
        <Animated.View
          className="bg-slate-100 overflow-hidden mb-1 rounded-b-3xl"
          style={[animatedTopPanelStyle]}
        >
          {/* NEW: Using ItineraryWrapper with real ItineraryTab functionality */}
          <ItineraryWrapper 
            ref={itineraryWrapperRef}
            trip={trip} 
            height={topHeight} 
            onTripUpdate={handleTripUpdate}
            onItineraryChange={loadItineraryItems}
          />
          
          {/* OLD: DynamicItinerary - kept for rollback */}
          {/* <DynamicItinerary trip={trip} height={topHeight} /> */}
        </Animated.View>
        
        {/* divider */}
        <PanGestureHandler onGestureEvent={gestureHandler}>
            <Animated.View className="h-6 bg-transparent items-center justify-center w-full">
              <View
                className="h-2.5 rounded-full px-4"
                  style={{
                    width: '92%',
                    alignSelf: 'center',
                    backgroundColor: '#0B0705',
                    borderWidth: 1,
                    borderColor: '#0B0705',
                    shadowColor: '#7C3AED',
                    shadowOpacity: 0.8,
                    shadowRadius: 15,
                    shadowOffset: { width: 0, height: 2 },
                    elevation: 4,
                  }}
              />
            </Animated.View>
        </PanGestureHandler>

        {/* chat interface */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={HEADER_HEIGHT}
          className="flex-1 w-full"
        >
          <View className="flex-1 bg-primaryBG overflow-hidden justify-end mt-1 rounded-t-3xl"> 
            {/* chat messages area */}
            <ScrollView
              ref={scrollViewRef}
              className="flex-1 px-4 pb-4 w-full"
              contentContainerStyle={{ justifyContent: 'flex-end', flexGrow: 1 }}
              onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
              bounces={false}
              alwaysBounceVertical={false}
              overScrollMode="never"
            >
              {loading && messages.length === 0 ? (
                <View className="flex-1 justify-center items-center">
                  <Text className="text-secondaryFont">Loading chat...</Text>
                </View>
              ) : error ? (
                <View className="flex-1 justify-center items-center">
                  <Text className="text-red-400 text-center">{error}</Text>
                </View>
              ) : (
                messages
                  .filter((msg) => msg.role !== 'system')
                  .map((msg) => (
                  <View key={msg.id} className={`w-full items-${msg.role === 'user' ? 'end' : 'start'} mb-4`}>
                    <View className={`rounded-2xl px-4 py-3 max-w-[90%] ${msg.role === 'user' ? 'bg-accentFont' : 'bg-secondaryBG'}` }>
                      {msg.role === 'assistant' ? (
                        <>
                          {/* Check if message has structured data */}
                          {msg.structured_data ? (
                            <StructuredResponse
                              data={JSON.parse(msg.structured_data)}
                              onAddToItinerary={handleAddToItinerary}
                            />
                          ) : (
                            <Markdown
                              style={{
                                body: { color: '#FFFFFF', fontSize: 16 },
                                strong: { color: '#FFFFFF', fontWeight: 'bold' },
                                em: { color: '#FFFFFF', fontStyle: 'italic' },
                                text: { color: '#FFFFFF' },
                                paragraph: { marginBottom: 8 },
                                list: { color: '#FFFFFF' },
                                listItem: { color: '#FFFFFF' },
                                bullet: { color: '#FFFFFF' }
                              }}
                            >
                              {msg.content || ''}
                            </Markdown>
                          )}
                        </>
                      ) : (
                        <Text className={`text-base ${msg.role === 'user' ? 'text-primaryBG' : 'text-primaryFont'}`}>
                          {msg.content || ''}
                        </Text>
                      )}
                    </View>
                    <Text className="text-xs text-secondaryFont mt-1 ml-2 mr-2">
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                ))
              )}
              
              {/* Typing indicator */}
              {isTyping && (
                <View className="w-full items-start mb-4">
                  <View className="rounded-2xl px-4 py-3 bg-secondaryBG">
                    <Text className="text-base text-primaryFont">
                      AITA is typing...
                    </Text>
                  </View>
                </View>
              )}
              
              {/* Smart suggestions */}
              {showSuggestions && suggestions.length > 0 && !loading && (
                <View className="w-full mb-4">
                  <Text className="text-sm text-secondaryFont mb-2 ml-2">💡 Suggested questions:</Text>
                  {suggestions.map((suggestion, index) => (
                    <TouchableOpacity 
                      key={index}
                      className="bg-inputBG rounded-xl px-3 py-2 mb-2 mr-2"
                      onPress={() => handleSuggestionTap(suggestion)}
                    >
                      <Text className="text-primaryFont text-sm">{suggestion}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </ScrollView>
            
            {/* Suggestions button - Above input area */}
            <View className="px-4 py-2 bg-primaryBG/90">
              <View className="flex-row items-center justify-between">
                <TouchableOpacity
                  onPress={handleGenerateSuggestions}
                  disabled={loading || !isReady || messages.length === 0}
                  className={`flex-row items-center px-3 py-2 rounded-xl ${
                    loading || !isReady || messages.length === 0 
                      ? 'bg-blue-950' 
                      : 'bg-accentFont'
                  }`}
                >
                  <Text className={`text-sm font-medium ${
                    loading || !isReady || messages.length === 0 
                      ? 'text-gray-400' 
                      : 'text-primaryBG'
                  }`}>
                    💡 Get Suggestions
                  </Text>
                </TouchableOpacity>
                
                {showSuggestions && suggestions.length > 0 && (
                  <TouchableOpacity
                    onPress={() => setShowSuggestions(false)}
                    className="px-3 py-2 rounded-xl bg-gray-600"
                  >
                    <Text className="text-gray-300 text-sm">Hide</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
            
            {/* input area */}
            <View className="bg-primaryBG mb-5">
              {/* Input row */}
              <View className="flex-row items-center px-4 py-4">
                <TextInput
                  className="flex-1 bg-transparent rounded-2xl px-4 py-4 mr-3 text-base text-primaryFont border border-border"
                  placeholder={trip?.destination ? `Ask about your trip to ${trip.destination}...` : "Ask AITA anything about your trip..."}
                  placeholderTextColor="#828282"
                  returnKeyType="send"
                  value={input}
                  onChangeText={setInput}
                  onSubmitEditing={handleSend}
                  editable={!loading && isReady}
                />
                {/* send message button */}
                <TouchableOpacity 
                  className={`rounded-full px-4 py-4 justify-center items-center ${loading || !isReady ? 'bg-gray-400' : 'bg-primaryFont'}`} 
                  onPress={handleSend}
                  disabled={loading || !isReady}
                >
                  {loading ? (
                    <Text className="text-primaryBG text-lg font-bold">...</Text>
                  ) : (
                    <Ionicons name="arrow-up" size={18} color="#000" />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>

        {/* Add to Itinerary Modal */}
        <AddToItineraryModal
          visible={showAddModal}
          item={selectedRecommendation}
          tripDates={getTripDates()}
          onClose={() => {
            setShowAddModal(false);
            setSelectedRecommendation(null);
          }}
          onAdd={handleAddToItineraryConfirm}
        />

        {/* Edit Trip Modal */}
        <EditTripModal
          visible={showEditTripModal}
          trip={trip}
          onClose={handleCloseEditTripModal}
          onTripUpdate={handleEditTripUpdate}
          onTripDeleted={handleTripDeleted}
        />
      </View>
    </GestureHandlerRootView>
  );
};

export const screenOptions = {
  gestureEnabled: false,
  fullScreenGestureEnabled: false,
  gestureDirection: 'horizontal',
  animationEnabled: false,
};

export default chatAI;
