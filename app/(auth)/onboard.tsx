import { Ionicons } from '@expo/vector-icons'
import { Link } from "expo-router"
import React, { useRef, useState } from 'react'
import { Animated, Dimensions, Image, ScrollView, Text, TouchableOpacity, View } from 'react-native'

const { width: screenWidth } = Dimensions.get('window')

interface OnboardingSlide {
  id: number
  title: string
  subtitle: string
  description: string
  image: any
  // icon: string
}

const onboardingData: OnboardingSlide[] = [
  {
    id: 1,
    title: "AITA",
    subtitle: "Your AI Travel Companion",
    description: "Plan, discover, and chat with AI for your next adventure. Let's make travel planning effortless and exciting!",
    image: require('../../assets/images/logo6.png'),
    // icon: "airplane"
  },
  {
    id: 2,
    title: "Chat with AI",
    subtitle: "Get Instant Travel Advice",
    description: "Ask anything about your destination! Get personalized recommendations, local tips, and travel insights powered by AI.",
    image: require('../../assets/images/logo6.png'),
    // icon: "chatbubbles"
  },
  {
    id: 3,
    title: "Smart Planning",
    subtitle: "Effortless Itineraries",
    description: "Create detailed itineraries with AI assistance. Add activities, manage budgets, and keep everything organized in one place.",
    image: require('../../assets/images/logo6.png'),
    // icon: "calendar"
  },
  {
    id: 4,
    title: "Discover Places",
    subtitle: "Save & Explore",
    description: "Find amazing places, save your favorites, and build your personal collection of must-visit destinations.",
    image: require('../../assets/images/logo6.png'),
    // icon: "location"
  },
  {
    id: 5,
    title: "Ready to Explore?",
    subtitle: "Start Your Journey",
    description: "",
    image: require('../../assets/images/logo6.png'),
    // icon: "rocket"
  }
]

const Onboarding = () => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const scrollViewRef = useRef<ScrollView>(null)
  const scrollX = useRef(new Animated.Value(0)).current

  const handleNext = () => {
    if (currentIndex < onboardingData.length - 1) {
      const nextIndex = currentIndex + 1
      setCurrentIndex(nextIndex)
      scrollViewRef.current?.scrollTo({
        x: nextIndex * screenWidth,
        animated: true
      })
    }
  }

  const handlePrevious = () => {
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1
      setCurrentIndex(prevIndex)
      scrollViewRef.current?.scrollTo({
        x: prevIndex * screenWidth,
        animated: true
      })
    }
  }

  const handleScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x
    const index = Math.round(offsetX / screenWidth)
    setCurrentIndex(index)
  }

  const renderSlide = (item: OnboardingSlide, index: number) => (
    <View key={item.id} className="flex-1 items-center justify-center px-6" style={{ width: screenWidth }}>
      <View className="items-center mb-12">
        {/* <View className="bg-buttonPrimary/20 p-4 rounded-full mb-6">
          <Ionicons name={item.icon as any} size={48} color="#0891b2" />
        </View> */}
        <Image
          source={item.image}
          className="w-64 h-64 mb-8"
          resizeMode="contain"
          accessibilityLabel={item.title}
        />
      </View>
      
      <View className="items-center px-4">
        <Text className="text-4xl text-primaryFont text-center font-BellezaRegular mb-3">
          {item.title}
        </Text>
        <Text className="text-base text-accentFont/70 text-center font-UrbanistSemiBold mb-4">
          {item.subtitle}
        </Text>
        <Text className="text-base text-secondaryFont text-center font-UrbanistRegular leading-6 max-w-sm">
          {item.description}
        </Text>
      </View>
    </View>
  )

  const renderPagination = () => (
    <View className="flex-row justify-center items-center mb-8">
      {onboardingData.map((_, index) => (
        <View
          key={index}
          className={`h-2 rounded-full mx-1 ${
            index === currentIndex ? 'bg-buttonPrimary w-8' : 'bg-gray-600 w-2'
          }`}
        />
      ))}
    </View>
  )

  return (
    <View className="flex-1 bg-primaryBG">
      {/* Header with Skip Button */}
      <View className="flex-row justify-end items-center pt-12 pb-4 px-6">
        {/* <Text className="text-3xl text-primaryFont font-BellezaRegular">AITA</Text> */}
        {currentIndex < onboardingData.length - 1 && (
          <Link href="/(auth)/sign-up" asChild>
            <TouchableOpacity className="px-4 py-2">
              <Text className="text-secondaryFont font-InterRegular">Skip</Text>
            </TouchableOpacity>
          </Link>
        )}
      </View>

      {/* Slides */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false, listener: handleScroll }
        )}
        scrollEventThrottle={16}
        className="flex-1"
      >
        {onboardingData.map((item, index) => renderSlide(item, index))}
      </ScrollView>

      {/* Pagination Dots */}
      {renderPagination()}

      {/* Navigation Buttons */}
      <View className="px-6 pb-14">
        {currentIndex === onboardingData.length - 1 ? (
          // Get Started Button (Last slide)
          <Link href="/(auth)/sign-up" asChild>
            <TouchableOpacity className="bg-buttonPrimary w-full px-6 py-5 rounded-full shadow-lg active:opacity-80">
              <Text className="font-BellezaRegular text-lg text-center">Get Started</Text>
            </TouchableOpacity>
          </Link>
        ) : (
          // Next/Previous Buttons
          <View className="flex-row justify-between items-center">
            <TouchableOpacity
              onPress={handlePrevious}
              className={`flex-row items-center px-6 py-3 rounded-full ${
                currentIndex === 0 ? 'opacity-0' : 'bg-gray-700/50'
              }`}
              disabled={currentIndex === 0}
            >
              <Ionicons name="chevron-back" size={20} color="#9ca3af" />
              <Text className="text-secondaryFont font-InterRegular ml-2">Back</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleNext}
              className="flex-row items-center bg-buttonPrimary px-6 py-3 rounded-full"
            >
              <Text className="text-primaryBG font-InterRegular mr-2">Next</Text>
              <Ionicons name="chevron-forward" size={20} color="#000" />
            </TouchableOpacity>
          </View>
        )}

        {/* Terms and Privacy */}
        {currentIndex === onboardingData.length - 1 && (
          <View className="mt-4 items-center w-full">
            <Text className="text-secondaryFont text-xs text-center font-InterRegular">
              By tapping on <Text className="font-semibold">"Get Started"</Text>, you agree to our
            </Text>
            <Text className="text-secondaryFont text-xs text-center mt-1 font-InterRegular">
              <Text className="underline">Terms</Text> and <Text className="underline">Privacy Policy</Text>
            </Text>
          </View>
        )}
      </View>
    </View>
  )
}

export default Onboarding