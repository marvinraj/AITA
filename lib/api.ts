// API service for TRAVA - handles communication with Google Gemini AI

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

class TRAVAApiService {
    private genAI: GoogleGenerativeAI;
    private readonly maxContextMessages = 20;
    private readonly systemPrompt = `You are TRAVA, an expert AI travel assistant specializing in personalized travel planning and recommendations. You have extensive knowledge of:

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
        
        // DEBUG: Log API key info (remove after testing)
        console.log('🔑 API Key Status:');
        console.log('- Exists:', !!apiKey);
        console.log('- Format:', apiKey ? `${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 4)}` : 'N/A');
        console.log('- Length:', apiKey?.length || 0);
        
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
Trip Name: ${conversationContext.tripDetails.tripName}
Destination: ${conversationContext.tripDetails.destination}
Dates: ${conversationContext.tripDetails.startDate} to ${conversationContext.tripDetails.endDate}
Travelers: ${conversationContext.tripDetails.companions}
Interests: ${conversationContext.tripDetails.activities}`;

                // Include current itinerary if available
                if (conversationContext.tripDetails.currentItinerary && conversationContext.tripDetails.currentItinerary.length > 0) {
                    console.log('🎯 AI Context: Including', conversationContext.tripDetails.currentItinerary.length, 'itinerary items');
                    contextualPrompt += `\n\n📋 **Current Itinerary Status:**`;
                    
                    // Group items by date for better organization
                    const itemsByDate = conversationContext.tripDetails.currentItinerary.reduce((acc: any, item: any) => {
                        if (!acc[item.date]) acc[item.date] = [];
                        acc[item.date].push(item);
                        return acc;
                    }, {});
                    
                    Object.entries(itemsByDate).forEach(([date, items]) => {
                        const dayItems = items as any[];
                        contextualPrompt += `\n${date}:`;
                        dayItems.sort((a, b) => (a.time || '00:00').localeCompare(b.time || '00:00'));
                        dayItems.forEach(item => {
                            const timeStr = item.time ? ` ${item.time}` : ' TBD';
                            const locationStr = item.location ? ` at ${item.location}` : '';
                            contextualPrompt += `\n  ${timeStr}: ${item.title}${locationStr}`;
                        });
                    });
                    
                    contextualPrompt += `\n\n⚠️ **Important:** Consider existing schedule when making recommendations. Avoid duplicates, suggest nearby activities, and fill gaps in timing.`;
                } else {
                    contextualPrompt += `\n\n📋 **Current Itinerary:** Empty - opportunity to suggest comprehensive planning!`;
                }
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
                        parts: [{ text: 'I understand. I am TRAVA, your expert travel assistant. I have your trip details and I\'m ready to provide personalized recommendations. How can I help you plan an amazing trip?' }]
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

    // Generate smart suggestions based on conversation
    async generateSmartSuggestions(messages: Message[], tripContext?: any): Promise<string[]> {
        try {
            const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            
            const recentConversation = messages.slice(-5).map(m => `${m.role}: ${m.text}`).join('\n');
            
            // Include itinerary context in suggestions
            let itineraryContext = '';
            if (tripContext?.itineraryItems && tripContext.itineraryItems.length > 0) {
                itineraryContext = `\n\nCurrent itinerary summary:`;
                tripContext.itineraryItems.forEach((item: any) => {
                    itineraryContext += `\n- ${item.date} ${item.time || 'TBD'}: ${item.title}`;
                });
                itineraryContext += `\n\nConsider gaps in schedule and opportunities for nearby activities.`;
            } else {
                itineraryContext = `\n\nItinerary is currently empty - great opportunity for comprehensive planning.`;
            }
            
            const prompt = `Based on this travel conversation and trip to ${tripContext?.destination || 'their destination'}, suggest 3 helpful follow-up questions or topics the user might want to explore:

Recent conversation:
${recentConversation}${itineraryContext}

Provide exactly 3 short, actionable suggestions (max 8 words each) that would be useful next steps. Consider current itinerary status and suggest complementary activities. Format as a simple list.`;

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

    // Generate structured recommendations
    async generateStructuredRecommendations(messages: Message[], tripContext?: any): Promise<any> {
        try {
            const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            
            const latestMessage = messages[messages.length - 1]?.text || '';
            
            // Check if the message is asking for specific recommendations
            const isAskingForRecommendations = /\b(cafes?|restaurants?|hotels?|attractions?|places?|spots?)\b/i.test(latestMessage);
            const isAskingForNumber = /\b(\d+)\b/.test(latestMessage);
            
            if (!isAskingForRecommendations) {
                return null; // Regular response, no structured data needed
            }

            const prompt = `You are a travel assistant. The user is asking for recommendations for their trip "${tripContext?.tripName || 'trip'}" in ${tripContext?.destination || 'their destination'}.

User's request: "${latestMessage}"

If this is a request for specific places (cafes, restaurants, attractions, etc.), respond with a JSON object in this EXACT format:
{
  "type": "recommendations",
  "category": "cafes|restaurants|attractions|hotels|activities",
  "items": [
    {
      "name": "Place Name",
      "description": "Brief description (max 100 chars)",
      "rating": 4.5,
      "priceLevel": "$|$$|$$$|$$$$",
      "location": "Area/District",
      "highlights": ["feature1", "feature2", "feature3"],
      "googleMapsQuery": "Place Name + ${tripContext?.destination || 'location'}"
    }
  ],
  "responseText": "Here are some great recommendations for your ${tripContext?.tripName || 'trip'}! Each one offers something unique:"
}

Provide 3-5 realistic recommendations based on the user's request. Make sure the JSON is valid and the googleMapsQuery can be used to search on Google Maps.

If this is NOT a request for specific places, just respond with: {"type": "regular"}`;

            const result = await model.generateContent(prompt);
            let responseText = result.response.text().trim();
            
            // Clean up the response to extract JSON
            responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            
            try {
                const parsedResponse = JSON.parse(responseText);
                return parsedResponse.type === 'recommendations' ? parsedResponse : null;
            } catch (parseError) {
                console.log('Could not parse structured response, treating as regular message');
                return null;
            }
        } catch (error) {
            console.error('Error generating structured recommendations:', error);
            return null;
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
export const travaApi = new TRAVAApiService();

// Export the class for testing or custom instances
export { TRAVAApiService };

// Export types for use in components
    export type { Message };

