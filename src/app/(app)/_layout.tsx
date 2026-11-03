import { Stack } from 'expo-router';
import { useTheme } from 'react-native-paper';

export default function AppLayout() {
  const theme = useTheme();

  return (
    <Stack
      screenOptions={{
        contentStyle: { backgroundColor: theme.colors.background },
        headerStyle: { backgroundColor: theme.colors.elevation.level2 },
        headerTintColor: theme.colors.onSurface,
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Nómadas' }} />
      <Stack.Screen name="nomads/new" options={{ title: 'Inscribir Nómada' }} />
      <Stack.Screen name="nomads/[id]/index" options={{ title: 'Nómada' }} />
      <Stack.Screen name="nomads/[id]/edit" options={{ title: 'Editar datos' }} />
      <Stack.Screen name="nomads/[id]/record" options={{ title: 'Registrar progresión' }} />
      <Stack.Screen name="nomads/[id]/badge" options={{ title: 'Otorgar insignia' }} />
    </Stack>
  );
}