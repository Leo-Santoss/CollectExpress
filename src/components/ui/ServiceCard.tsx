import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { Service } from '../../type/service';
import Badge from './Badge';
import Button from './buttons/Button';
import { Ionicons } from '@expo/vector-icons';

interface ServiceCardProps {
  service: Service;
  onPressContract: (service: Service) => void;
}

const ServiceCard: React.FC<ServiceCardProps> = ({ service, onPressContract }) => {
  const { colors, spacing, typography, radius, shadows } = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderRadius: radius.md,
          ...shadows.soft,
        },
      ]}
    >
      <Image
        source={{ uri: service.imageUrl }}
        style={[styles.image, { borderTopLeftRadius: radius.md, borderTopRightRadius: radius.md }]}
      />
      <View style={{ padding: spacing.md }}>
        <View style={styles.headerRow}>
          <Text
            style={{
              color: colors.textPrimary,
              fontSize: typography.fontSizeMd,
              fontFamily: typography.fontFamilyBold,
              flex: 1,
            }}
            numberOfLines={1}
          >
            {service.title}
          </Text>
          <Badge
            label={service.isAvailable ? 'Disponível' : 'Indisponível'}
            variant={service.isAvailable ? 'success' : 'warning'}
          />
        </View>

        <Text
          style={{
            color: colors.textSecondary,
            fontSize: typography.fontSizeSm,
            marginTop: spacing.xs,
          }}
          numberOfLines={2}
        >
          {service.description}
        </Text>

        <View style={[styles.footerRow, { marginTop: spacing.md }]}>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                color: colors.primaryGreen,
                fontSize: typography.fontSizeMd,
                fontFamily: typography.fontFamilyBold,
              }}
            >
              {service.price}
            </Text>
            <View style={styles.locationRow}>
              <Ionicons
                name="location-outline"
                size={14}
                color={colors.textSecondary}
                style={{ marginRight: 4 }}
              />
              <Text
                style={{
                  color: colors.textSecondary,
                  fontSize: typography.fontSizeXs,
                }}
                numberOfLines={1}
              >
                {service.location}
              </Text>
            </View>
          </View>

          <Button
            label="Contratar"
            onPress={() => onPressContract(service)}
            variant="primary"
            fullWidth={false}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
    marginBottom: 12,
  },
  image: {
    width: '100%',
    height: 140,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  } as any,
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
});

export default ServiceCard;