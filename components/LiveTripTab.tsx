import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { tripsService } from '../lib/services/tripsService';
import { Trip } from '../types/database';
import ItineraryTab from './ItineraryTab';
import LiveTripHeader from './LiveTripHeader';
import SavesTab from './SavesTab';
import TravelHubTab from './TravelHubTab';

// tabs for live trip
const TABS = [
  { key: 'Travel Hub', component: TravelHubTab },
  { key: 'Itinerary', component: ItineraryTab },
  { key: 'Saves', component: SavesTab },
  // { key: 'Budget', component: BudgetTab },
];

export default function LiveTripTab() {
  // state to manage active tab
  const [activeTab, setActiveTab] = useState('Travel Hub');
  // trip state
  const [currentTrip, setCurrentTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);

  // Load current trip on component mount
  useEffect(() => {
    loadCurrentTrip();
  }, []);

  const loadCurrentTrip = async () => {
    try {
      setLoading(true);
      
      // Try to get the most recent trip
      const trip = await tripsService.getCurrentTrip();
      
      if (!trip) {
        // No trips found, create a default one
        const defaultTrip = await tripsService.createTrip({
          name: 'My Travel Plans',
          destination: 'Planning your next adventure',
          status: 'planning'
        });
        setCurrentTrip(defaultTrip);
      } else {
        setCurrentTrip(trip);
      }
    } catch (err) {
      console.error('Error loading current trip:', err);
      // Create a fallback trip if all else fails
      setCurrentTrip({
        id: 'fallback',
        user_id: 'fallback',
        name: 'My Travel Plans',
        destination: 'Planning your next adventure',
        status: 'planning',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  };
  
  // determine the active component based on the active tab
  const ActiveComponent = TABS.find(tab => tab.key === activeTab)?.component || TravelHubTab;

  // Show loading state while trip is being loaded
  if (loading || !currentTrip) {
    return (
      <View className="flex-1 bg-primaryBG justify-center items-center">
        <Text className="text-secondaryFont">Loading your trip...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-primaryBG">
      {/* main header component with white shadow */}
      <View style={{
        shadowColor: '#ffffff',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 15,
        elevation: 5,
      }}>
        <LiveTripHeader trip={currentTrip} />
      </View>
      {/* live trip tabs */}
      <View className="flex-row items-end  border-border mb-2 mt-3">
        {TABS.map(tab => {
          const isActive = activeTab === tab.key;
          return (
            <View key={tab.key} style={{ position: 'relative', marginRight: 24, paddingBottom: 4, alignItems: 'center' }}>
              <Text
                className={
                  isActive
                    ? 'text-[#f48080] font-UrbanistSemiBold text-base'
                    : 'text-secondaryFont font-UrbanistSemiBold text-base'
                }
                onPress={() => setActiveTab(tab.key)}
              >
                {tab.key}
              </Text>
              {isActive && (
                <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 2, backgroundColor: '#f48080', borderRadius: 2 }} />
              )}
            </View>
          );
        })}
      </View>
      {/* Active Tab Content */}
      <ActiveComponent trip={currentTrip} />
    </View>
  );
}
