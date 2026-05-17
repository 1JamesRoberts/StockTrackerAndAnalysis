import { Tabs, Link } from 'expo-router';
import { Drawer } from 'expo-router/drawer';
import { Text, Pressable, View, Platform } from 'react-native';
import { useAuth } from '@clerk/clerk-expo';
import { useEffect } from 'react';
import { usePortfolioStore } from '../../lib/store/portfolio';
import { useApi } from '../../lib/hooks/useApi';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabLayout() {
  const { userId, signOut } = useAuth();
  const setAuth = usePortfolioStore((state) => state.setAuth);
  const { fetchWithAuth } = useApi();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    setAuth(userId || null, fetchWithAuth);
  }, [userId, fetchWithAuth]);

  const isWeb = Platform.OS === 'web';

  const commonScreenOptions = {
    headerStyle: {
      backgroundColor: '#FFFFFF',
    },
    headerTitleStyle: {
      fontWeight: '600' as const,
    },
  };

  const renderHeaderRight = () => (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <Link href="/transactions" asChild>
        <Pressable style={{ marginRight: 16, flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ fontSize: 18, marginRight: 4 }}>🧾</Text>
          <Text style={{ fontSize: 14, color: '#007AFF', fontWeight: '600' }}>Transactions</Text>
        </Pressable>
      </Link>
      <Pressable style={{ marginRight: 16 }} onPress={() => signOut()}>
        <Text style={{ fontSize: 14, color: '#FF3B30', fontWeight: '600' }}>Logout</Text>
      </Pressable>
    </View>
  );

  const SCREENS = [
    {
      name: "index",
      title: "Portfolio",
      headerTitle: "My Portfolio",
      icon: "💼",
      showLogout: true,
    },
    {
      name: "analysis",
      title: "Analysis",
      headerTitle: "Portfolio Analysis",
      icon: "📊",
    },
    {
      name: "optimizer",
      title: "Optimizer",
      headerTitle: "Portfolio Optimizer",
      icon: "🧮",
    },
    {
      name: "search",
      title: "Search",
      headerTitle: "Search Stocks",
      icon: "🔍",
    },
  ];

  if (isWeb) {
    return (
      <Drawer
        screenOptions={{
          ...commonScreenOptions,
          drawerActiveTintColor: '#007AFF',
          drawerInactiveTintColor: '#8E8E93',
          drawerStyle: {
            backgroundColor: '#FFFFFF',
            width: 240,
          },
        }}
      >
        {SCREENS.map((screen) => (
          <Drawer.Screen
            key={screen.name}
            name={screen.name}
            options={{
              title: screen.title,
              drawerIcon: () => <Text style={{ fontSize: 20 }}>{screen.icon}</Text>,
              headerTitle: screen.headerTitle,
              headerRight: screen.showLogout ? renderHeaderRight : undefined,
            }}
          />
        ))}
      </Drawer>
    );
  }

  return (
    <Tabs
      screenOptions={{
        ...commonScreenOptions,
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E5E5EA',
        },
      }}
    >
      {SCREENS.map((screen) => (
        <Tabs.Screen
          key={screen.name}
          name={screen.name}
          options={{
            title: screen.title,
            tabBarIcon: () => <Text style={{ fontSize: 20 }}>{screen.icon}</Text>,
            headerTitle: screen.headerTitle,
            headerRight: screen.showLogout ? renderHeaderRight : undefined,
          }}
        />
      ))}
    </Tabs>
  );
}