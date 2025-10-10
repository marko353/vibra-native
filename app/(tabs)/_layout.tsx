import React, { useState, useEffect } from 'react';
import { Tabs } from 'expo-router';
import { Text, Image, View, ActivityIndicator } from 'react-native';
import { Ionicons, MaterialIcons, FontAwesome5, Feather } from '@expo/vector-icons';
import { useProfileContext } from '../../context/ProfileContext';
import LocationPermissionScreen from '../(auth)/location-permission';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Komponenta koja definiše izgled i redosled tabova
function MainTabsLayout() {
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
      <Tabs.Screen
        name="home"
        options={{
          tabBarLabel: ({ color }) => <Text style={{ color, fontSize: 10 }}>Home</Text>,
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
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="favorite-border" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          tabBarLabel: ({ color }) => <Text style={{ color, fontSize: 10 }}>Chat</Text>,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubble-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarLabel: ({ color }) => <Text style={{ color, fontSize: 10 }}>Profile</Text>,
          tabBarIcon: ({ color, size }) => (
            <FontAwesome5 name="user-circle" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

// Čuvar koji odlučuje šta će se prikazati
export default function TabsGroupGateLayout() {
  const { profile, isLoading: isProfileLoading } = useProfileContext();

  // Stanje koje prati da li je korisnik prošao prompt na ovom uređaju
  const [locationPromptCompleted, setLocationPromptCompleted] = useState<boolean | null>(null);

  // Efekat za proveru AsyncStorage-a pri učitavanju
  useEffect(() => {
    const checkStorage = async () => {
      const value = await AsyncStorage.getItem('location_prompt_completed');
      setLocationPromptCompleted(value === 'true');
    };
    checkStorage();
  }, []);

  // 1. Prikazujemo splash dok se učitava profil ILI dok ne proverimo AsyncStorage
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
        <ActivityIndicator size="small" color="#555" style={{ marginTop: 20 }} />
      </View>
    );
  }

  // 2. Ako AsyncStorage kaže da prompt NIJE završen, prikazujemo LocationPermissionScreen
  if (!locationPromptCompleted) {
    return <LocationPermissionScreen onComplete={() => setLocationPromptCompleted(true)} />;
  }

  // 3. Ako je sve u redu, prikazujemo glavne tabove
  return <MainTabsLayout />;
}
