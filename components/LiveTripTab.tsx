import { useState } from 'react';
import { Text, View } from 'react-native';
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
  
  // determine the active component based on the active tab
  const ActiveComponent = TABS.find(tab => tab.key === activeTab)?.component || TravelHubTab;

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
        <LiveTripHeader
          tripName="Europe Trip"
          date="June 10 - June 20, 2025"
          weather="Sunny, 25°C"
          location="Paris, France"
        />
      </View>
      {/* live trip tabs */}
      <View className="flex-row items-end  border-border mb-2">
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
      <ActiveComponent />
    </View>
  );
}
