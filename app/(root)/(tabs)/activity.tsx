import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { FlatList, Modal, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useNotifications } from '../../../hooks/useNotifications';
import { SmartNotification } from '../../../lib/services/notificationService';

const ActivityScreen = () => {
  const { notifications, unreadCount, isLoading, loadNotifications, markAsRead, markAllAsRead } = useNotifications();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTripFilter, setSelectedTripFilter] = useState<string | null>(null);
  const [showFilterModal, setShowFilterModal] = useState(false);

  // Get unique trips from notifications
  const availableTrips = useMemo(() => {
    const tripMap = new Map<string, { id: string; name: string }>();
    
    notifications.forEach(notification => {
      if (notification.tripId && notification.data?.tripName) {
        tripMap.set(notification.tripId, {
          id: notification.tripId,
          name: notification.data.tripName
        });
      }
    });
    
    // Debug: Log available trips for troubleshooting
    console.log('📊 Available trips for filter:', Array.from(tripMap.values()));
    console.log('📊 All notifications with trip data:', 
      notifications.filter(n => n.tripId).map(n => ({
        id: n.id,
        tripId: n.tripId,
        tripName: n.data?.tripName,
        title: n.title
      }))
    );
    
    return Array.from(tripMap.values());
  }, [notifications]);

  // Filter notifications based on selected trip
  const filteredNotifications = useMemo(() => {
    if (!selectedTripFilter) return notifications;
    return notifications.filter(notification => notification.tripId === selectedTripFilter);
  }, [notifications, selectedTripFilter]);

  // Get the name of the currently selected trip
  const selectedTripName = useMemo(() => {
    if (!selectedTripFilter) return null;
    const trip = availableTrips.find(trip => trip.id === selectedTripFilter);
    return trip?.name || null;
  }, [selectedTripFilter, availableTrips]);

  // handle pull to refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  // format timestamp to relative time
  const formatTimeAgo = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (minutes < 1) return 'now';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    return `${days}d`;
  };

  // get notification icon based on type
  const getNotificationIcon = (type: SmartNotification['type']): string => {
    switch (type) {
      case 'trip_reminder': return 'calendar-outline';
      case 'location_arrival': return 'location-outline';
      case 'weather_alert': return 'cloudy-outline';
      case 'activity_suggestion': return 'bulb-outline';
      default: return 'notifications-outline';
    }
  };

  // get notification color based on type and priority
  const getNotificationColor = (type: SmartNotification['type'], priority: SmartNotification['priority']): string => {
    if (priority === 'high') return '#F7374F';
    
    switch (type) {
      case 'trip_reminder': return '#4B70F5';
      case 'location_arrival': return '#22C55E';
      case 'weather_alert': return '#F59E0B';
      case 'activity_suggestion': return '#8B5CF6';
      default: return '#6B7280';
    }
  };

  const renderNotificationItem = (notification: SmartNotification) => {
    return (
      <TouchableOpacity 
        key={notification.id}
        className={`flex-row items-start px-5 py-4 border-b border-secondaryBG/10 ${!notification.read ? 'bg-secondaryBG/10' : ''}`}
        activeOpacity={0.7}
        onPress={() => markAsRead(notification.id)}
      >
        {/* notification icon */}
        <View 
          className="w-12 h-12 rounded-full mr-3 items-center justify-center"
          style={{ backgroundColor: getNotificationColor(notification.type, notification.priority) + '20' }}
        >
          <Ionicons 
            name={getNotificationIcon(notification.type) as any}
            size={20} 
            color={getNotificationColor(notification.type, notification.priority)} 
          />
        </View>
        
        {/* notification content */}
        <View className="flex-1 mr-3">
          <View className="flex-row items-center justify-between mb-1">
            <Text className="text-primaryFont font-UrbanistSemiBold text-base">
              {notification.title}
            </Text>
            {!notification.read && (
              <View className="w-2 h-2 rounded-full bg-[#F7374F]" />
            )}
          </View>
          
          <Text className="text-primaryFont/80 font-UrbanistRegular text-sm mb-2">
            {notification.body}
          </Text>
          
          <View className="flex-row items-center">
            <Text className="text-secondaryFont font-UrbanistRegular text-xs">
              {formatTimeAgo(notification.timestamp)}
            </Text>
            {notification.priority === 'high' && (
              <View className="ml-2 px-2 py-1 bg-[#F7374F]/20 rounded-md">
                <Text className="text-[#F7374F] font-UrbanistSemiBold text-xs">High Priority</Text>
              </View>
            )}
          </View>
        </View>
        
        {/* trip/location indicator */}
        {notification.tripId && (
          <View className="w-8 h-8 rounded-full bg-primaryFont/10 items-center justify-center">
            <Ionicons name="airplane-outline" size={14} color="#6B7280" />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  // Render filter modal
  const renderFilterModal = () => (
    <Modal
      visible={showFilterModal}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowFilterModal(false)}
    >
      <View className="flex-1 bg-black/50 justify-center items-center px-4">
        <View className="bg-primaryBG rounded-2xl w-full max-w-sm p-6">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-primaryFont text-xl font-UrbanistSemiBold">
              Filter by Trip
            </Text>
            <TouchableOpacity
              onPress={() => setShowFilterModal(false)}
              className="w-8 h-8 items-center justify-center"
            >
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <FlatList
            data={[
              { id: null, name: 'All Notifications' },
              ...availableTrips
            ]}
            keyExtractor={(item) => item.id || 'all'}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => {
                  setSelectedTripFilter(item.id);
                  setShowFilterModal(false);
                }}
                className={`flex-row items-center justify-between py-3 px-4 rounded-lg mb-2 ${
                  selectedTripFilter === item.id ? 'bg-blue-500/20' : 'bg-secondaryBG/20'
                }`}
              >
                <View className="flex-row items-center flex-1">
                  <Ionicons 
                    name={item.id ? "airplane-outline" : "list-outline"} 
                    size={20} 
                    color={selectedTripFilter === item.id ? "#4B70F5" : "#6B7280"} 
                  />
                  <Text className={`ml-3 font-UrbanistRegular text-base ${
                    selectedTripFilter === item.id ? 'text-blue-500' : 'text-primaryFont'
                  }`}>
                    {item.name}
                  </Text>
                </View>
                {selectedTripFilter === item.id && (
                  <Ionicons name="checkmark" size={20} color="#4B70F5" />
                )}
              </TouchableOpacity>
            )}
            showsVerticalScrollIndicator={false}
            style={{ maxHeight: 300 }}
          />
        </View>
      </View>
    </Modal>
  );

  return (
    <View className="flex-1 bg-primaryBG">
      {/* header */}
      <View className="px-5 pt-16 pb-6 border-b border-secondaryBG/10">
        <View className="flex-row items-center justify-between">
          <Text className="text-primaryFont text-2xl font-BellezaRegular">
            Activity
          </Text>
          
          <View className="flex-row items-center space-x-2">
            {/* Filter button */}
            <TouchableOpacity
              onPress={() => setShowFilterModal(true)}
              className="px-3 py-1 bg-secondaryBG rounded-lg mr-2"
              activeOpacity={0.7}
            >
              <View className="flex-row items-center">
                <Ionicons 
                  name="filter-outline" 
                  size={16} 
                  color={selectedTripFilter ? "#4B70F5" : "#6B7280"} 
                />
                <Text className={`ml-1 font-UrbanistSemiBold text-sm ${
                  selectedTripFilter ? 'text-blue-500' : 'text-primaryFont'
                }`}>
                  Filter
                </Text>
              </View>
            </TouchableOpacity>

            {/* Mark all as read button */}
            {unreadCount > 0 && (
              <TouchableOpacity
                onPress={markAllAsRead}
                className="px-3 py-1 bg-secondaryBG rounded-lg"
                activeOpacity={0.7}
              >
                <Text className="text-primaryFont font-UrbanistSemiBold text-sm">
                  Mark all read
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
        
        {/* Current filter display */}
        {selectedTripName && (
          <View className="flex-row items-center mt-3">
            <Text className="text-secondaryFont font-UrbanistRegular text-sm">
              Showing notifications for: 
            </Text>
            <View className="ml-2 px-2 py-1 bg-blue-500/20 rounded-md flex-row items-center">
              <Ionicons name="airplane-outline" size={12} color="#4B70F5" />
              <Text className="text-blue-500 font-UrbanistSemiBold text-sm ml-1">
                {selectedTripName}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setSelectedTripFilter(null)}
              className="ml-2 p-1"
            >
              <Ionicons name="close-circle" size={16} color="#6B7280" />
            </TouchableOpacity>
          </View>
        )}
        
        {/* unread count */}
        {unreadCount > 0 && (
          <Text className="text-secondaryFont font-UrbanistRegular text-sm mt-2">
            {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
          </Text>
        )}
      </View>

      {/* notifications feed */}
      <ScrollView 
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#6B7280"
          />
        }
      >
        {isLoading && notifications.length === 0 ? (
          // loading state
          <View className="flex-1 items-center justify-center py-20">
            <Ionicons name="notifications-outline" size={48} color="#6B7280" />
            <Text className="text-secondaryFont font-UrbanistRegular text-lg mt-4">
              Loading notifications...
            </Text>
          </View>
        ) : filteredNotifications.length === 0 ? (
          // empty state
          <View className="flex-1 items-center justify-center py-20">
            <Ionicons name="notifications-outline" size={48} color="#6B7280" />
            <Text className="text-secondaryFont font-UrbanistSemiBold text-lg mt-4">
              {selectedTripFilter ? 'No notifications for this trip' : 'No notifications yet'}
            </Text>
            <Text className="text-secondaryFont/60 font-UrbanistRegular text-sm mt-2 text-center px-8">
              {selectedTripFilter 
                ? 'Try selecting a different trip or clear the filter to see all notifications'
                : 'You\'ll see trip reminders, location alerts, and travel suggestions here'
              }
            </Text>
          </View>
        ) : (
          // notifications list (filtered notifications)
          filteredNotifications.map(renderNotificationItem)
        )}
      </ScrollView>

      {/* Filter Modal */}
      {renderFilterModal()}
    </View>
  )
}

export default ActivityScreen