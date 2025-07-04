// API service for AITA - handles communication with Google Gemini AI

import { GoogleGenerativeAI } from '@google/generative-ai';

interface Message {
  role: 'user' | 'assistant';
  text: string;
  time?: string;
}

class AITAApiService {
    private genAI: GoogleGenerativeAI;
    private readonly maxContextMessages = 20;
    private readonly systemPrompt = "You are AITA, a helpful AI travel assistant. Provide helpful, accurate travel advice and recommendations. Keep responses concise and friendly.";

    constructor() {
        // For development, we'll use the API key directly
        // In production, you should use environment variables
        const apiKey = 'AIzaSyDiJkARWeU-ZJr99Rs4NZbPKsQRSqX5LqQ';
        this.genAI = new GoogleGenerativeAI(apiKey);
    }

    // Create a chat completion with context management
    async createChatCompletion(messages: Message[]): Promise<string> {
        try {
            // Keep only recent messages to stay within context window
            const recentMessages = messages.slice(-this.maxContextMessages);
            
            // Get the Gemini model (using the correct model name)
            const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            
            // Convert messages to Gemini format and create chat
            const history = recentMessages.slice(0, -1).map(msg => ({
                role: msg.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: msg.text }]
            }));
            
            // Start chat with history and system prompt
            const chat = model.startChat({
                history: [
                    {
                        role: 'user',
                        parts: [{ text: this.systemPrompt }]
                    },
                    {
                        role: 'model',
                        parts: [{ text: 'I understand. I am AITA, your travel assistant. How can I help you with your travel plans?' }]
                    },
                    ...history
                ],
                generationConfig: {
                    maxOutputTokens: 1000,
                    temperature: 0.7,
                }
            });

            // Send the latest message
            const latestMessage = recentMessages[recentMessages.length - 1];
            const result = await chat.sendMessage(latestMessage.text);
            
            return result.response.text();
        } catch (error) {
            console.error('Error communicating with Gemini:', error);
            throw new Error('Failed to communicate with AI service');
        }
    }

    // Check if the API service is healthy
    async healthCheck(): Promise<boolean> {
        try {
            const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            const result = await model.generateContent("Hello");
            return !!result.response.text();
        } catch {
            return false;
        }
    }
}

// Export a singleton instance
export const aitaApi = new AITAApiService();

// Export the class for testing or custom instances
export { AITAApiService };

// Export types for use in components
    export type { Message };

