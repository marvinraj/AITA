import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Dimensions, Image, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { GestureHandlerRootView, PanGestureHandler, State } from 'react-native-gesture-handler';
import ItineraryWrapper from '../../components/ItineraryWrapper'; // New wrapper component
import { TripContext, useAIChat } from '../../hooks/useAIChat';
import { TripsService } from '../../lib/services/tripsService';
import { Trip } from '../../types/database';

// interface for trip context passed from smart form
// re-exporting from hook for consistency

//  constants
const HEADER_HEIGHT = 45;
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
  
  console.log('ChatAI screen mounted with tripId:', tripId);
  
  const router = useRouter();
  
  const tripsService = new TripsService();
  
  const [trip, setTrip] = useState<Trip | null>(null);
  const [tripLoading, setTripLoading] = useState(true);
  
  // memoize trip context to prevent unnecessary re-creation and re-renders
  const tripContext: TripContext | undefined = useMemo(() => {
    if (tripName && destination && startDate && endDate && companions && activities) {
      return {
        tripName,
        destination,
        startDate,
        endDate,
        companions,
        activities
      };
    }
    return undefined;
  }, [tripName, destination, startDate, endDate, companions, activities]);

  // use persistent AI chat hook - automatically loads/creates chat for this trip
  const {
    chat,
    messages,
    loading,
    error,
    sendMessage,
    isReady
  } = useAIChat({
    tripId: tripId || '',
    autoLoad: true,
    tripContext
  });
  
  // state to manage the height of the top panel
  const [topHeight, setTopHeight] = useState((SCREEN_HEIGHT - HEADER_HEIGHT) * 0.4);
  // ref to store the initial height during gesture
  const initialTopHeight = useRef(topHeight);
  // state to manage the input text
  const [input, setInput] = useState("");
  // ref for scrollview
  const scrollViewRef = useRef<ScrollView>(null);

  // load trip data when component mounts
  useEffect(() => {
    const loadTrip = async () => {
      if (!tripId) return;
      
      try {
        setTripLoading(true);
        const tripData = await tripsService.getTripById(tripId);
        setTrip(tripData);
      } catch (error) {
        console.error('Failed to load trip:', error);
      } finally {
        setTripLoading(false);
      }
    };

    loadTrip();
  }, [tripId]);

  // Handle trip updates from ItineraryWrapper (e.g., when dates are edited)
  const handleTripUpdate = (updatedTrip: Trip) => {
    console.log('ChatAI: Trip updated from itinerary', updatedTrip);
    
    // Update local trip state
    setTrip(updatedTrip);
    
    // TODO: Could also update AI chat context if trip context changes
    // This would refresh the AI with new trip information
  };

  // only update height during gesture
  const onGestureEvent = (event: any) => {
    // get the translationY value from the gesture event
    const { translationY } = event.nativeEvent;
    // calculate the new height based on the initial height and translation
    let newTopHeight = initialTopHeight.current + translationY;
    // constrain the height to a minimum of 100 and a maximum of SCREEN_HEIGHT - HEADER_HEIGHT - 100 - DIVIDER_HEIGHT
    newTopHeight = Math.max(100, Math.min(newTopHeight, SCREEN_HEIGHT - HEADER_HEIGHT - 100 - DIVIDER_HEIGHT));
    setTopHeight(newTopHeight);
  };

  // set initial height on gesture begin
  const onHandlerStateChange = (event: any) => {
    // check if the gesture state is BEGAN
    const { state } = event.nativeEvent;
    // if it is, store the current topHeight as the initial height
    if (state === State.BEGAN) {
      initialTopHeight.current = topHeight;
    }
  };

  // ----- MESSAGE HANDLING -----

  // Function to handle sending messages (now uses persistent storage)
  const handleSend = async () => {
    if (input.trim() === "" || loading || !isReady) return;
    
    try {
      await sendMessage(input);
      setInput(""); // Clear input after successful send
    } catch (error) {
      console.error('Error sending message:', error);
      // Error handling is already done in the hook
    }
  };

  return (
    <GestureHandlerRootView className="flex-1 bg-primaryBG">
      <View className="flex-1 bg-[#1c0202]">
        {/* header */}
        <View className="flex-row justify-between px-4 bg-primaryBG border-b border-border pt-4" style={{ height: HEADER_HEIGHT }}>
          <TouchableOpacity onPress={() => router.back()}>
            <Image source={require('../../assets/icons/back-arrow.png')} style={{ width: 24, height: 24 }} />
          </TouchableOpacity>
          <Text className="font-InterBold text-xl text-primaryFont">
            {tripLoading ? 'Loading...' : trip?.destination || 'AI Assistant'}
          </Text>
          <TouchableOpacity>
            <Image source={require('../../assets/icons/3-dots.png')} style={{ width: 20, height: 20 }} />
          </TouchableOpacity>
        </View>
        
        {/* panels */}
        <View
          className="bg-slate-100 overflow-hidden mb-3 rounded-b-2xl border-b border-[#520a0a]"
          style={{ height: topHeight }}
        >
          {/* NEW: Using ItineraryWrapper with real ItineraryTab functionality */}
          <ItineraryWrapper 
            trip={trip} 
            height={topHeight} 
            onTripUpdate={handleTripUpdate}
          />
          
          {/* OLD: DynamicItinerary - kept for rollback */}
          {/* <DynamicItinerary trip={trip} height={topHeight} /> */}
        </View>
        
        {/* divider */}
        <PanGestureHandler onGestureEvent={onGestureEvent} onHandlerStateChange={onHandlerStateChange}>
          <View className="h-4 bg-transparent items-center justify-center">
            <View className="w-16 h-2.5 rounded-full" style={{ backgroundColor: '#520a0a', borderWidth: 1, borderColor: '#520a0a', shadowColor: '#7C3AED', shadowOpacity: 0.25, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 4 }} />
          </View>
        </PanGestureHandler>

        {/* chat interface */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={HEADER_HEIGHT}
          className="flex-1 w-full"
        >
          <View className="flex-1 bg-primaryBG overflow-hidden justify-end mt-3 rounded-2xl border-t border-[#520a0a]"> 
            {/* chat messages area */}
            <ScrollView
              ref={scrollViewRef}
              className="flex-1 px-4 pb-4 w-full"
              contentContainerStyle={{ justifyContent: 'flex-end', flexGrow: 1 }}
              onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
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
                    <View className={`rounded-2xl px-4 py-3 max-w-[80%] ${msg.role === 'user' ? 'bg-accentFont' : 'bg-secondaryBG'}` }>
                      <Text className={`text-base ${msg.role === 'user' ? 'text-primaryBG' : 'text-primaryFont'}`}>
                        {msg.content || ''}
                      </Text>
                    </View>
                    <Text className="text-xs text-secondaryFont mt-1 ml-2 mr-2">
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                ))
              )}
            </ScrollView>
            {/* input area */}
            <View className="flex-row items-center p-4 bg-secondaryBG border-t border-border mb-2">
              <TextInput
                className="flex-1 bg-inputBG rounded-2xl px-4 py-3 mr-3 text-base text-primaryFont"
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
                className={`rounded-2xl px-4 py-3 justify-center items-center ${loading || !isReady ? 'bg-gray-400' : 'bg-accentFont'}`} 
                onPress={handleSend}
                disabled={loading || !isReady}
              >
                <Text className="text-primaryBG text-lg font-bold">{loading ? '...' : '↑'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </GestureHandlerRootView>
  );
};

export const screenOptions = {
  gestureEnabled: false,
};

export default chatAI;
