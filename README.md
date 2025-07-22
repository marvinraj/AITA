# AITA - AI Travel Assistant

<p align="center">
  <img src="./assets/images/logo.png" alt="AITA Logo" width="120" height="120">
</p>

<p align="center">
  <strong>Your very own AI-powered travel companion</strong>
</p>

<p align="center">
  A comprehensive travel planning and assistance app built with React Native, Expo, and powered by Google Gemini Pro AI
</p>

---

## 🌟 Features

### 🤖 **AI-Powered Travel Assistant**
- **Smart Conversations**: Chat with an AI assistant powered by Google Gemini Pro
- **Personalized Recommendations**: Get tailored suggestions based on your preferences, travel dates, and destinations
- **Context-Aware Responses**: AI remembers your trip details and provides relevant advice
- **Multi-Language Support**: Communicate in your preferred language

### 🗺️ **Intelligent Trip Planning**
- **Dynamic Itinerary Creation**: Build and modify itineraries with AI assistance
- **Smart Scheduling**: Optimize your daily plans based on location, time, and preferences
- **Activity Recommendations**: Discover attractions, restaurants, and hidden gems
- **Budget Planning**: Get cost estimates and money-saving tips

### 📱 **Comprehensive Travel Management**
- **Trip Organization**: Create, edit, and manage multiple trips
- **Real-time Data Integration**: Access live weather, maps, and location services
- **Travel Checklist**: Never forget important travel preparations
- **Memory & Notes**: Save important travel memories and notes
- **Saved Places**: Bookmark favorite destinations and recommendations

### 🔧 **Smart Features**
- **Location-Based Suggestions**: Get recommendations based on your current location
- **Push Notifications**: Receive travel reminders and location-based alerts
- **Offline Capabilities**: Access saved information without internet
- **Cross-Platform Sync**: Your data syncs across all devices

---

## 🏗️ **Architecture Overview**

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   React Native  │    │   Google Gemini  │    │    Supabase     │
│   Mobile App    │◄──►│      AI API      │    │   Backend       │
│                 │    │                  │    │                 │
│ • User Interface│    │ • Natural Language│   │ • Authentication│
│ • Navigation    │    │   Processing     │    │ • Data Storage  │
│ • State Mgmt    │    │ • Recommendations│    │ • Real-time Sync│
│ • Local Storage │    │ • Context Aware  │    │ • Chat History  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                        │                        │
         └────────────────────────┼────────────────────────┘
                                  │
                ┌─────────────────────────────────┐
                │        External APIs            │
                │                                 │
                │ • Maps & Location Services      │
                │ • Weather Data                  │
                │ • Travel Information APIs       │
                └─────────────────────────────────┘
```

---

## 🛠️ **Tech Stack**

### **Frontend**
- **React Native** `0.79.5` - Cross-platform mobile development
- **Expo** `53.0.20` - Development platform and toolchain
- **TypeScript** `5.8.3` - Type-safe JavaScript
- **Expo Router** `5.1.4` - File-based navigation
- **NativeWind** `4.1.23` - Tailwind CSS for React Native
- **React Native Reanimated** `3.17.4` - Smooth animations

### **AI & Backend**
- **Google Generative AI** `0.24.1` - Gemini Pro integration
- **Supabase** `2.39.7` - Backend-as-a-Service
- **PostgreSQL** - Relational database (via Supabase)
- **Real-time subscriptions** - Live data sync

### **Maps & Location**
- **React Native Maps** `1.20.1` - Interactive maps
- **Expo Location** `18.1.6` - GPS and location services
- **Expo Notifications** `0.31.4` - Push notifications

### **UI & UX**
- **Expo Vector Icons** `14.1.0` - Icon library
- **React Native Calendars** `1.1260.0` - Date selection
- **React Native Linear Gradient** `2.8.3` - Beautiful gradients
- **React Native Markdown Display** `7.0.2` - Rich text rendering

---

## 🚀 **Getting Started**

### **Prerequisites**
- Node.js (v18 or higher)
- npm or yarn
- Expo CLI
- Android Studio (for Android development)
- Xcode (for iOS development on macOS)

### **Installation**

1. **Clone the repository**
   ```bash
   git clone https://github.com/marvinraj/AITA-ai-travel-assistant.git
   cd aita-ai
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Environment Setup**
   
   Create a `.env` file in the root directory:
   ```env
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   EXPO_PUBLIC_GEMINI_API_KEY=your_google_gemini_api_key
   ```

