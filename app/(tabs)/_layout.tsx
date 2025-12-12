// app/(tabs)/_layout.tsx

import React, { useState, useEffect } from 'react';
import { Tabs, usePathname } from 'expo-router';
import { Text, Image, View, ActivityIndicator } from 'react-native';
import {
  Ionicons,
  MaterialIcons,
  FontAwesome5,
  Feather,
} from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useProfileContext } from '../../context/ProfileContext';
import { useSocketContext } from '../../context/SocketContext';
import LocationPermissionScreen from '../(auth)/location-permission';

function MainTabsLayout() {
  const pathname = usePathname();
  const { hasUnread } = useSocketContext(); // 🔴 CHAT BADGE STATE

  return (
    <Tabs
      initialRouteName="home"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#ff7f00',
        tabBarStyle: {
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
          backgroundColor: '#fff',
        },
      }}
    >
      {/* ---------------- HOME ---------------- */}
      <Tabs.Screen
        name="home"
        options={{
          tabBarLabel: ({ color }) => (
            <Text style={{ color, fontSize: 10 }}>Home</Text>
          ),
          tabBarIcon: ({ focused }) => (
            <Image
              source={require('../../assets/images/Page0.png')}
              style={{
                width: 43,
                height: 43,
                marginBottom: -5,
                tintColor: focused ? '#ff7f00' : 'gray',
              }}
            />
          ),
        }}
      />

      {/* ---------------- EXPLORE ---------------- */}
      <Tabs.Screen
        name="explore"
        options={{
          tabBarLabel: ({ color }) => (
            <Text style={{ color, fontSize: 10 }}>Explore</Text>
          ),
          tabBarIcon: ({ color, size }) => (
            <Feather name="compass" size={size} color={color} />
          ),
        }}
      />

      {/* ---------------- LIKES ---------------- */}
      <Tabs.Screen
        name="likes"
        options={{
          tabBarLabel: ({ color }) => (
            <Text style={{ color, fontSize: 10 }}>Likes</Text>
          ),
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons
              name="favorite-border"
              size={size}
              color={color}
            />
          ),
        }}
      />

      {/* ---------------- CHAT (SA BADGE-OM) ---------------- */}
      <Tabs.Screen
        name="chat-stack"
        options={{
          tabBarLabel: ({ color }) => (
            <Text style={{ color, fontSize: 10 }}>Chat</Text>
          ),
          tabBarIcon: ({ color, size }) => (
            <View style={{ position: 'relative' }}>
              <Ionicons
                name="chatbubble-outline"
                size={size}
                color={color}
              />

              {/* 🔴 CRVENA TAČKICA */}
              {hasUnread && (
                <View
                  style={{
                    position: 'absolute',
                    top: -4,
                    right: -4,
                    width: 10,
                    height: 10,
                    borderRadius: 5,
                    backgroundColor: 'red',
                  }}
                />
              )}
            </View>
          ),
          tabBarStyle: {
            display: pathname.includes('/chat-stack/') ? 'none' : 'flex',
          },
        }}
      />

      {/* ---------------- PROFILE ---------------- */}
      <Tabs.Screen
        name="profile"
        options={{
          tabBarLabel: ({ color }) => (
            <Text style={{ color, fontSize: 10 }}>Profile</Text>
          ),
          tabBarIcon: ({ color, size }) => (
            <FontAwesome5 name="user-circle" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

export default function TabsGroupGateLayout() {
  const { profile, isLoading: isProfileLoading } = useProfileContext();
  const [locationPromptCompleted, setLocationPromptCompleted] =
    useState<boolean | null>(null);

  useEffect(() => {
    const checkStorage = async () => {
      const value = await AsyncStorage.getItem(
        'location_prompt_completed'
      );
      setLocationPromptCompleted(value === 'true');
    };
    checkStorage();
  }, []);

  // ⏳ LOADING
  if (isProfileLoading || !profile || locationPromptCompleted === null) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#ffffff',
        }}
      >
        <Image
          source={require('../../assets/images/1000006401.png')}
          style={{ width: 200, height: 200 }}
          resizeMode="contain"
        />
        <ActivityIndicator
          size="small"
          color="#555"
          style={{ marginTop: 20 }}
        />
      </View>
    );
  }

  // 📍 LOCATION PERMISSION
  if (!locationPromptCompleted) {
    return (
      <LocationPermissionScreen
        onComplete={() => setLocationPromptCompleted(true)}
      />
    );
  }

  return <MainTabsLayout />;
}
