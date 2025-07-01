// API service for AITA - handles communication with the backend AI model (on google colab)

interface Message {
  role: 'user' | 'assistant' | 'system';
  text?: string;
  content?: Array<{ type: string; text: string }>;
  time?: string;
}

// This interface is used to format messages for the API
interface ApiMessage {
  role: string;
  content: Array<{ type: string; text: string }>;
}

class AITAApiService {
    // Base URL for the AI service
    private readonly baseUrl = 'https://aita-travel-ai.loca.lt';

    // Maximum number of messages to keep in context
    private readonly maxContextMessages = 20;


   // Send messages to the AI model and get a response
    async sendMessage(messages: Message[]): Promise<string> {
        try {
            const response = await fetch(`${this.baseUrl}/generate`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json', 
                    'Bypass-Tunnel-Reminder': 'true'  // LocalTunnel header
                },
                body: JSON.stringify({ messages: this.formatMessagesForApi(messages) }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            if (!data.result) {
                throw new Error('No result in response');
            }

            return this.processResponse(data.result);
        } catch (error) {
            console.error('Error communicating with AI:', error);
            throw new Error('Failed to communicate with AI service');
        }
    }

    // Create a chat completion with system message and context management
    async createChatCompletion(messages: Message[]): Promise<string> {
        // Keep only recent messages to stay within context window
        const recentMessages = messages.slice(-this.maxContextMessages);

        // Add system message
        const systemMessage: Message = {
        role: "system",
        content: [{ type: "text", text: "You are AITA, a helpful AI travel assistant. Provide helpful, accurate travel advice and recommendations." }]
        };

        const messagesWithSystem = [systemMessage, ...recentMessages];
        return this.sendMessage(messagesWithSystem);
    }

    // Format messages for the API
    private formatMessagesForApi(messages: Message[]): ApiMessage[] {
        return messages.map(msg => ({
        role: msg.role,
        content: msg.content || [{ type: "text", text: msg.text || "" }]
        }));
    }

    // Process the API response by cleaning up formatting
    private processResponse(response: string): string {
        // Remove <think>...</think> blocks
        const withoutThink = response.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
        
        // Extract only the assistant's reply after the last 'Assistant:'
        const assistantIndex = withoutThink.lastIndexOf('Assistant:');
        if (assistantIndex !== -1) {
        return withoutThink.substring(assistantIndex + 'Assistant:'.length).trim();
        }
        
        return withoutThink;
    }

    // Check if the API service is healthy
    async healthCheck(): Promise<boolean> {
        try {
            const response = await fetch(`${this.baseUrl}/health`);
            return response.ok;
        } catch {
            return false;
        }
    }

    // Update the base URL (useful for development/production environments)
    setBaseUrl(url: string): void {
        // Remove trailing slash
        (this as any).baseUrl = url.replace(/\/$/, '');
    }
}

// Export a singleton instance
export const aitaApi = new AITAApiService();

// Export the class for testing or custom instances
export { AITAApiService };

// Export types for use in components
    export type { ApiMessage, Message };

