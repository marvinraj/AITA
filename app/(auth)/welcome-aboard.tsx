import { useRouter } from 'expo-router'
import React, { useEffect, useRef, useState } from 'react'
import { Animated, Dimensions, StyleSheet, Text, View } from 'react-native'

const { width: screenWidth, height: screenHeight } = Dimensions.get('window')

const WelcomeAboard = () => {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [displayedText, setDisplayedText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  
  // TEMPORARY: Set to true to disable timing for UI development
  const DISABLE_TIMING = false
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current
  const scaleAnim = useRef(new Animated.Value(0.8)).current
  const logoRotateAnim = useRef(new Animated.Value(0)).current
  const sparkleAnim = useRef(new Animated.Value(0)).current
  const progressAnim = useRef(new Animated.Value(0)).current
  
  // New fade-in animations for sections
  const topContentFadeAnim = useRef(new Animated.Value(0)).current
  const progressBarFadeAnim = useRef(new Animated.Value(0)).current

  // Loading steps with messages
  const loadingSteps = [
    {
      id: 1,
      message: "Welcome aboard!",
      subtitle: "Getting everything ready for you...",
      duration: 2000
    },
    {
      id: 2,
      message: "TRAVA is being carefully curated for you",
      subtitle: "Setting up your personalized experience...",
      duration: 2500
    },
    {
      id: 3,
      message: "Almost ready!",
      subtitle: "Preparing your travel dashboard...",
      duration: 1500
    }
  ]

  // Typing animation function
  const typeMessage = (message: string, callback?: () => void) => {
    setIsTyping(true)
    setDisplayedText('')
    
    let index = 0
    const typingInterval = setInterval(() => {
      if (index < message.length) {
        setDisplayedText(message.substring(0, index + 1))
        index++
      } else {
        clearInterval(typingInterval)
        setIsTyping(false)
        callback?.()
      }
    }, 80) // Typing speed
  }
  

  // Progress through loading steps
  useEffect(() => {
    // TEMPORARY: Skip timing if disabled for development
    if (DISABLE_TIMING) {
      setCurrentStep(2) // Show final step
      setDisplayedText("TRAVA is being carefully curated for you")
      progressAnim.setValue(1) // Fill progress bar
      return
    }

    const runStep = (stepIndex: number) => {
      if (stepIndex >= loadingSteps.length) {
        // All steps complete, navigate to main app for now
        setTimeout(() => {
          router.replace('/(root)/(tabs)')
        }, 1000)
        return
      }

      const step = loadingSteps[stepIndex]
      setCurrentStep(stepIndex)

      // Animate progress bar
      Animated.timing(progressAnim, {
        toValue: (stepIndex + 1) / loadingSteps.length,
        duration: step.duration,
        useNativeDriver: false,
      }).start()

      // Type the message
      typeMessage(step.message, () => {
        // After typing, wait for step duration then move to next
        setTimeout(() => {
          runStep(stepIndex + 1)
        }, step.duration - 1000) // Subtract typing time
      })
    }

    // Start the sequence after initial animations
    setTimeout(() => {
      runStep(0)
    }, 1000)
  }, [])

  // Initial entrance animations
  useEffect(() => {
    // Fade in and scale up main content
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      })
    ]).start(() => {
      // Top content fades in first
      Animated.timing(topContentFadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }).start(() => {
        // Progress bar fades in after top content
        Animated.timing(progressBarFadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }).start()
      })
    })
  }, [])

  const logoRotation = logoRotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  })

  const currentStepData = loadingSteps[currentStep] || loadingSteps[0]

  return (
    <View style={styles.container}>
      <Animated.View 
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }]
          }
        ]}
      >
        {/* Top Content */}
        <Animated.View style={[styles.topContent, { opacity: topContentFadeAnim }]}>
          {/* Welcome Aboard Title */}
          <View style={styles.welcomeContainer}>
            <Text style={styles.welcomeTitle}>Welcome aboard</Text>
          </View>
          
          {/* Subtitle */}
          <Text style={styles.mainSubtitle}>TRAVA is now being carefully{'\n'} curated for you.</Text>
        </Animated.View>

        {/* Center Progress Bar */}
        <Animated.View style={[styles.centerContent, { opacity: progressBarFadeAnim }]}>
          <View style={styles.progressSection}>
            <View style={styles.progressBarContainer}>
              <Animated.View
                style={[
                  styles.progressBar,
                  {
                    width: progressAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%'],
                    }),
                  }
                ]}
              />
            </View>
          </View>
        </Animated.View>
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0705', // Use project's primaryBG color
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
  },
  topContent: {
    paddingTop:120,
    alignItems: 'center',
    width: '100%',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  mainContent: {
    alignItems: 'center',
    width: '100%',
  },
  welcomeContainer: {
    marginBottom: 24,
  },
  welcomeTitle: {
    fontSize: 28,
    color: '#FFFFFF', // White text for dark mode
    fontFamily: 'Belleza-Regular',
    textShadowColor: 'rgba(255, 255, 255, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    letterSpacing: 1,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  mainSubtitle: {
    color: '#FFFFFF', // Use project's secondaryFont color
    fontSize: 14,
    textAlign: 'center',
    fontFamily: 'Urbanist-SemiBold',
    marginBottom: 16,
    opacity: 0.9,
    lineHeight: 22,
  },
  progressSection: {
    width: '100%',
    maxWidth: 200, // Smaller, more minimal progress bar
    alignItems: 'center',
  },
  progressBarContainer: {
    width: '100%',
    height: 3, // Very thin line like in the image
    backgroundColor: '#39393b', // Use project's border color
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#f48080', // Use project's accentFont color
    borderRadius: 2,
  },
})

export default WelcomeAboard
