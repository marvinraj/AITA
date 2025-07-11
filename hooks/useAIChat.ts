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
      // Create system message with trip context
      const systemMessage = `You are AITA, a helpful AI travel assistant. The user is planning a trip with the following details:

🌍 **Destination:** ${context.destination}
📅 **Travel Dates:** ${formatDate(context.startDate)} to ${formatDate(context.endDate)}
👥 **Companions:** ${formatCompanions(context.companions)}
🎯 **Preferred Activities:** ${context.activities.split(',').join(', ')}
✈️ **Trip Name:** ${context.tripName}

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

  // Separate effect to handle context initialization
  useEffect(() => {
    const initializeWithContext = async () => {
      if (chat && tripContext && messages.length === 0 && initializedWithContext.current !== chat.id) {
        try {
          console.log('Initializing chat with trip context');
          setLoading(true);
          await initializeChatWithContext(chat.id, tripContext);
          initializedWithContext.current = chat.id;
          // Reload messages after adding context
          const updatedHistory = await aiChatService.getMessageHistory(chat.id);
          setMessages(updatedHistory);
        } catch (error) {
          console.error('Error initializing chat with context:', error);
          setError('Failed to initialize chat with context');
        } finally {
          setLoading(false);
        }
      }
    };
    
    initializeWithContext();
  }, [chat, tripContext, messages.length, initializeChatWithContext]);

  // Send a message
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || !chat || loading) return;
    
    try {
      setLoading(true);
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
      
      // Get AI response
      const startTime = Date.now();
      const aiResponse = await aitaApi.createChatCompletion(messagesForAI);
      const responseTime = Date.now() - startTime;
      
      // Add AI message to database
      const assistantMessage = await aiChatService.addMessage({
        chat_id: chat.id,
        role: 'assistant',
        content: aiResponse,
        message_order: nextOrder + 1,
        response_time_ms: responseTime,
        model_used: 'gemini-pro'
      });
      
      // Update local state
      setMessages(prev => [...prev, assistantMessage]);
      
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message');
      Alert.alert('Error', 'Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [chat, messages, loading]);

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

  // Auto-load on mount and tripId change
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
    
    // Actions
    sendMessage,
    loadChat,
    clearHistory,
    refreshMessages,
    
    // Utility
    clearError,
    isReady
  };
}
