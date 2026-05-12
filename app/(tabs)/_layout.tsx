import { Tabs, Link } from 'expo-router';
import { Text, Pressable, View } from 'react-native';
import { useAuth } from '@clerk/clerk-expo';
import { useEffect } from 'react';
import { usePortfolioStore } from '../../lib/store/portfolio';

export default function TabLayout() {
  const { userId, signOut } = useAuth();
  const setUserId = usePortfolioStore((state) => state.setUserId);

  useEffect(() => {
    if (userId) {
      setUserId(userId);
    }
  }, [userId]);

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
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Link href="/transactions" asChild>
                <Pressable style={{ marginRight: 16 }}>
                  <Text style={{ fontSize: 18 }}>🧾</Text>
                </Pressable>
              </Link>
              <Pressable style={{ marginRight: 16 }} onPress={() => signOut()}>
                <Text style={{ fontSize: 14, color: '#FF3B30', fontWeight: '600' }}>Logout</Text>
              </Pressable>
            </View>
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
        name="optimizer"
        options={{
          title: 'Optimizer',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>🧮</Text>,
          headerTitle: 'Portfolio Optimizer',
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