import React from 'react';
import { Image, ImageStyle, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

export interface AvatarProps {
  name: string;
  imageUrl?: string | null;
  size?: number;
  style?: ViewStyle;
  accessibilityLabel?: string;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

const Avatar: React.FC<AvatarProps> = ({
  name,
  imageUrl,
  size = 44,
  style,
  accessibilityLabel,
}) => {
  const { colors, typography } = useTheme();

  const initials = getInitials(name);
  const fontSize = size * 0.4;

  if (imageUrl) {
    return (
      <Image
        source={{ uri: imageUrl }}
        style={[
          styles.image,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
          },
          style as ImageStyle,
        ]}
        accessibilityRole="image"
        accessibilityLabel={accessibilityLabel || `Foto de ${name}`}
      />
    );
  }

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: colors.primaryLight,
        },
        style,
      ]}
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel || `Avatar de ${name}`}
    >
      <Text
        style={{
          fontSize,
          fontFamily: typography.fontFamilyBold,
          color: colors.primaryDark,
        }}
      >
        {initials}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    resizeMode: 'cover',
  },
});

export default Avatar;
