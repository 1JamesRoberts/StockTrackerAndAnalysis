import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      refetchOnWindowFocus: false,
    },
  },
});

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <Stack 
        screenOptions={{ 
          headerShown: true,
          headerTitle: '',
          headerBackTitle: 'Back',
          headerTintColor: '#007AFF',
          headerStyle: { backgroundColor: '#FFFFFF' },
          headerShadowVisible: false,
        }}
      >
        <Stack.Screen 
          name="(tabs)" 
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="stock/[symbol]" 
          options={{ 
            headerTitle: 'Stock Details',
          }} 
        />
      </Stack>
    </QueryClientProvider>
  );
}