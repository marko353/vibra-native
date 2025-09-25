import { Tabs } from 'expo-router';
import { Ionicons, MaterialIcons, FontAwesome5, Feather } from '@expo/vector-icons';
import { Image, Text } from 'react-native';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        // Stil za pozadinu ekrana (ispravan prop)
        sceneStyle: {
          backgroundColor: '#fff',
        },

        // Sakriva header ali i stilizuje njegov kontejner da nema ivicu
        headerShown: false,
        headerStyle: {
          borderBottomWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
        },

        // Stilovi za sam tab bar
        tabBarActiveTintColor: '#ff7f00',
        tabBarStyle: {
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
          shadowOffset: { height: 0, width: 0 },
          shadowRadius: 0,
          backgroundColor: '#fff',
        },
      }}
    >
      {/* Vaši ekrani ostaju nepromenjeni */}
      <Tabs.Screen
        name="home"
        options={{
          tabBarLabel: ({ color }) => <Text style={{ color, fontSize: 10 }}>Home</Text>,
          tabBarIcon: ({ color, size, focused }) => (
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
          tabBarIcon: ({ color, size }) => (
            <Feather name="compass" size={size} color={color} />
          ),
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