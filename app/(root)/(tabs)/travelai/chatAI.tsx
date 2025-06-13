import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import { Dimensions, KeyboardAvoidingView, Platform, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { GestureHandlerRootView, PanGestureHandler, State } from 'react-native-gesture-handler';

//  constants
const HEADER_HEIGHT = 45;
const DIVIDER_HEIGHT = 10;
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
  // state to manage the chat messages
  const [messages, setMessages] = useState<Array<{ text: string; time: string }>>([]);

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

  // function to handle sending messages
  const handleSend = () => {
    if (input.trim() === "") return;
    setMessages([
      ...messages,
      { text: input, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
    ]);
    setInput("");
  };

  return (
    <GestureHandlerRootView className="flex-1 bg-primaryBG">
      <View className="flex-1 bg-primaryBG">
        {/* header */}
        <View className="flex-row items-center border-b border-[#222] px-4 bg-primaryBG" style={{ height: HEADER_HEIGHT }}>
          <TouchableOpacity className="mr-3 p-2" onPress={() => router.back()}>
            <Text className="text-accentFont text-2xl">{'<'} </Text>
          </TouchableOpacity>
          <Text className="font-InterBold text-primaryFont">Branding Exploration Chat</Text>
        </View>
        
        {/* panels */}
        <View className="bg-primaryBG overflow-hidden b" style={{ height: topHeight }}> 
          {/* dynamic Itinerary (empty for now) */}
        </View>
        
        {/* divider */}
        <PanGestureHandler onGestureEvent={onGestureEvent} onHandlerStateChange={onHandlerStateChange}>
          <View className="h-6 bg-[#251f99] items-center justify-center">
            <View className="w-15 h-3 rounded-lg bg-[#35345a]" />
          </View>
        </PanGestureHandler>

        {/* chat interface */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={HEADER_HEIGHT}
          className="flex-1 w-full"
        >
          <View className="flex-1 bg-primaryBG overflow-hidden justify-end"> 
            {/* chat messages area */}
            <View className="flex-1 px-2 pb-2 w-full justify-end">
              {messages.map((msg, idx) => (
                <View key={idx} className="w-full items-end mb-2">
                  <View className="bg-accentFont rounded-2xl px-4 py-2 max-w-[80%]">
                    <Text className="text-primaryBG text-base">{msg.text}</Text>
                  </View>
                  <Text className="text-xs text-secondaryFont mt-1 mr-2">{msg.time}</Text>
                </View>
              ))}
            </View>
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
              />
              {/* send message button */}
              <TouchableOpacity className="bg-accentFont rounded-2xl px-4 py-3 justify-center items-center" onPress={handleSend}>
                <Text className="text-primaryBG text-lg font-bold">↑</Text>
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