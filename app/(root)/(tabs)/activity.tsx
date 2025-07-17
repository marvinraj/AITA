import React, { useState } from 'react';
import { Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';

interface ActivityItem {
  id: string;
  type: 'follow' | 'like' | 'comment' | 'share' | 'trip_invite';
  user: {
    name: string;
    username: string;
    avatar: string;
  };
  action: string;
  target: string;
  timestamp: string;
  image?: string;
}

const ActivityScreen = () => {
  // Mock activity data
  const activities: ActivityItem[] = [
    {
      id: '1',
      type: 'follow',
      user: {
        name: 'Erin Zapisocki',
        username: 'erin',
        avatar: 'https://i.pravatar.cc/100?img=1'
      },
      action: 'made a cluster called',
      target: 'kisses',
      timestamp: '22d',
      image: 'https://images.unsplash.com/photo-1551963831-b3b1ca40c98e?w=80&h=80&fit=crop'
    },
    {
      id: '2',
      type: 'follow',
      user: {
        name: 'Emily Peilan',
        username: 'emilyaroha',
        avatar: 'https://i.pravatar.cc/100?img=2'
      },
      action: 'made a cluster called',
      target: 'Chaos & Order',
      timestamp: '30d',
      image: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=80&h=80&fit=crop'
    },
    {
      id: '3',
      type: 'follow',
      user: {
        name: 'Erin Zapisocki',
        username: 'erin',
        avatar: 'https://i.pravatar.cc/100?img=1'
      },
      action: 'made a cluster called',
      target: 'ascend',
      timestamp: '53d',
      image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=80&h=80&fit=crop'
    },
    {
      id: '4',
      type: 'follow',
      user: {
        name: 'Emily Peilan',
        username: 'emilyaroha',
        avatar: 'https://i.pravatar.cc/100?img=2'
      },
      action: 'made a cluster called',
      target: 'Marissa',
      timestamp: '57d',
      image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=80&h=80&fit=crop'
    },
    {
      id: '5',
      type: 'follow',
      user: {
        name: 'Erin Zapisocki',
        username: 'erin',
        avatar: 'https://i.pravatar.cc/100?img=1'
      },
      action: 'made a cluster called',
      target: 'capital',
      timestamp: '58d',
      image: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=80&h=80&fit=crop'
    },
    {
      id: '6',
      type: 'follow',
      user: {
        name: 'Erin Zapisocki',
        username: 'erin',
        avatar: 'https://i.pravatar.cc/100?img=1'
      },
      action: 'made a cluster called',
      target: 'beatles',
      timestamp: '58d',
      image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=80&h=80&fit=crop'
    },
    {
      id: '7',
      type: 'follow',
      user: {
        name: 'Emily Peilan',
        username: 'emilyaroha',
        avatar: 'https://i.pravatar.cc/100?img=2'
      },
      action: 'made a cluster called',
      target: 'AG Sactuary',
      timestamp: '63d',
      image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=80&h=80&fit=crop'
    }
  ];

  const renderActivityItem = (item: ActivityItem) => {
    const [avatarError, setAvatarError] = useState(false);
    
    return (
      <TouchableOpacity 
        key={item.id}
        className="flex-row items-start px-5 py-4 border-b border-secondaryBG/10"
        activeOpacity={0.7}
      >
        {/* User Avatar */}
        {!avatarError ? (
          <Image
            source={{ uri: item.user.avatar }}
            className="w-12 h-12 rounded-full mr-3"
            onError={() => setAvatarError(true)}
          />
        ) : (
          <View className="w-12 h-12 rounded-full mr-3 bg-secondaryBG items-center justify-center">
            <Text className="text-primaryFont font-UrbanistSemiBold text-lg">
              {item.user.name.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        
        {/* Activity Content */}
        <View className="flex-1 mr-3">
          <View className="mb-1">
            <Text className="text-secondaryFont text-xs font-UrbanistRegular">
              You follow 1 of {item.user.name}'s clusters
            </Text>
          </View>
          
          <View className="flex-row items-center flex-wrap">
            <Text className="text-primaryFont font-UrbanistSemiBold text-base">
              {item.user.username}{' '}
            </Text>
            <Text className="text-primaryFont/80 font-UrbanistRegular text-base">
              {item.action}{' '}
            </Text>
            <Text className="text-primaryFont font-UrbanistSemiBold text-base">
              {item.target}
            </Text>
            <Text className="text-secondaryFont font-UrbanistRegular text-sm ml-1">
              • {item.timestamp}
            </Text>
          </View>
        </View>
        
        {/* Activity Image */}
        {item.image && (
          <Image
            source={{ uri: item.image }}
            className="w-12 h-12 rounded-lg flex-shrink-0"
          />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View className="flex-1 bg-primaryBG">
      {/* Header */}
      <View className="px-5 pt-16 pb-6 border-b border-secondaryBG/10">
        <Text className="text-primaryFont text-2xl font-UrbanistSemiBold text-center">
          Activity
        </Text>
      </View>

      {/* Activity Feed */}
      <ScrollView 
        className="flex-1"
        showsVerticalScrollIndicator={false}
      >
        {activities.map(renderActivityItem)}
      </ScrollView>
    </View>
  )
}

export default ActivityScreen