import { useState } from 'react';
import { Text, View } from 'react-native';
import BudgetTab from './BudgetTab';
import ItineraryTab from './ItineraryTab';
import SavesTab from './SavesTab';
import LiveTripHeader from './LiveTripHeader';
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
      {/* main header component */}
      <LiveTripHeader
        tripName="Europe Trip"
        date="June 10 - June 20, 2025"
        weather="Sunny, 25°C"
        location="Paris, France"
      />
      {/* live trip tabs */}
      <View className="flex-row items-end border-b border-[#222] mb-2 mt-2">
        {TABS.map(tab => {
          const isActive = activeTab === tab.key;
          return (
            <View key={tab.key} style={{ position: 'relative', marginRight: 24, paddingBottom: 4, alignItems: 'center' }}>
              <Text
                className={
                  isActive
                    ? 'text-white font-InterRegular text-base'
                    : 'text-secondaryFont font-InterRegular text-base'
                }
                onPress={() => setActiveTab(tab.key)}
              >
                {tab.key}
              </Text>
              {isActive && (
                <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 2, backgroundColor: '#ffffff', borderRadius: 2 }} />
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
