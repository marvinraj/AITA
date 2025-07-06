import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { aitaApi } from '../lib/api';
import { aiChatService } from '../lib/services/aiChatService';
import { AIChat, AIMessage } from '../types/database';

interface UseAIChatOptions {
  tripId: string;
  autoLoad?: boolean;
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
  autoLoad = true
}: UseAIChatOptions): UseAIChatReturn {
  
  // State
  const [chat, setChat] = useState<AIChat | null>(null);
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      setError('Failed to load chat');
    } finally {
      setLoading(false);
    }
  }, [tripId]);

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
