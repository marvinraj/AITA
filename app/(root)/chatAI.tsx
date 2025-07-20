import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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

//  constants
const HEADER_HEIGHT = 55;
const SCREEN_HEIGHT = Dimensions.get('window').height;
const MODAL_MIN_HEIGHT = 200; // Minimum height for the chat modal
const MODAL_MAX_HEIGHT = SCREEN_HEIGHT * 0.8; // Maximum height (80% of screen)
const MODAL_DEFAULT_HEIGHT = SCREEN_HEIGHT * 0.4; // Default height (40% of screen)
const MODAL_COLLAPSED_HEIGHT = 80; // Height when collapsed but still visible

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

  // Add a ref to prevent multiple initializations
  const chatInitializedRef = useRef(false);

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
    autoLoad: shouldInitializeChat && !chatInitializedRef.current,
    tripContext
  });

  // Track when chat is initialized to prevent duplicate initialization
  useEffect(() => {
    if (shouldInitializeChat && !chatInitializedRef.current) {
      chatInitializedRef.current = true;
      console.log('Chat initialized for trip:', tripId);
    }
  }, [shouldInitializeChat, tripId]);
  
  // state to manage the height of the chat modal
  const [modalVisible, setModalVisible] = useState(true);
  const [modalHeight, setModalHeight] = useState(MODAL_DEFAULT_HEIGHT);
  const [isModalCollapsed, setIsModalCollapsed] = useState(false);
  
  // Animated values for smooth modal handling
  const modalHeightAnimated = useSharedValue(MODAL_DEFAULT_HEIGHT);
  const backdropOpacity = useSharedValue(0.5);

  // Function to update modal height from animated value
  const updateModalHeight = (newHeight: number) => {
    setModalHeight(newHeight);
  };

  // Modal gesture handler for resizing
  const modalGestureHandler = useAnimatedGestureHandler({
    onStart: (_, context: { startHeight: number }) => {
      context.startHeight = modalHeightAnimated.value;
    },
    onActive: (event, context: { startHeight: number }) => {
      const newHeight = context.startHeight - event.translationY; // Negative because dragging up increases height
      const constrainedHeight = Math.max(MODAL_COLLAPSED_HEIGHT, Math.min(newHeight, MODAL_MAX_HEIGHT)); // Allow collapse to MODAL_COLLAPSED_HEIGHT
      modalHeightAnimated.value = constrainedHeight;
    },
    onEnd: () => {
      const finalHeight = modalHeightAnimated.value;
      
      if (finalHeight < MODAL_COLLAPSED_HEIGHT + 200) {
        modalHeightAnimated.value = withSpring(MODAL_COLLAPSED_HEIGHT, {
          damping: 20,
          stiffness: 90,
        });
        runOnJS(setIsModalCollapsed)(true);
        runOnJS(updateModalHeight)(MODAL_COLLAPSED_HEIGHT);
      } else {
        // Snap to reasonable height and ensure it's expanded
        const targetHeight = finalHeight < MODAL_DEFAULT_HEIGHT ? MODAL_DEFAULT_HEIGHT : finalHeight;
        modalHeightAnimated.value = withSpring(targetHeight, {
          damping: 20,
          stiffness: 90,
        });
        runOnJS(setIsModalCollapsed)(false);
        runOnJS(updateModalHeight)(targetHeight);
      }
    },
  });

  // Animated style for the modal
  const animatedModalStyle = useAnimatedStyle(() => {
    return {
      height: modalHeightAnimated.value,
    };
  });

  // Animated style for backdrop
  const animatedBackdropStyle = useAnimatedStyle(() => {
    return {
      opacity: backdropOpacity.value,
    };
  });
  
  // ref to store the initial height during gesture - removed as no longer needed
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

  // Show/hide chat modal
  const showChatModal = () => {
    setModalVisible(true);
    // Use the saved modalHeight if available, otherwise use default
    const targetHeight = modalHeight > 0 ? modalHeight : MODAL_DEFAULT_HEIGHT;
    modalHeightAnimated.value = withSpring(targetHeight, { damping: 20, stiffness: 90 });
  };

  const hideChatModal = () => {
    modalHeightAnimated.value = withSpring(0, { damping: 20, stiffness: 90 });
    setTimeout(() => setModalVisible(false), 300);
  };

  const expandModal = () => {
    setIsModalCollapsed(false);
    modalHeightAnimated.value = withSpring(MODAL_DEFAULT_HEIGHT, { damping: 20, stiffness: 90 });
    setModalHeight(MODAL_DEFAULT_HEIGHT);
  };

  // Show chat modal - button always shows the modal when pressed
  const handleChatButtonPress = () => {
    showChatModal();
  };

  // ----- MESSAGE HANDLING -----

  // Function to handle sending messages (now uses persistent storage)
  const [sending, setSending] = useState(false); // Add sending state to prevent rapid-fire sends
  
  const handleSend = async () => {
    if (input.trim() === "" || loading || !isReady || sending) return;
    
    try {
      setSending(true);
      await sendMessage(input);
      setInput(""); // Clear input after successful send
      setShowSuggestions(false); // Hide suggestions after sending
    } catch (error: any) {
      console.error('Error sending message:', error);
      
      // Handle specific database constraint error
      if (error?.code === '23505' && error?.message?.includes('ai_messages_chat_id_message_order_key')) {
        console.warn('Duplicate message order detected, retrying...');
        // Wait a bit and retry once
        setTimeout(async () => {
          try {
            await sendMessage(input);
            setInput("");
            setShowSuggestions(false);
          } catch (retryError) {
            console.error('Retry failed:', retryError);
            Alert.alert(
              'Message Error', 
              'There was an issue sending your message. Please try again.',
              [{ text: 'OK' }]
            );
          }
        }, 500);
      } else {
        Alert.alert(
          'Message Error', 
          'Failed to send message. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } finally {
      setSending(false);
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
        {/* Transparent header with bubble elements */}
        <View className="absolute top-0 left-0 right-0 z-50 flex-row justify-between items-center px-4 pt-4 pb-4" style={{ height: HEADER_HEIGHT + 32 }}>
          {/* Back button in circular background */}
          <TouchableOpacity 
            onPress={handleBackNavigation}
            className="p-3 rounded-full bg-secondaryBG/60 backdrop-blur-sm justify-center items-center"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.25,
              shadowRadius: 3.84,
              elevation: 5,
            }}
          >
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>
          
          {/* Destination in bubble background */}
          <View 
            className="bg-secondaryBG/60 backdrop-blur-sm rounded-full px-4 py-3 flex-1 mx-3 justify-center items-center"            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.25,
              shadowRadius: 3.84,
              elevation: 5,
            }}
          >
            <Text className="font-InterBold text-sm text-white text-center" numberOfLines={1} ellipsizeMode="tail">
              {tripLoading ? 'Loading...' : trip?.destination || 'AI Assistant'}
            </Text>
          </View>
          
          {/* Menu button in circular background */}
          <TouchableOpacity 
            onPress={handleOpenEditTripModal}
            className="py-3 rounded-full bg-secondaryBG/60 backdrop-blur-sm justify-center items-center"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.25,
              shadowRadius: 3.84,
              elevation: 5,
            }}
          >
            <Ionicons name="ellipsis-horizontal" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
        
        {/* Full screen itinerary with transparent header overlay */}
        <View className="flex-1">
          <ItineraryWrapper 
            ref={itineraryWrapperRef}
            trip={trip} 
            height={SCREEN_HEIGHT}
            onTripUpdate={handleTripUpdate}
            onItineraryChange={loadItineraryItems}
            hasOverlayHeader={true}
          />
        </View>

        {/* Floating AI Chat Button - Show when modal is hidden or collapsed */}
        {/* {(!modalVisible || isModalCollapsed) && (
          <TouchableOpacity
            onPress={() => isModalCollapsed ? expandModal() : handleChatButtonPress()}
            style={{
              position: 'absolute',
              bottom: 35,
              right: 24,
              zIndex: 1000,
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderRadius: 25,
              backgroundColor: '#F7374F',
              justifyContent: 'center',
              alignItems: 'center',
              shadowColor: '#F7374F',
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.45,
              shadowRadius: 8,
              elevation: 15,
              flexDirection: 'row',
              gap: 8,
            }}
          >
            <Text style={{ color: 'white', fontSize: 14, fontWeight: '600' }}>
              {isModalCollapsed ? 'Open Chat' : 'Back to chat'}
            </Text>
          </TouchableOpacity>
        )} */}

        {/* Chat Modal - Conditionally visible with drag functionality */}
        {modalVisible && (
          <>
            {/* Modal Content - Similar to discover page */}
            <Animated.View
              style={[
                {
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  bottom: 0,
                  borderTopLeftRadius: 20,
                  borderTopRightRadius: 20,
                  zIndex: 1000,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: -4 },
                  shadowOpacity: 0.25,
                  shadowRadius: 12,
                  elevation: 20,
                  overflow: 'hidden',
                },
                animatedModalStyle,
              ]}
            >
              {/* Background Gradient - Same as discover page */}
              <LinearGradient
                colors={['rgba(15, 20, 31, 0.98)', 'rgba(24, 32, 45, 0.98)', 'rgba(12, 17, 26, 0.99)']}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                }}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
              />

            {/* Modal Handle */}
            <PanGestureHandler onGestureEvent={modalGestureHandler}>
              <Animated.View className="items-center py-3 bg-transparent relative">
                <View
                  style={{
                    width: 40,
                    height: 4,
                    backgroundColor: '#9CA3AF',
                    borderRadius: 2,
                    marginBottom: 4,
                  }}
                />
                {isModalCollapsed && (
                  <TouchableOpacity
                    onPress={expandModal}
                    className="flex-row items-center px-4 py-2 bg-white/10 rounded-full mt-2"
                  >
                    <Text className="text-white text-sm font-medium mr-2">Open Chat</Text>
                    <Ionicons name="chevron-up" size={16} color="white" />
                  </TouchableOpacity>
                )}
              </Animated.View>
            </PanGestureHandler>

            {/* Chat Interface - Hidden when collapsed */}
            {!isModalCollapsed && (
              <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={{ flex: 1 }}
              >
                <View className="flex-1 overflow-hidden justify-end">
                {/* Chat messages area */}
                <ScrollView
                  ref={scrollViewRef}
                  className="flex-1 px-4 pb-4 pt-4 w-full"
                  contentContainerStyle={{ justifyContent: 'flex-end', flexGrow: 1 }}
                  onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
                  bounces={false}
                  alwaysBounceVertical={false}
                  overScrollMode="never"
                >
                  {loading && messages.length === 0 ? (
                    <View className="flex-1 justify-center items-center">
                      <Text className="text-gray-300">Loading chat...</Text>
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
                        <View className={`rounded-2xl px-4 py-3 max-w-[90%] ${msg.role === 'user' ? 'bg-blue-500' : 'bg-white/10 border border-white/20'}` }>
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
                            <Text className="text-base text-white">
                              {msg.content || ''}
                            </Text>
                          )}
                        </View>
                        <Text className="text-xs text-gray-400 mt-1 ml-2 mr-2">
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                      </View>
                    ))
                  )}
                  
                  {/* Typing indicator */}
                  {isTyping && (
                    <View className="w-full items-start mb-4">
                      <View className="rounded-2xl px-4 py-3 bg-white/10 border border-white/20">
                        <Text className="text-base text-white">
                          AITA is typing...
                        </Text>
                      </View>
                    </View>
                  )}
                  
                  {/* Smart suggestions */}
                  {showSuggestions && suggestions.length > 0 && !loading && (
                    <View className="w-full mb-4">
                      <Text className="text-sm text-gray-300 mb-2 ml-2">💡 Suggested questions:</Text>
                      {suggestions.map((suggestion, index) => (
                        <TouchableOpacity 
                          key={index}
                          className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 mb-2 mr-2"
                          onPress={() => handleSuggestionTap(suggestion)}
                        >
                          <Text className="text-white text-sm">{suggestion}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </ScrollView>
                
                {/* Suggestions button - Above input area */}
                <View className="px-4 py-2">
                  <View className="flex-row items-center justify-between">
                    <TouchableOpacity
                      onPress={handleGenerateSuggestions}
                      disabled={loading || !isReady || messages.length === 0}
                      className={`flex-row items-center px-3 py-2 rounded-xl ${
                        loading || !isReady || messages.length === 0 
                          ? 'bg-gray-600' 
                          : 'bg-blue-500'
                      }`}
                    >
                      <Text className={`text-sm font-medium ${
                        loading || !isReady || messages.length === 0 
                          ? 'text-gray-400' 
                          : 'text-white'
                      }`}>
                        💡 Get Suggestions
                      </Text>
                    </TouchableOpacity>
                    
                    {showSuggestions && suggestions.length > 0 && (
                      <TouchableOpacity
                        onPress={() => setShowSuggestions(false)}
                        className="px-3 py-2 rounded-xl bg-white/10"
                      >
                        <Text className="text-gray-300 text-sm">Hide</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
                
                {/* Input area */}
                <View className="mb-5">
                  <View className="flex-row items-center px-4 py-4">
                    <TextInput
                      className="flex-1 bg-white/5 border border-white/20 rounded-2xl px-4 py-4 mr-3 text-base text-white"
                      placeholder={trip?.destination ? `Ask about your trip to ${trip.destination}...` : "Ask AITA anything about your trip..."}
                      placeholderTextColor="#9CA3AF"
                      returnKeyType="send"
                      value={input}
                      onChangeText={setInput}
                      onSubmitEditing={handleSend}
                      editable={!loading && isReady && !sending}
                    />
                    <TouchableOpacity 
                      className={`rounded-full px-4 py-4 justify-center items-center ${loading || !isReady || sending ? 'bg-secondaryFont' : 'bg-primaryFont'}`} 
                      onPress={handleSend}
                      disabled={loading || !isReady || sending}
                    >
                      {loading || sending ? (
                        <Text className="text-primaryBG text-lg font-bold">...</Text>
                      ) : (
                        <Ionicons name="arrow-up" size={18} color="#000" />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </KeyboardAvoidingView>
            )}
          </Animated.View>
        </>
        )}

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
