import { Tabs, Link } from 'expo-router';
import { Text, Pressable } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E5E5EA',
        },
        headerStyle: {
          backgroundColor: '#FFFFFF',
        },
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Portfolio',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>💼</Text>,
          headerTitle: 'My Portfolio',
          headerRight: () => (
            <Link href="/transactions" asChild>
              <Pressable style={{ marginRight: 16 }}>
                <Text style={{ fontSize: 18 }}>🧾</Text>
              </Pressable>
            </Link>
          ),
        }}
      />
      <Tabs.Screen
        name="analysis"
        options={{
          title: 'Analysis',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>📊</Text>,
          headerTitle: 'Portfolio Analysis',
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>🔍</Text>,
          headerTitle: 'Search Stocks',
        }}
      />
    </Tabs>
  );
}