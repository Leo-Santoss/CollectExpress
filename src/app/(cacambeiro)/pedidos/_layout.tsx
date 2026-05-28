import { Stack } from 'expo-router';
import { useTheme } from '../../../hooks/useTheme';

export default function PedidosLayout() {
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
      <Stack.Screen name="index" options={{ title: 'Pedidos' }} />
      <Stack.Screen name="[id]" options={{ title: 'Detalhes do Pedido' }} />
    </Stack>
  );
}