4. **Database Setup**
   
   Run the Supabase migrations in order:
   ```bash
   # Navigate to supabase folder and run SQL files in your Supabase dashboard
   # Or use Supabase CLI:
   supabase db reset
   ```

5. **Start the development server**
   ```bash
   npm start
   # or
   expo start
   ```

6. **Run on device/simulator**
   ```bash
   # For iOS
   npm run ios
   
   # For Android  
   npm run android
   
   # For Web
   npm run web
   ```

---

## 🤖 **Google Gemini AI Integration - Deep Dive**

The heart of AITA is its sophisticated AI integration using Google's Gemini Pro API. Here's a comprehensive breakdown of how the AI system works:

### **🏗️ Architecture Overview**

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   User Input    │───▶│  Context Builder │───▶│  Gemini API     │
│                 │    │                  │    │                 │
│ • Chat messages │    │ • System prompt  │    │ • Model: gemini-│
│ • Trip details  │    │ • Trip context   │    │   1.5-flash     │
│ • Itinerary     │    │ • Conversation   │    │ • Temp: 0.7     │
│ • Preferences   │    │   history        │    │ • Max: 1200     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                        │                        │
         │                        ▼                        ▼
         │              ┌──────────────────┐    ┌─────────────────┐
         │              │  Message History │    │   AI Response   │
         │              │                  │    │                 │
         │              │ • Last 20 msgs   │    │ • Regular chat  │
         │              │ • Role mapping   │    │ • Structured    │
         │              │ • Context limit  │    │ • Suggestions   │
         │              └──────────────────┘    └─────────────────┘
         │                                                 │
         ▼                                                 ▼
┌─────────────────┐                              ┌─────────────────┐
│  Response       │◄─────────────────────────────│  Response       │
│  Processing     │                              │  Generation     │
│                 │                              │                 │
│ • Parse JSON    │                              │ • Chat response │
│ • Extract data  │                              │ • Smart suggest │
│ • UI rendering  │                              │ • Structured rec│
└─────────────────┘                              └─────────────────┘
```

### **🧠 AI Service Implementation (`lib/api.ts`)**

#### **1. Service Initialization**
```typescript
class AITAApiService {
    private genAI: GoogleGenerativeAI;
    private readonly maxContextMessages = 20;
    
    constructor() {
        const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error('EXPO_PUBLIC_GEMINI_API_KEY is not set');
        }
        this.genAI = new GoogleGenerativeAI(apiKey);
    }
}
```

#### **2. System Prompt Engineering**
The AI uses a comprehensive system prompt that defines its personality and expertise:

```typescript
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
- Structure responses with clear sections when providing detailed information`;
```

#### **3. Context-Aware Conversation Management**

The AI system builds rich context from multiple sources:

**A. Trip Context Integration**
```typescript
// Dynamic context building based on trip details
if (conversationContext?.tripDetails) {
    contextualPrompt += `\n\n📍 **Current Trip Context:**
    Trip Name: ${conversationContext.tripDetails.tripName}
    Destination: ${conversationContext.tripDetails.destination}
    Dates: ${conversationContext.tripDetails.startDate} to ${conversationContext.tripDetails.endDate}
    Travelers: ${conversationContext.tripDetails.companions}
    Interests: ${conversationContext.tripDetails.activities}`;
}
```

