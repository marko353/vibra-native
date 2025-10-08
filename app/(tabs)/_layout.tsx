import React from 'react';
import { Tabs } from 'expo-router';
import { Text, Image, View, ActivityIndicator } from 'react-native';
import { Ionicons, MaterialIcons, FontAwesome5, Feather } from '@expo/vector-icons';
import { useProfileContext } from '../../context/ProfileContext';
import LocationPermissionScreen from '../(auth)/location-permission'; 

function MainTabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#ff7f00',
        tabBarStyle: { borderTopWidth: 0, elevation: 0, shadowOpacity: 0, backgroundColor: '#fff' },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          tabBarLabel: ({ color }) => <Text style={{ color, fontSize: 10 }}>Home</Text>,
          tabBarIcon: ({ focused }) => (
            <Image
              source={require('../../assets/images/Page0.png')}
              style={{ width: 43, height: 43, marginBottom: -5, tintColor: focused ? '#ff7f00' : 'gray' }}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          tabBarLabel: ({ color }) => <Text style={{ color, fontSize: 10 }}>Explore</Text>,
          tabBarIcon: ({ color, size }) => <Feather name="compass" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="likes"
        options={{
          tabBarLabel: ({ color }) => <Text style={{ color, fontSize: 10 }}>Likes</Text>,
          tabBarIcon: ({ color, size }) => <MaterialIcons name="favorite-border" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          tabBarLabel: ({ color }) => <Text style={{ color, fontSize: 10 }}>Chat</Text>,
          tabBarIcon: ({ color, size }) => <Ionicons name="chatbubble-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarLabel: ({ color }) => <Text style={{ color, fontSize: 10 }}>Profile</Text>,
          tabBarIcon: ({ color, size }) => <FontAwesome5 name="user-circle" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}

export default function TabsGroupGateLayout() {
  const { profile, isLoading: isProfileLoading } = useProfileContext();

  if (isProfileLoading || !profile) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#ffffff' }}>
        <Image
          source={require('../../assets/images/1000006401.png')}
          style={{ width: 200, height: 200 }}
          resizeMode="contain"
        />
        <ActivityIndicator size="small" color="#555" style={{ marginTop: 20 }}/>
      </View>
    );
  }

  if (!profile.hasCompletedLocationPrompt) {
    return <LocationPermissionScreen />;
  }

  return <MainTabsLayout />;
}
