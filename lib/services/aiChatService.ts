import {
    AIChat,
    AIMessage,
    CreateAIChatInput,
    CreateAIMessageInput,
    UpdateAIChatInput,
    UpdateAIMessageInput
} from '../../types/database';
import { supabase } from '../supabase';

export class AIChatService {
  
  // ==========================================
  // CHAT MANAGEMENT
  // ==========================================
  
  /**
   * Create a new AI chat for a specific trip
   */
  async createChatForTrip(tripId: string, title?: string): Promise<AIChat> {
    try {
      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        throw new Error('User not authenticated');
      }

      const chatData: CreateAIChatInput = {
        trip_id: tripId,
        title: title || `AI Assistant Chat`,
        is_active: true
      };

      const { data, error } = await supabase
        .from('ai_chats')
        .insert([chatData])
        .select()
        .single();

      if (error) {
        console.error('Error creating AI chat:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Failed to create AI chat:', error);
      throw error;
    }
  }

  /**
   * Get AI chat by trip ID (creates one if it doesn't exist)
   */
  async getChatByTripId(tripId: string): Promise<AIChat> {
    try {
      // First try to get existing chat
      const { data, error } = await supabase
        .from('ai_chats')
        .select('*')
        .eq('trip_id', tripId)
        .single();

      if (error && error.code === 'PGRST116') {
        // No chat found, create one
        return await this.createChatForTrip(tripId);
      }

      if (error) {
        console.error('Error fetching AI chat:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Failed to get AI chat:', error);
      throw error;
    }
  }

  /**
   * Update an existing AI chat
   */
  async updateChat(chatId: string, updates: UpdateAIChatInput): Promise<AIChat> {
    try {
      const { data, error } = await supabase
        .from('ai_chats')
        .update(updates)
        .eq('id', chatId)
        .select()
        .single();

      if (error) {
        console.error('Error updating AI chat:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Failed to update AI chat:', error);
      throw error;
    }
  }

  /**
   * Delete an AI chat and all its messages
   */
  async deleteChat(chatId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('ai_chats')
        .delete()
        .eq('id', chatId);

      if (error) {
        console.error('Error deleting AI chat:', error);
        throw error;
      }
    } catch (error) {
      console.error('Failed to delete AI chat:', error);
      throw error;
    }
  }

  // ==========================================
  // MESSAGE MANAGEMENT
  // ==========================================

  /**
   * Get all messages for a specific chat, ordered by message_order
   */
  async getMessageHistory(chatId: string): Promise<AIMessage[]> {
    try {
      const { data, error } = await supabase
        .from('ai_messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('message_order', { ascending: true });

      if (error) {
        console.error('Error fetching message history:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Failed to get message history:', error);
      throw error;
    }
  }

  /**
   * Add a new message to a chat
   */
  async addMessage(messageData: CreateAIMessageInput): Promise<AIMessage> {
    try {
      const { data, error } = await supabase
        .from('ai_messages')
        .insert([messageData])
        .select()
        .single();

      if (error) {
        console.error('Error adding message:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Failed to add message:', error);
      throw error;
    }
  }

  /**
   * Update an existing message
   */
  async updateMessage(messageId: string, updates: UpdateAIMessageInput): Promise<AIMessage> {
    try {
      const { data, error } = await supabase
        .from('ai_messages')
        .update(updates)
        .eq('id', messageId)
        .select()
        .single();

      if (error) {
        console.error('Error updating message:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Failed to update message:', error);
      throw error;
    }
  }

  /**
   * Delete a specific message
   */
  async deleteMessage(messageId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('ai_messages')
        .delete()
        .eq('id', messageId);

      if (error) {
        console.error('Error deleting message:', error);
        throw error;
      }
    } catch (error) {
      console.error('Failed to delete message:', error);
      throw error;
    }
  }

  /**
   * Get the next message order number for a chat
   */
  async getNextMessageOrder(chatId: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('ai_messages')
        .select('message_order')
        .eq('chat_id', chatId)
        .order('message_order', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Error getting message order:', error);
        throw error;
      }

      // If no messages exist, start with 0
      if (!data || data.length === 0) {
        return 0;
      }

      // Return next order number
      return data[0].message_order + 1;
    } catch (error) {
      console.error('Failed to get next message order:', error);
      throw error;
    }
  }

  // ==========================================
  // UTILITY METHODS
  // ==========================================

  /**
   * Clear all messages from a chat (keeping the chat itself)
   */
  async clearChatHistory(chatId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('ai_messages')
        .delete()
        .eq('chat_id', chatId);

      if (error) {
        console.error('Error clearing chat history:', error);
        throw error;
      }
    } catch (error) {
      console.error('Failed to clear chat history:', error);
      throw error;
    }
  }

  /**
   * Get chat statistics (message count, last activity, etc.)
   */
  async getChatStats(chatId: string): Promise<{
    messageCount: number;
    userMessageCount: number;
    assistantMessageCount: number;
    lastActivity: string | null;
  }> {
    try {
      const { data, error } = await supabase
        .from('ai_messages')
        .select('role, created_at')
        .eq('chat_id', chatId);

      if (error) {
        console.error('Error getting chat stats:', error);
        throw error;
      }

      const messages = data || [];
      const userMessages = messages.filter(m => m.role === 'user');
      const assistantMessages = messages.filter(m => m.role === 'assistant');
      const lastActivity = messages.length > 0 
        ? messages.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0].created_at
        : null;

      return {
        messageCount: messages.length,
        userMessageCount: userMessages.length,
        assistantMessageCount: assistantMessages.length,
        lastActivity
      };
    } catch (error) {
      console.error('Failed to get chat stats:', error);
      throw error;
    }
  }

  /**
   * Export chat history as text
   */
  async exportChatHistory(chatId: string): Promise<string> {
    try {
      const messages = await this.getMessageHistory(chatId);
      
      const exportText = messages.map(msg => {
        const timestamp = new Date(msg.created_at).toLocaleString();
        const role = msg.role.charAt(0).toUpperCase() + msg.role.slice(1);
        return `[${timestamp}] ${role}: ${msg.content}`;
      }).join('\n\n');

      return exportText;
    } catch (error) {
      console.error('Failed to export chat history:', error);
      throw error;
    }
  }
}

// Export a singleton instance
export const aiChatService = new AIChatService();
