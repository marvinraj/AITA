import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { aitaApi } from '../lib/api';
import { aiChatService } from '../lib/services/aiChatService';
import { AIChat, AIMessage } from '../types/database';

// trip context interface
export interface TripContext {
  tripName: string;
  destination: string;
  startDate: string;
  endDate: string;
  companions: string;
  activities: string;
}

interface UseAIChatOptions {
  tripId: string;
  autoLoad?: boolean;
  tripContext?: TripContext;
}

interface UseAIChatReturn {
  // Data
  chat: AIChat | null;
  messages: AIMessage[];
  
  // State
  loading: boolean;
  error: string | null;
  
  // Actions
  sendMessage: (content: string) => Promise<void>;
  loadChat: () => Promise<void>;
  clearHistory: () => Promise<void>;
  refreshMessages: () => Promise<void>;
  
  // New AI Features
  generateSuggestions: () => Promise<string[]>;
  isTyping: boolean;
  
  // Utility
  clearError: () => void;
  isReady: boolean;
}

export function useAIChat({
  tripId,
  autoLoad = true,
  tripContext
}: UseAIChatOptions): UseAIChatReturn {
  
  // State
  const [chat, setChat] = useState<AIChat | null>(null);
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  
  // Track if we've already initialized this chat with context
  const initializedWithContext = useRef<string | null>(null);

  // Helper function to format dates
  const formatDate = useCallback((dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }, []);

  // Helper function to format companion type
  const formatCompanions = useCallback((companions: string) => {
    const companionMap: { [key: string]: string } = {
      'solo': 'solo',
      'partner': 'with your partner',
      'friends': 'with friends',
      'family': 'with family'
    };
    return companionMap[companions] || companions;
  }, []);

  // Function to initialize chat with trip context
  const initializeChatWithContext = useCallback(async (chatId: string, context: TripContext) => {
    try {
      // Check if chat already has messages (to avoid duplicate initialization)
      const existingMessages = await aiChatService.getMessageHistory(chatId);
      
      if (existingMessages.length > 0) {
        return;
      }
      // Create system message with trip context
      const systemMessage = `You are AITA, a helpful AI travel assistant. The user is planning a trip with the following details:

🌍 Destination: ${context.destination}
📅 Travel Dates: ${formatDate(context.startDate)} to ${formatDate(context.endDate)}
👥 Companions: ${formatCompanions(context.companions)}
🎯 Preferred Activities: ${context.activities.split(',').join(', ')}
✈️ Trip Name: ${context.tripName}

Please provide personalized travel advice and recommendations based on this information. Be proactive in suggesting activities, places to visit, and practical travel tips for their specific trip. Keep responses helpful, friendly, and tailored to their preferences.`;

      // Add system message
      await aiChatService.addMessage({
        chat_id: chatId,
        role: 'system',
        content: systemMessage,
        message_order: 0
      });

      // Create welcome message
      const activitiesList = context.activities.split(',');
      const activityText = activitiesList.length > 3 
        ? `${activitiesList.slice(0, 3).join(', ')} and more`
        : activitiesList.join(', ');

      const welcomeMessage = `Welcome to your ${context.destination} trip planning! 🎉

I see you're planning a ${formatCompanions(context.companions)} trip from ${formatDate(context.startDate)} to ${formatDate(context.endDate)}, with interest in ${activityText}.

I'm here to help you create an amazing itinerary! What would you like to know about ${context.destination}? I can help with:
• Specific attractions and activities
• Local food recommendations  
• Transportation tips
• Day-by-day planning
• Budget-friendly options

What interests you most about your upcoming trip?`;

      // Add welcome message
      await aiChatService.addMessage({
        chat_id: chatId,
        role: 'assistant',
        content: welcomeMessage,
        message_order: 1
      });

    } catch (error) {
      console.error('Error initializing chat with context:', error);
      throw error;
    }
  }, [formatDate, formatCompanions]);

  // Load chat and messages
  const loadChat = useCallback(async () => {
    if (!tripId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Get or create chat for this trip
      const chatData = await aiChatService.getChatByTripId(tripId);
      setChat(chatData);
      
      // Load message history
      const messageHistory = await aiChatService.getMessageHistory(chatData.id);
      setMessages(messageHistory);
      
    } catch (err) {
      console.error('Error loading chat:', err);
      // Handle duplicate chat creation error specifically
      if (err && typeof err === 'object' && 'code' in err && err.code === '23505') {
        console.log('Chat already exists, retrying...');
        // Retry once if it's a duplicate key error
        try {
          const chatData = await aiChatService.getChatByTripId(tripId);
          setChat(chatData);
          const messageHistory = await aiChatService.getMessageHistory(chatData.id);
          setMessages(messageHistory);
        } catch (retryErr) {
          console.error('Retry failed:', retryErr);
          setError('Failed to load chat');
        }
      } else {
        setError('Failed to load chat');
      }
    } finally {
      setLoading(false);
    }
  }, [tripId]);

  // Track initialization state to prevent race conditions
  const [initializationState, setInitializationState] = useState<'idle' | 'initializing' | 'completed'>('idle');

  // Separate effect to handle context initialization
  useEffect(() => {
    const initializeWithContext = async () => {
      // console.log('Initialization check:', {
      //   hasChat: !!chat,
      //   hasTripContext: !!tripContext,
      //   chatId: chat?.id,
      //   alreadyInitialized: initializedWithContext.current,
      //   initializationState,
      //   tripContextDetails: tripContext
      // });
      
      if (chat && tripContext && initializedWithContext.current !== chat.id && initializationState === 'idle') {
        try {
          console.log('Initializing chat with trip context:', tripContext.tripName);
          setInitializationState('initializing');
          setLoading(true);
          await initializeChatWithContext(chat.id, tripContext);
          initializedWithContext.current = chat.id;
          setInitializationState('completed');
          // Reload messages after adding context
          const updatedHistory = await aiChatService.getMessageHistory(chat.id);
          setMessages(updatedHistory);
        } catch (error) {
          console.error('Error initializing chat with context:', error);
          setInitializationState('idle'); // Reset state on error to allow retry
          setError('Failed to initialize chat with context');
        } finally {
          setLoading(false);
        }
      }
    };
    
    initializeWithContext();
  }, [chat, tripContext, initializeChatWithContext]);

  // Reset initialization state when chat changes
  useEffect(() => {
    if (chat?.id && initializedWithContext.current !== chat.id) {
      setInitializationState('idle');
    }
  }, [chat?.id]);

  // Send a message
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || !chat || loading) return;
    
    try {
      setLoading(true);
      setIsTyping(true);
      setError(null);
      
      // Get next message order
      const nextOrder = await aiChatService.getNextMessageOrder(chat.id);
      
      // Add user message to database
      const userMessage = await aiChatService.addMessage({
        chat_id: chat.id,
        role: 'user',
        content: content.trim(),
        message_order: nextOrder
      });
      
      // Update local state immediately
      setMessages(prev => [...prev, userMessage]);
      
      // Prepare messages for AI (convert to API format, exclude system messages)
      const messagesForAI = [...messages, userMessage]
        .filter(msg => msg.role !== 'system') // API only accepts user/assistant
        .map(msg => ({
          role: msg.role as 'user' | 'assistant',
          text: msg.content,
          time: new Date(msg.created_at).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          })
        }));
      
      // Enhanced context for AI
      const conversationContext = {
        tripDetails: tripContext ? {
          tripName: tripContext.tripName,
          destination: tripContext.destination,
          startDate: tripContext.startDate,
          endDate: tripContext.endDate,
          companions: tripContext.companions,
          activities: tripContext.activities
        } : undefined,
        currentFocus: 'planning' as const
      };
      
      // First, check if this should be a structured response
      const structuredData = await aitaApi.generateStructuredRecommendations(messagesForAI, tripContext);
      
      let aiResponse: string;
      let structuredContent: string | undefined = undefined;
      const startTime = Date.now();
      
      if (structuredData && structuredData.type === 'recommendations') {
        // Store structured data separately and use the response text
        aiResponse = structuredData.responseText;
        structuredContent = JSON.stringify(structuredData);
      } else {
        // Get regular AI response with enhanced context
        aiResponse = await aitaApi.createChatCompletion(messagesForAI, conversationContext);
      }
      
      const responseTime = Date.now() - startTime;
      
      // Add AI message to database
      const assistantMessage = await aiChatService.addMessage({
        chat_id: chat.id,
        role: 'assistant',
        content: aiResponse,
        message_order: nextOrder + 1,
        response_time_ms: responseTime,
        model_used: 'gemini-1.5-flash',
        structured_data: structuredContent // Store structured data if available
      });
      
      // Update local state
      setMessages(prev => [...prev, assistantMessage]);
      
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message');
      Alert.alert('Error', 'Failed to send message. Please try again.');
    } finally {
      setLoading(false);
      setIsTyping(false);
    }
  }, [chat, messages, loading, tripContext]);

  // Generate smart suggestions
  const generateSuggestions = useCallback(async (): Promise<string[]> => {
    if (!chat || messages.length === 0) return [];
    
    try {
      const messagesForAI = messages
        .filter(msg => msg.role !== 'system')
        .map(msg => ({
          role: msg.role as 'user' | 'assistant',
          text: msg.content,
          time: new Date(msg.created_at).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          })
        }));
      
      return await aitaApi.generateSmartSuggestions(messagesForAI, tripContext);
    } catch (error) {
      console.error('Error generating suggestions:', error);
      return [];
    }
  }, [chat, messages, tripContext]);

  // Refresh messages from database
  const refreshMessages = useCallback(async () => {
    if (!chat) return;
    
    try {
      setError(null);
      const messageHistory = await aiChatService.getMessageHistory(chat.id);
      setMessages(messageHistory);
    } catch (err) {
      console.error('Error refreshing messages:', err);
      setError('Failed to refresh messages');
    }
  }, [chat]);

  // Clear chat history
  const clearHistory = useCallback(async () => {
    if (!chat) return;
    
    try {
      setError(null);
      await aiChatService.clearChatHistory(chat.id);
      setMessages([]);
    } catch (err) {
      console.error('Error clearing history:', err);
      setError('Failed to clear history');
      Alert.alert('Error', 'Failed to clear chat history. Please try again.');
    }
  }, [chat]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Auto-load on mount and tripId change, but only if we have tripContext or don't need it
  useEffect(() => {
    if (autoLoad && tripId) {
      loadChat();
    }
  }, [autoLoad, tripId, loadChat]);

  // Computed properties
  const isReady = chat !== null && !loading;

  return {
    // Data
    chat,
    messages,
    
    // State
    loading,
    error,
    isTyping,
    
    // Actions
    sendMessage,
    loadChat,
    clearHistory,
    refreshMessages,
    generateSuggestions,
    
    // Utility
    clearError,
    isReady
  };
}
