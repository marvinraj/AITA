import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import { Dimensions, Image, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { GestureHandlerRootView, PanGestureHandler, State } from 'react-native-gesture-handler';
import { aitaApi, type Message } from '../../../../lib/api';

//  constants
const HEADER_HEIGHT = 45;
const DIVIDER_HEIGHT = 4;
const SCREEN_HEIGHT = Dimensions.get('window').height;

const chatAI = () => {
  // use router from expo-router to handle navigation
  const router = useRouter();
  // state to manage the height of the top panel
  const [topHeight, setTopHeight] = useState((SCREEN_HEIGHT - HEADER_HEIGHT) * 0.4);
  // ref to store the initial height during gesture
  const initialTopHeight = useRef(topHeight);
  // state to manage the input text and messages
  const [input, setInput] = useState("");
  // state to manage the chat messages (now with role)
  const [messages, setMessages] = useState<Message[]>([]);
  // state to manage loading
  const [isLoading, setIsLoading] = useState(false);
  // ref for scrollview
  const scrollViewRef = useRef<ScrollView>(null);

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

  // function to handle sending messages
  const handleSend = async () => {
    if (input.trim() === "" || isLoading) return;
    
    setIsLoading(true);
    const userMsg: Message = { 
      role: 'user', 
      text: input, 
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
    };
    setMessages(prev => [...prev, userMsg]);
    setInput("");

    try {
      // Use the API service to get response
      const assistantReply = await aitaApi.createChatCompletion([...messages, userMsg]);

      const assistantMsg: Message = { 
        role: 'assistant', 
        text: assistantReply, 
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (error) {
      console.error('Send message error:', error);
      const errorMsg: Message = { 
        role: 'assistant', 
        text: 'Sorry, there was an error. Please try again.', 
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <GestureHandlerRootView className="flex-1 bg-primaryBG">
      <View className="flex-1 bg-primaryBG">
        {/* header */}
        <View className="flex-row justify-between px-4 bg-primaryBG" style={{ height: HEADER_HEIGHT }}>
          <TouchableOpacity onPress={() => router.back()}>
            <Image source={require('../../../../assets/icons/back-arrow.png')} style={{ width: 24, height: 24 }} />
          </TouchableOpacity>
          <Text className="font-InterBold text-xl text-primaryFont">Europe Trip</Text>
          <TouchableOpacity>
            <Image source={require('../../../../assets/icons/3-dots.png')} style={{ width: 20, height: 20 }} />
          </TouchableOpacity>
        </View>
        
        {/* panels */}
        <View
          className="bg-slate-100 overflow-hidden mt-2 mb-3 rounded-2xl"
          style={{ height: topHeight }}
        >
          {/* dynamic Itinerary (empty for now) */}
        </View>
        
        {/* divider */}
        <PanGestureHandler onGestureEvent={onGestureEvent} onHandlerStateChange={onHandlerStateChange}>
          <View className="h-4 bg-transparent items-center justify-center">
            <View className="w-16 h-2.5 rounded-full" style={{ backgroundColor: 'rgba(124, 58, 237, 0.18)', borderWidth: 1, borderColor: '#7C3AED', shadowColor: '#7C3AED', shadowOpacity: 0.25, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 4 }} />
          </View>
        </PanGestureHandler>

        {/* chat interface */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={HEADER_HEIGHT}
          className="flex-1 w-full"
        >
          <View className="flex-1 bg-slate-100 overflow-hidden justify-end mt-3 rounded-2xl"> 
            {/* chat messages area */}
            <ScrollView
              ref={scrollViewRef}
              className="flex-1 px-2 pb-2 w-full"
              contentContainerStyle={{ justifyContent: 'flex-end', flexGrow: 1 }}
              onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
            >
              {messages.map((msg, idx) => (
                <View key={idx} className={`w-full items-${msg.role === 'user' ? 'end' : 'start'} mb-2`}>
                  <View className={`rounded-2xl px-4 py-2 max-w-[80%] ${msg.role === 'user' ? 'bg-accentFont' : 'bg-primaryFont'}` }>
                    <Text className={`text-base ${msg.role === 'user' ? 'text-primaryBG' : 'text-primaryBG/80'}`}>{msg.text || ''}</Text>
                  </View>
                  <Text className="text-xs text-secondaryFont mt-1 ml-2 mr-2">{msg.time || ''}</Text>
                </View>
              ))}
            </ScrollView>
            {/* input area */}
            <View className="flex-row items-center p-3 bg-secondaryBG border-t border-[#323232] mb-2">
              <TextInput
                className="flex-1 bg-inputBG rounded-2xl px-4 py-3 mr-2 text-base text-primaryFont"
                placeholder="Ask AITA anything about your trip..."
                placeholderTextColor="#828282"
                returnKeyType="send"
                value={input}
                onChangeText={setInput}
                onSubmitEditing={handleSend}
                editable={!isLoading}
              />
              {/* send message button */}
              <TouchableOpacity 
                className={`rounded-2xl px-4 py-3 justify-center items-center ${isLoading ? 'bg-gray-400' : 'bg-accentFont'}`} 
                onPress={handleSend}
                disabled={isLoading}
              >
                <Text className="text-primaryBG text-lg font-bold">{isLoading ? '...' : '↑'}</Text>
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