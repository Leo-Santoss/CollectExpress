import React from 'react';
import { View, Text, StyleSheet, ImageBackground } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import Button from './buttons/Button';

interface HeroBannerProps {
  onRequestCollection: () => void;
  onAdvertiseDumpster: () => void;
}

const HeroBanner: React.FC<HeroBannerProps> = ({
  onRequestCollection,
  onAdvertiseDumpster,
}) => {
  const { colors, spacing, typography, radius, shadows } = useTheme();

  // Imagem de placeholder (pode ser remota ou local)
  const bannerUri =
    'https://images.pexels.com/photos/5648403/pexels-photo-5648403.jpeg?auto=compress&cs=tinysrgb&w=800';

  return (
    <View
      style={[
        styles.container,
        {
          borderRadius: radius.lg,
          backgroundColor: colors.surface,
          ...shadows.medium,
        },
      ]}
    >
      <ImageBackground
        source={{ uri: bannerUri }}
        style={styles.background}
        imageStyle={{ borderRadius: radius.lg }}
      >
        <View
          style={[
            styles.overlay,
            {
              backgroundColor: 'rgba(0,0,0,0.45)',
              borderRadius: radius.lg,
              padding: spacing.lg,
            },
          ]}
        >
          <Text
            style={{
              color: colors.white,
              fontSize: typography.fontSizeXl,
              fontFamily: typography.fontFamilyBold,
              marginBottom: spacing.sm,
            }}
          >
            Conectando você à coleta inteligente de resíduos.
          </Text>
          <Text
            style={{
              color: colors.white,
              fontSize: typography.fontSizeSm,
              fontFamily: typography.fontFamilyRegular,
              marginBottom: spacing.md,
            }}
          >
            Encontre caçambas, containers e serviços de coleta em poucos toques, com
            transparência, segurança e sustentabilidade.
          </Text>

          <View style={styles.actions}>
            <Button
              label="Solicitar coleta"
              onPress={onRequestCollection}
              variant="primary"
              fullWidth={false}
            />
            <Button
              label="Anunciar caçamba"
              onPress={onAdvertiseDumpster}
              variant="outline"
              fullWidth={false}
            />
          </View>
        </View>
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  background: {
    width: '100%',
    minHeight: 220,
    justifyContent: 'center',
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  } as any,
});

export default HeroBanner;