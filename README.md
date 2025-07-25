# TRAVA - AI-Powered Travel Assistant

A comprehensive AI-powered travel planning and assistance mobile application built with React Native, Expo, and powered by Google Gemini Pro AI.

## About This Project

TRAVA (AI-Powered Travel Assistant) is a smart travel companion that helps users plan, organize, and manage their trips with the power of artificial intelligence. The app provides personalized travel recommendations, intelligent itinerary planning, real-time place discovery, and contextual travel advice tailored to each user's specific trip details and preferences.

### Key Features:
- **AI-Powered Travel Assistant**: Chat with an intelligent travel expert that understands your trip context
- **Smart Trip Planning**: Create and manage detailed itineraries with AI assistance
- **Place Discovery**: Find and save places with Google Places integration
- **Real-time Notifications**: Stay updated with trip reminders and travel alerts
- **Cross-platform**: Built with React Native for both iOS and Android


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

<!-- <p align="center">Made with ❤️ for travelers worldwide</p> -->

