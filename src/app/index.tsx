import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useThemeContext } from '../theme/ThemeProvider';

export default function IndexRedirect() {
  const { user, isLoading, logout } = useAuth();
  const theme = useThemeContext();
  const [shouldClearSession, setShouldClearSession] = useState(false);

  useEffect(() => {
    if (!isLoading && user && !isValidProfile(user.tipo_perfil)) {
      logout();
      setShouldClearSession(true);
    }
  }, [isLoading, user, logout]);

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!user || shouldClearSession) {
    return <Redirect href="/(auth)/login" />;
  }

  switch (user.tipo_perfil) {
    case 'CONSUMIDOR':
      return <Redirect href="/(consumer)/" />;
    case 'CACAMBEIRO':
      return <Redirect href="/(cacambeiro)/dashboard" />;
    case 'ADMIN':
      return <Redirect href="/(admin)/dashboard" />;
    default:
      return <Redirect href="/(auth)/login" />;
  }
}

function isValidProfile(tipoPerfil: string): boolean {
  return ['CONSUMIDOR', 'CACAMBEIRO', 'ADMIN'].includes(tipoPerfil);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
