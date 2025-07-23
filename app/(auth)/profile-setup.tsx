import { useRouter } from 'expo-router'
import React, { useEffect, useRef, useState } from 'react'
import { Alert, Animated, Dimensions, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { supabase } from '../../lib/supabase'

const { width: screenWidth } = Dimensions.get('window')

const ProfileSetup = () => {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)

  // Animation values
  const headerFadeAnim = useRef(new Animated.Value(0)).current
  const formFadeAnim = useRef(new Animated.Value(0)).current
  const buttonFadeAnim = useRef(new Animated.Value(0)).current

  // Start animations on component mount
  useEffect(() => {
    const animateIn = () => {
      // Header fades in first
      Animated.timing(headerFadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }).start(() => {
        // Form fades in after header
        Animated.timing(formFadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }).start(() => {
          // Button fades in last
          Animated.timing(buttonFadeAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }).start()
        })
      })
    }

    // Small delay before starting animations
    const timer = setTimeout(animateIn, 200)
    return () => clearTimeout(timer)
  }, [])

  const handleContinue = async () => {
    if (!fullName.trim()) {
      Alert.alert('Required Field', 'Please enter your full name to continue.')
      return
    }

    setLoading(true)
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        throw new Error('Unable to get user information')
      }

      // Save the full name to the profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          full_name: fullName.trim(),
          updated_at: new Date().toISOString()
        })

      if (profileError) {
        throw profileError
      }

      // Navigate to welcome aboard screen
      router.replace('/(auth)/welcome-aboard')
    } catch (error) {
      console.error('Error saving profile:', error)
      Alert.alert('Error', 'Failed to save your information. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View style={[styles.header, { opacity: headerFadeAnim }]}>
          <Text style={styles.title}>Let's get to know you</Text>
          <Text style={styles.subtitle}>
           So, what's your full name?
          </Text>
        </Animated.View>

        {/* Form */}
        <Animated.View style={[styles.form, { opacity: formFadeAnim }]}>
          <Text style={styles.label}>Full Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your full name"
            placeholderTextColor="#828282"
            value={fullName}
            onChangeText={setFullName}
            autoCapitalize="words"
            autoCorrect={false}
            autoFocus={true}
          />
        </Animated.View>

        {/* Continue Button */}
        <Animated.View style={{ opacity: buttonFadeAnim }}>
          <TouchableOpacity
            style={[styles.continueButton, loading && styles.buttonDisabled]}
            onPress={handleContinue}
            disabled={loading || !fullName.trim()}
          >
            <Text style={styles.continueButtonText}>
              {loading ? 'Saving...' : 'Continue'}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0705',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 32,
    paddingTop: 120,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 60,
  },
  title: {
    fontSize: 28,
    color: '#FFFFFF',
    fontFamily: 'Belleza-Regular',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#828282',
    fontFamily: 'Urbanist-SemiBold',
    textAlign: 'center',
    lineHeight: 22,
    opacity: 0.9,
  },
  form: {
    marginBottom: 60,
    marginTop: 50,
  },
  label: {
    fontSize: 14,
    color: '#FFFFFF',
    fontFamily: 'Urbanist-SemiBold',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#1C1C1C',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 16,
    color: '#FFFFFF',
    fontFamily: 'Urbanist-SemiBold',
    borderWidth: 1,
    borderColor: '#39393b',
  },
  continueButton: {
    backgroundColor: '#f48080',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  continueButtonText: {
    fontSize: 16,
    color: '#000000',
    fontFamily: 'Urbanist-SemiBold',
    fontWeight: '600',
  },
})

export default ProfileSetup
