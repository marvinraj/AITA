import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import { Dimensions, Image, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { GestureHandlerRootView, PanGestureHandler, State } from 'react-native-gesture-handler';

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
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string; time: string }>>([]);
  // state to manage loading
  const [isLoading, setIsLoading] = useState(false);
  // ref for scrollview
  const scrollViewRef = useRef<ScrollView>(null);

  // constants for context management
  const MAX_CONTEXT_MESSAGES = 20;

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

  // ----- API COMMUNICATION -----

  // function to call the Hugging Face API
  const sendMessageToModel = async (messagesForApi: any[]) => {
    try {
      const response = await fetch('https://aita-travel-ai.loca.lt/generate', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          // 'ngrok-skip-browser-warning': 'true' // ngrok header to skip browser warning
          'Bypass-Tunnel-Reminder': 'true'  // LocalTunnel header
        },
        body: JSON.stringify({ messages: messagesForApi }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.result) {
        throw new Error('No result in response');
      }

      return data.result;
    } catch (error) {
      console.error('Error communicating with AI:', error);
      return 'Sorry, I encountered an error while processing your request. Please try again.';
    }
  };

  // utility to remove <think>...</think> blocks
  const stripThink = (text: string) => text.replace(/<think>[\s\S]*?<\/think>/g, '').trim();

  // utility to extract only the assistant's reply after the last 'Assistant:'
  const extractAssistantReply = (text: string) => {
    const idx = text.lastIndexOf('Assistant:');
    if (idx !== -1) {
      return text.substring(idx + 'Assistant:'.length).trim();
    }
    return text.trim();
  };

  // function to handle sending messages
  const handleSend = async () => {
    if (input.trim() === "" || isLoading) return;
    
    setIsLoading(true);
    const userMsg = { role: 'user' as const, text: input, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    setMessages(prev => [...prev, userMsg]);
    setInput("");

    try {
      // Keep only recent messages to stay within context window
      const recentMessages = [...messages, userMsg].slice(-MAX_CONTEXT_MESSAGES);

      // Add system message and prepare messages for API
      const systemMessage = {
        role: "system",
        content: [{ type: "text", text: "You are AITA, a helpful AI travel assistant. Provide helpful, accurate travel advice and recommendations." }]
      };

      const apiMessages = [
        systemMessage,
        ...recentMessages.map(m => ({
          role: m.role,
          content: [{ type: "text", text: m.text }]
        }))
      ];

      const assistantReply = await sendMessageToModel(apiMessages);
      console.log("Raw assistant reply:", assistantReply);

      // remove <think>...</think> and extract only the assistant's reply
      const cleanReply = extractAssistantReply(stripThink(assistantReply));

      const assistantMsg = { role: 'assistant' as const, text: cleanReply, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (error) {
      console.error('Send message error:', error);
      const errorMsg = { role: 'assistant' as const, text: 'Sorry, there was an error. Please try again.', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

    // ----- API COMMUNICATION -----

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
                    <Text className={`text-base ${msg.role === 'user' ? 'text-primaryBG' : 'text-primaryBG/80'}`}>{msg.text}</Text>
                  </View>
                  <Text className="text-xs text-secondaryFont mt-1 ml-2 mr-2">{msg.time}</Text>
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