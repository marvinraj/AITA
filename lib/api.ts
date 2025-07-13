// API service for AITA - handles communication with Google Gemini AI

import { GoogleGenerativeAI } from '@google/generative-ai';

interface Message {
  role: 'user' | 'assistant';
  text: string;
  time?: string;
  tripContext?: {
    destination?: string;
    dates?: string;
    companions?: string;
    activities?: string;
  };
}

interface ConversationContext {
  tripDetails?: any;
  userPreferences?: string[];
  previousRecommendations?: string[];
  currentFocus?: 'planning' | 'booking' | 'during-trip' | 'general';
}

class AITAApiService {
    private genAI: GoogleGenerativeAI;
    private readonly maxContextMessages = 20;
    private readonly systemPrompt = `You are AITA, an expert AI travel assistant specializing in personalized travel planning and recommendations. You have extensive knowledge of:

🌍 **Global Destinations**: Attractions, local culture, hidden gems, seasonal considerations
🏨 **Accommodations**: Hotels, resorts, hostels, vacation rentals for all budgets
🍽️ **Local Cuisine**: Must-try dishes, restaurant recommendations, dietary accommodations
🚗 **Transportation**: Flights, trains, buses, car rentals, local transport options
💰 **Budget Planning**: Cost estimates, money-saving tips, value optimization
📅 **Itinerary Planning**: Day-by-day schedules, time management, activity sequencing
🎯 **Activity Matching**: Personalized suggestions based on interests and travel style
⚠️ **Safety & Practical Tips**: Health advisories, visa requirements, local customs

**Your Communication Style:**
- Provide specific, actionable recommendations with reasons
- Include practical details (costs, timing, booking tips)
- Offer alternatives for different budgets and preferences
- Use emojis strategically to enhance readability
- Ask clarifying questions when needed
- Structure responses with clear sections when providing detailed information

**Always consider:**
- The user's specific trip context (dates, destination, companions, interests)
- Current season and weather implications
- Local events and festivals during their travel period
- Accessibility needs and family-friendly options when relevant`;

    constructor() {
        // Get API key from environment variables
        const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error('EXPO_PUBLIC_GEMINI_API_KEY is not set in environment variables');
        }
        this.genAI = new GoogleGenerativeAI(apiKey);
    }

    // Create a chat completion with context management
    async createChatCompletion(messages: Message[], conversationContext?: ConversationContext): Promise<string> {
        try {
            // Keep only recent messages to stay within context window
            const recentMessages = messages.slice(-this.maxContextMessages);
            
            // Get the Gemini model (using the correct model name)
            const model = this.genAI.getGenerativeModel({ 
                model: "gemini-1.5-flash",
                generationConfig: {
                    maxOutputTokens: 1200,
                    temperature: 0.7,
                    topP: 0.8,
                    topK: 40,
                }
            });
            
            // Enhanced context building
            let contextualPrompt = this.systemPrompt;
            
            if (conversationContext?.tripDetails) {
                contextualPrompt += `\n\n📍 **Current Trip Context:**
Destination: ${conversationContext.tripDetails.destination}
Dates: ${conversationContext.tripDetails.startDate} to ${conversationContext.tripDetails.endDate}
Travelers: ${conversationContext.tripDetails.companions}
Interests: ${conversationContext.tripDetails.activities}`;
            }

            if (conversationContext?.userPreferences?.length) {
                contextualPrompt += `\n\n🎯 **User Preferences:** ${conversationContext.userPreferences.join(', ')}`;
            }

            if (conversationContext?.currentFocus) {
                contextualPrompt += `\n\n📋 **Current Focus:** ${conversationContext.currentFocus}`;
            }
            
            // Convert messages to Gemini format and create chat
            const history = recentMessages.slice(0, -1).map(msg => ({
                role: msg.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: msg.text }]
            }));
            
            // Start chat with history and enhanced system prompt
            const chat = model.startChat({
                history: [
                    {
                        role: 'user',
                        parts: [{ text: contextualPrompt }]
                    },
                    {
                        role: 'model',
                        parts: [{ text: 'I understand. I am AITA, your expert travel assistant. I have your trip details and I\'m ready to provide personalized recommendations. How can I help you plan an amazing trip?' }]
                    },
                    ...history
                ],
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

    // New method: Generate smart suggestions based on conversation
    async generateSmartSuggestions(messages: Message[], tripContext?: any): Promise<string[]> {
        try {
            const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            
            const recentConversation = messages.slice(-5).map(m => `${m.role}: ${m.text}`).join('\n');
            
            const prompt = `Based on this travel conversation and trip to ${tripContext?.destination || 'their destination'}, suggest 3 helpful follow-up questions or topics the user might want to explore:

Recent conversation:
${recentConversation}

Provide exactly 3 short, actionable suggestions (max 8 words each) that would be useful next steps. Format as a simple list.`;

            const result = await model.generateContent(prompt);
            const suggestions = result.response.text().split('\n')
                .filter(line => line.trim())
                .slice(0, 3);
            
            return suggestions;
        } catch (error) {
            console.error('Error generating suggestions:', error);
            return [];
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

