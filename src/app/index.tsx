import { Image } from 'expo-image';
import { Redirect, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../hooks/useTheme';
import api from '../services/api';

export default function LandingPage() {
  const { user, isLoading, logout } = useAuth();
  const { colors, spacing, typography, radius } = useTheme();
  
  const [cacambas, setCacambas] = useState<any[]>([]);
  const [loadingCacambas, setLoadingCacambas] = useState(true);

  useEffect(() => {
    if (!isLoading && user && !isValidProfile(user.tipo_perfil)) {
      logout();
    }
  }, [isLoading, user, logout]);

  useEffect(() => {
    // Fetch public cacambas
    api.get('/cacambas?page=1')
      .then(res => setCacambas(res.data.data.slice(0, 5)))
      .catch(err => console.error(err))
      .finally(() => setLoadingCacambas(false));
  }, []);

  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primaryGreen} />
      </View>
    );
  }

  // If logged in, redirect
  if (user && isValidProfile(user.tipo_perfil)) {
    switch (user.tipo_perfil) {
      case 'CONSUMIDOR':
        return <Redirect href="/(consumer)/" />;
      case 'CACAMBEIRO':
        return <Redirect href="/(cacambeiro)/dashboard" />;
      case 'ADMIN':
        return <Redirect href="/(admin)/dashboard" />;
    }
  }

  // Render Landing Page
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xxl }} showsVerticalScrollIndicator={false}>
        <View style={styles.heroSection}>
          <Image 
            source={require('../../assets/images/logo.png')} 
            style={{ width: 200, height: 200 }} 
            contentFit="contain" 
            accessibilityLabel="CollectExpress Logo"
          />
          <Text style={[styles.heroTitle, { color: colors.textPrimary, fontFamily: typography.fontFamilyBold }]}>
            Aluguel de Caçambas Simples e Rápido
          </Text>
          <Text style={[styles.heroSubtitle, { color: colors.textSecondary }]}>
            Encontre os melhores preços de caçambeiros na sua região com rapidez e segurança.
          </Text>
          
          <Button 
            title="Entrar ou Cadastrar" 
            onPress={() => router.push('/(auth)/login')} 
            style={{ marginTop: spacing.xl, width: '100%' }}
          />
        </View>

        <View style={[styles.section, { paddingHorizontal: spacing.lg }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary, fontFamily: typography.fontFamilyBold }]}>
            Algumas Caçambas Disponíveis
          </Text>
          
          {loadingCacambas ? (
            <ActivityIndicator color={colors.primaryGreen} style={{ marginVertical: spacing.xl }} />
          ) : (
            cacambas.map(item => (
              <Card key={item.id} style={{ marginBottom: spacing.md }}>
                <View style={{ flexDirection: 'row' }}>
                  {item.foto_url && (
                    <Image source={{ uri: item.foto_url }} style={{ width: 80, height: 80, borderRadius: radius.sm, marginRight: spacing.md }} contentFit="cover" />
                  )}
                  <View style={{ flex: 1, justifyContent: 'center' }}>
                    <Text style={{ fontFamily: typography.fontFamilyBold, fontSize: typography.fontSize.md, color: colors.textPrimary }} numberOfLines={1}>{item.nome}</Text>
                    <Text style={{ color: colors.textSecondary, fontSize: typography.fontSize.sm }}>{item.tipo_residuo} - {item.tamanho_m3}m³</Text>
                    <Text style={{ color: colors.primaryGreen, fontFamily: typography.fontFamilyBold, marginTop: spacing.xs }}>
                      {Number(item.preco_diaria).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}/dia
                    </Text>
                  </View>
                </View>
              </Card>
            ))
          )}
        </View>

        {/* Avaliações Section */}
        <View style={[styles.section, { paddingHorizontal: spacing.lg, marginTop: spacing.xxl }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary, fontFamily: typography.fontFamilyBold }]}>
            O que nossos clientes dizem
          </Text>
          <Card style={{ marginBottom: spacing.md, backgroundColor: colors.surfaceVariant }}>
            <Text style={{ fontStyle: 'italic', color: colors.textSecondary, marginBottom: spacing.sm }}>
              "Serviço rápido e eficiente! A caçamba chegou no horário combinado e o preço foi o melhor que encontrei."
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ fontFamily: typography.fontFamilyBold, color: colors.textPrimary }}>⭐⭐⭐⭐⭐</Text>
              <Text style={{ marginLeft: spacing.sm, color: colors.textPrimary, fontSize: typography.fontSize.sm }}>
                - João Construtor
              </Text>
            </View>
          </Card>
          <Card style={{ marginBottom: spacing.md, backgroundColor: colors.surfaceVariant }}>
            <Text style={{ fontStyle: 'italic', color: colors.textSecondary, marginBottom: spacing.sm }}>
              "Aplicativo muito fácil de usar. Consegui alugar uma caçamba pra minha reforma em menos de 2 minutos."
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ fontFamily: typography.fontFamilyBold, color: colors.textPrimary }}>⭐⭐⭐⭐⭐</Text>
              <Text style={{ marginLeft: spacing.sm, color: colors.textPrimary, fontSize: typography.fontSize.sm }}>
                - Maria Reformas
              </Text>
            </View>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function isValidProfile(tipoPerfil: string): boolean {
  return ['CONSUMIDOR', 'CACAMBEIRO', 'ADMIN'].includes(tipoPerfil);
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  heroSection: {
    alignItems: 'center',
    padding: 24,
    paddingTop: 32,
  },
  heroTitle: {
    fontSize: 28,
    textAlign: 'center',
    marginTop: 24,
    marginBottom: 12,
  },
  heroSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  section: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 20,
    marginBottom: 16,
  }
});
