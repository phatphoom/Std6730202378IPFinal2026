import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { AuthProvider, useAuth } from '@/context/auth-context';

function RouteGuard() {
  const { session } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    const inAuthGroup = segments[0] === '(tabs)';
    const onLogin = segments[0] === 'login';
    if (!session && inAuthGroup) {
      router.replace('/login');
    } else if (session && onLogin) {
      router.replace('/(tabs)');
    }
  }, [session, segments, router]);

  return null;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="auto" />
      <RouteGuard />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="login" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
      </Stack>
    </AuthProvider>
  );
}