**B. Itinerary-Aware Recommendations**
```typescript
// Include current itinerary for smarter suggestions
if (conversationContext.tripDetails.currentItinerary && 
    conversationContext.tripDetails.currentItinerary.length > 0) {
    
    // Group items by date for better organization
    const itemsByDate = conversationContext.tripDetails.currentItinerary.reduce((acc, item) => {
        if (!acc[item.date]) acc[item.date] = [];
        acc[item.date].push(item);
        return acc;
    }, {});
    
    Object.entries(itemsByDate).forEach(([date, items]) => {
        contextualPrompt += `\n${date}:`;
        items.sort((a, b) => (a.time || '00:00').localeCompare(b.time || '00:00'));
        items.forEach(item => {
            const timeStr = item.time ? ` ${item.time}` : ' TBD';
            const locationStr = item.location ? ` at ${item.location}` : '';
            contextualPrompt += `\n  ${timeStr}: ${item.title}${locationStr}`;
        });
    });
    
    contextualPrompt += `\n\n⚠️ **Important:** Consider existing schedule when making recommendations. 
    Avoid duplicates, suggest nearby activities, and fill gaps in timing.`;
}
```

#### **4. Message Processing & API Calls**

**A. Model Configuration**
```typescript
const model = this.genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash",
    generationConfig: {
        maxOutputTokens: 1200,    // Reasonable response length
        temperature: 0.7,         // Balance creativity vs consistency
        topP: 0.8,               // Nucleus sampling for quality
        topK: 40,                // Limit token selection for coherence
    }
});
```

**B. Conversation History Management**
```typescript
// Keep only recent messages to stay within context window
const recentMessages = messages.slice(-this.maxContextMessages);

// Convert messages to Gemini format
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
            parts: [{ text: 'I understand. I am AITA, your expert travel assistant...' }]
        },
        ...history
    ],
});
```

**C. Response Generation**
```typescript
// Send the latest message and get response
const latestMessage = recentMessages[recentMessages.length - 1];
const result = await chat.sendMessage(latestMessage.text);
return result.response.text();
```

### **🎯 Smart Features Implementation**

#### **1. Intelligent Suggestions (`generateSmartSuggestions`)**
```typescript
async generateSmartSuggestions(messages: Message[], tripContext?: any): Promise<string[]> {
    const recentConversation = messages.slice(-5).map(m => `${m.role}: ${m.text}`).join('\n');
    
    // Include itinerary context for gap analysis
    let itineraryContext = '';
    if (tripContext?.itineraryItems && tripContext.itineraryItems.length > 0) {
        itineraryContext = `\n\nCurrent itinerary summary:`;
        tripContext.itineraryItems.forEach((item: any) => {
            itineraryContext += `\n- ${item.date} ${item.time || 'TBD'}: ${item.title}`;
        });
        itineraryContext += `\n\nConsider gaps in schedule and opportunities for nearby activities.`;
    }
    
    const prompt = `Based on this travel conversation and trip to ${tripContext?.destination || 'their destination'}, 
    suggest 3 helpful follow-up questions or topics the user might want to explore:

    Recent conversation: ${recentConversation}${itineraryContext}
    
    Provide exactly 3 short, actionable suggestions (max 8 words each)`;
}
```

#### **2. Structured Recommendations (`generateStructuredRecommendations`)**
```typescript
// Intelligent detection of recommendation requests
const isAskingForRecommendations = /\b(cafes?|restaurants?|hotels?|attractions?|places?|spots?)\b/i.test(latestMessage);

if (isAskingForRecommendations) {
    const prompt = `You are a travel assistant. The user is asking for recommendations...
    
    Respond with a JSON object in this EXACT format:
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
          "googleMapsQuery": "Place Name + ${tripContext?.destination}"
        }
      ],
      "responseText": "Here are some great recommendations for your trip!"
    }`;
    
    // Parse and validate JSON response
    try {
        const parsedResponse = JSON.parse(responseText);
        return parsedResponse.type === 'recommendations' ? parsedResponse : null;
    } catch (parseError) {
        return null; // Fall back to regular response
    }
}
```

### **🔄 React Hook Integration (`hooks/useAIChat.ts`)**

#### **1. State Management**
```typescript
interface UseAIChatReturn {
    // Data
    chat: AIChat | null;
    messages: AIMessage[];
    
    // State
    loading: boolean;
    error: string | null;
    
    // Actions
    sendMessage: (text: string) => Promise<void>;
    initializeChat: () => Promise<void>;
    
    // Smart features
    smartSuggestions: string[];
    structuredResponse: any;
}
```

