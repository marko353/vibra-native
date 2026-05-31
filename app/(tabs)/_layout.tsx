import React, { useState, useEffect } from 'react';
import { Tabs, usePathname } from 'expo-router';
import { Text, Image, View, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import {
  Ionicons,
  MaterialIcons,
  FontAwesome5,
  Feather,
} from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useQuery } from '@tanstack/react-query';
import { useProfileContext } from '../../context/ProfileContext';
import { useSocketContext } from '../../context/SocketContext';
import { useAuthContext } from '../../context/AuthContext';
import LocationPermissionScreen from '../(auth)/location-permission';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;
const ORANGE = '#FF6A00';
const INACTIVE = '#1C1C1E';

function MainTabsLayout() {
  const pathname = usePathname();
  const { user } = useAuthContext();
  const userKey = user?.id || 'me';

  const { data: likes = [] } = useQuery({
    queryKey: ['incoming-likes', userKey],
    enabled: !!user?.token,
    queryFn: async () => {
      const res = await axios.get(`${API_BASE_URL}/api/user/incoming-likes`, {
        headers: { Authorization: `Bearer ${user?.token}` },
      });
      return res.data?.likes || res.data || [];
    },
  });

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['unread-messages-count', userKey],
    enabled: !!user?.token,
    queryFn: async () => {
      const res = await axios.get(`${API_BASE_URL}/api/chats/unread-count`, {
        headers: { Authorization: `Bearer ${user?.token}` },
      });
      return res.data?.count || res.data?.unreadCount || 0;
    },
  });

  const { data: chatData } = useQuery({
    queryKey: ['my-matches', userKey],
    enabled: !!user?.token,
    queryFn: async () => {
      const res = await axios.get(`${API_BASE_URL}/api/user/my-matches`, {
        headers: { Authorization: `Bearer ${user?.token}` },
      });
      return res.data || { newMatches: [], conversations: [] };
    },
  });

  const unreadMatchCount = (chatData?.newMatches || []).filter((m: any) => m?.has_unread).length;
  const unreadConversationCount = (chatData?.conversations || []).filter((c: any) => c?.has_unread).length;
  const chatBadgeCount = Math.max(Number(unreadCount) || 0, unreadMatchCount + unreadConversationCount);

  return (
    <Tabs
      initialRouteName="home"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: ORANGE,
        tabBarInactiveTintColor: INACTIVE,
        tabBarStyle: {
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: '#E5E5EA',
          elevation: 0,
          shadowOpacity: 0,
          backgroundColor: '#FFFFFF',
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
        },
      }}
    >
      {/* HOME */}
      <Tabs.Screen
        name="home"
        options={{
          tabBarLabel: ({ color }) => (
            <Text style={{ color, fontSize: 10, fontWeight: '600' }}>Home</Text>
          ),
          tabBarIcon: ({ focused }) => (
            <Image
              source={require('../../assets/images/Page0.png')}
              style={{
                width: 43,
                height: 43,
                marginBottom: -5,
                tintColor: focused ? ORANGE : INACTIVE,
              }}
            />
          ),
        }}
      />

      {/* EXPLORE */}
      <Tabs.Screen
        name="explore"
        options={{
          tabBarLabel: ({ color }) => (
            <Text style={{ color, fontSize: 10, fontWeight: '600' }}>Explore</Text>
          ),
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name={focused ? 'compass' : 'compass-outline'}
              size={28}
              color={focused ? ORANGE : INACTIVE}
            />
          ),
        }}
      />

      {/* LIKES */}
      <Tabs.Screen
        name="likes"
        options={{
          tabBarLabel: ({ color }) => (
            <Text style={{ color, fontSize: 10, fontWeight: '600' }}>Likes</Text>
          ),
          tabBarIcon: ({ focused }) => (
            <View>
              <Ionicons
                name={focused ? 'heart' : 'heart-outline'}
                size={27}
                color={focused ? ORANGE : INACTIVE}
              />
              {likes.length > 0 && <View style={styles.badgeDot} />}
            </View>
          ),
        }}
      />

      {/* CHAT */}
      <Tabs.Screen
        name="chat-stack"
        options={{
          tabBarLabel: ({ color }) => (
            <Text style={{ color, fontSize: 10, fontWeight: '600' }}>Chat</Text>
          ),
          tabBarIcon: ({ focused }) => (
            <View>
              <Ionicons
                name={focused ? 'chatbubble' : 'chatbubble-outline'}
                size={26}
                color={focused ? ORANGE : INACTIVE}
              />
              {chatBadgeCount > 0 && <View style={styles.badgeDot} />}
            </View>
          ),
          tabBarStyle: {
            display: pathname.includes('/chat-stack/') ? 'none' : 'flex',
            borderTopWidth: StyleSheet.hairlineWidth,
            borderTopColor: '#E5E5EA',
            elevation: 0,
            shadowOpacity: 0,
            backgroundColor: '#FFFFFF',
          },
        }}
      />

      {/* PROFILE */}
      <Tabs.Screen
        name="profile"
        options={{
          tabBarLabel: ({ color }) => (
            <Text style={{ color, fontSize: 10, fontWeight: '600' }}>Profile</Text>
          ),
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name={focused ? 'person-circle' : 'person-circle-outline'}
              size={28}
              color={focused ? ORANGE : INACTIVE}
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  badgeDot: {
    position: 'absolute',
    top: -1,
    right: -3,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: ORANGE,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
});

export default function TabsGroupGateLayout() {
  const { profile, isLoading: isProfileLoading } = useProfileContext();
  const [locationPromptCompleted, setLocationPromptCompleted] = useState<boolean | null>(null);

  useEffect(() => {
    const checkStorage = async () => {
      const value = await AsyncStorage.getItem('location_prompt_completed');
      setLocationPromptCompleted(value === 'true');
    };
    checkStorage();
  }, []);

  if (isProfileLoading || !profile || locationPromptCompleted === null) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FCFCFD' }}>
        <Image
          source={require('../../assets/images/1000006401.png')}
          style={{ width: 160, height: 160 }}
          resizeMode="contain"
        />
        <ActivityIndicator size="small" color={ORANGE} style={{ marginTop: 20 }} />
      </View>
    );
  }

  if (!locationPromptCompleted) {
    return <LocationPermissionScreen onComplete={() => setLocationPromptCompleted(true)} />;
  }

  return <MainTabsLayout />;
}