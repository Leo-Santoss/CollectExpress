import { Stack } from 'expo-router';
import { useTheme } from '../../../hooks/useTheme';

export default function CacambasLayout() {
  const { colors, typography } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.textPrimary,
        headerTitleStyle: {
          fontFamily: typography.fontFamilyBold,
          fontSize: typography.fontSizeMd,
        },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Minhas Caçambas' }} />
      <Stack.Screen name="criar" options={{ title: 'Nova Caçamba' }} />
      <Stack.Screen name="[id]" options={{ title: 'Editar Caçamba' }} />
    </Stack>
  );
}