#### **2. Trip Context Integration**
```typescript
const tripContext: TripContext | undefined = useMemo(() => {
    if (!trip) return undefined;
    
    // Include current itinerary items for AI context
    const formattedItineraryItems = itineraryItems.map(item => ({
        date: item.date,
        time: item.time,
        title: item.title,
        description: item.description,
        location: item.location,
        category: item.category
    }));

    return {
        tripName: trip.tripName,
        destination: trip.destination,
        startDate: trip.startDate,
        endDate: trip.endDate,
        companions: trip.companions,
        activities: trip.activities,
        itineraryItems: formattedItineraryItems // Enhanced context
    };
}, [trip, itineraryItems]);
```

#### **3. Message Processing Pipeline**
```typescript
const sendMessage = async (text: string) => {
    try {
        setLoading(true);
        
        // 1. Add user message to local state
        const userMessage = await aiChatService.addMessage(chat.id, {
            content: text,
            role: 'user'
        });
        
        // 2. Get AI response with full context
        const conversationContext = {
            tripDetails: {
                ...tripContext,
                currentItinerary: itineraryItems
            }
        };
        
        const aiResponse = await aitaApi.createChatCompletion([...messages, userMessage], conversationContext);
        
        // 3. Check for structured response
        const structuredData = await aitaApi.generateStructuredRecommendations([...messages, userMessage], tripContext);
        
        // 4. Generate smart suggestions
        const suggestions = await aitaApi.generateSmartSuggestions([...messages, userMessage], tripContext);
        
        // 5. Save AI response and update state
        const assistantMessage = await aiChatService.addMessage(chat.id, {
            content: aiResponse,
            role: 'assistant',
            structured_data: structuredData
        });
        
        setMessages(prev => [...prev, assistantMessage]);
        setSmartSuggestions(suggestions);
        setStructuredResponse(structuredData);
        
    } catch (error) {
        setError('Failed to send message');
    } finally {
        setLoading(false);
    }
};
```

### **🎨 UI Integration (`components/StructuredResponse.tsx`)**

Structured responses are rendered with rich UI components:

```typescript
export const StructuredResponse: React.FC<StructuredResponseProps> = ({ 
    data, 
    onAddToItinerary 
}) => {
    return (
        <View className="w-full">
            {/* Response text */}
            <Text className="text-primaryFont text-base mb-4">
                {data.responseText}
            </Text>
            
            {/* Recommendation cards */}
            <Text className="text-primaryFont font-semibold text-lg mb-3">
                {getCategoryEmoji(data.category)} {data.category.charAt(0).toUpperCase() + data.category.slice(1)}
            </Text>
            
            {data.items.map((item, index) => (
                <RecommendationCard
                    key={index}
                    recommendation={item}
                    onAddToItinerary={() => onAddToItinerary(item)}
                />
            ))}
        </View>
    );
};
```

### **💾 Database Integration (`lib/services/aiChatService.ts`)**

All AI conversations are persisted to Supabase:

```typescript
// Create chat for trip
async createChatForTrip(tripId: string): Promise<AIChat> {
    const chatData = {
        trip_id: tripId,
        title: `AI Assistant Chat`,
        is_active: true
    };
    
    const { data, error } = await supabase
        .from('ai_chats')
        .insert([chatData])
        .select()
        .single();
}

// Add message with structured data support
async addMessage(chatId: string, message: CreateAIMessageInput): Promise<AIMessage> {
    const messageData = {
        ai_chat_id: chatId,
        content: message.content,
        role: message.role,
        structured_data: message.structured_data, // Store JSON recommendations
        created_at: new Date().toISOString()
    };
    
    const { data, error } = await supabase
        .from('ai_messages')
        .insert([messageData])
        .select()
        .single();
}
```

### **🔧 Error Handling & Resilience**

```typescript
// API health check
async healthCheck(): Promise<boolean> {
    try {
        const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent("Hello");
        return !!result.response.text();
    } catch {
        return false;
    }
}

// Graceful fallbacks
try {
    const aiResponse = await aitaApi.createChatCompletion(messages, context);
} catch (error) {
    console.error('AI Error:', error);
    setError('AI service temporarily unavailable. Please try again.');
    // Could implement retry logic or fallback responses here
}
```

### **🚀 Performance Optimizations**

1. **Context Window Management**: Limits conversation history to last 20 messages
2. **Smart Caching**: Reuses conversation context within session
3. **Async Processing**: Non-blocking UI while AI processes
4. **Structured Response Detection**: Only processes JSON when needed
5. **Token Optimization**: Configures model parameters for optimal performance

This comprehensive AI integration makes AITA more than just a chatbot - it's a context-aware travel companion that learns from your trip details, understands your preferences, and provides increasingly personalized recommendations as you plan your journey.

---

## 🎯 **Key Components**

### **Authentication System**
- Secure user registration and login
- Profile management with customizable avatars
- Password reset and account recovery

### **AI Chat Interface**
- Real-time messaging with AI assistant
- Context-aware conversations
- Message history and search
- Rich media support (images, links, structured data)

### **Trip Management**
- Create and organize multiple trips
- Set destinations, dates, and travel preferences
- Collaborative trip planning
- Trip sharing capabilities

### **Smart Itinerary Builder**
- AI-generated itineraries based on preferences
- Drag-and-drop activity scheduling
- Real-time updates and modifications
- Integration with maps and location data

### **Travel Tools**
- Interactive travel checklist
- Weather forecasts
- Currency conversion
- Emergency contacts and information

---

## 📂 **Project Structure**

```
aita-ai/
├── app/                          # App screens and navigation
│   ├── (auth)/                   # Authentication screens
│   │   ├── sign-in.tsx
│   │   ├── sign-up.tsx
│   │   └── onboard.tsx
│   ├── (root)/                   # Main app screens
│   │   ├── chatAI.tsx           # AI chat interface
│   │   ├── settings.tsx         # User settings
│   │   ├── (tabs)/              # Tab navigation screens
│   │   └── trip/                # Trip management screens
│   └── _layout.tsx              # Root layout
├── components/                   # Reusable UI components
│   ├── DynamicItinerary.tsx     # Interactive itinerary
│   ├── MessageActions.tsx       # Chat message actions
│   ├── StructuredResponse.tsx   # AI response formatting
│   └── ...
├── hooks/                       # Custom React hooks
│   ├── useAIChat.ts            # AI chat functionality
│   ├── useNotifications.ts     # Push notifications
│   └── ...
├── lib/                         # Core services and utilities
│   ├── api.ts                  # Google Gemini AI integration
│   ├── supabase.ts             # Supabase client
│   └── services/               # Business logic services
├── supabase/                    # Database schemas and migrations
├── types/                       # TypeScript type definitions
└── constants/                   # App constants and configurations
```

---

## 🔧 **Configuration**

### **Supabase Setup**
1. Create a new Supabase project
2. Run the SQL migrations from the `supabase/` folder
3. Configure Row Level Security (RLS) policies
4. Set up authentication providers

### **Google Gemini API**
1. Get API key from Google AI Studio
2. Add to environment variables
3. Configure rate limits and quotas

### **Push Notifications**
1. Configure Expo push notification credentials
2. Set up notification channels
3. Implement background location permissions

---

## 🧪 **Testing**

```bash
# Run linting
npm run lint

# Run type checking
npx tsc --noEmit

# Test on different devices
expo start --tunnel
```

---

## 📱 **Deployment**

### **Development Build**
```bash
# Create development build
eas build --platform all --profile development

# Install on device
eas device:create
```

### **Production Build**
```bash
# Create production build
eas build --platform all --profile production

# Submit to app stores
eas submit --platform all
```

---

## 🤝 **Contributing**

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 **Acknowledgments**

- Google Gemini Pro for AI capabilities
- Supabase for backend infrastructure  
- Expo team for the amazing development platform
- React Native community for continuous innovation

---

## 📞 **Support**

For support, email support@aita-app.com or join our Discord community.

---

<p align="center">Made with ❤️ for travelers worldwide</p>

