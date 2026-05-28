import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';

interface HeaderProps {
  onPressProfile?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onPressProfile }) => {
  const { colors, spacing, typography, radius } = useTheme();

  return (
    <View style={[styles.container, { paddingVertical: spacing.md }]}>
      <View style={styles.left}>
        {/* Placeholder para logo – pode ser uma imagem local futuramente */}
        <View
          style={[
            styles.logo,
            { backgroundColor: colors.primaryYellow, borderRadius: radius.md },
          ]}
        >
          <Text style={{ fontWeight: 'bold' }}>CE</Text>
        </View>
        <View>
          <Text
            style={{
              color: colors.textPrimary,
              fontSize: typography.fontSizeMd,
              fontFamily: typography.fontFamilyBold,
            }}
          >
            Collect Express
          </Text>
          <Text
            style={{
              color: colors.textSecondary,
              fontSize: typography.fontSizeXs,
              fontFamily: typography.fontFamilyRegular,
            }}
          >
            Soluções inteligentes em coleta de resíduos
          </Text>
        </View>
      </View>
      <TouchableOpacity
        onPress={onPressProfile}
        style={[
          styles.profileButton,
          {
            borderColor: colors.border,
          },
        ]}
      >
        <Ionicons name="person-circle-outline" size={28} color={colors.primaryGreen} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  } as any,
  logo: {
    width: 40,
    height: 40,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileButton: {
    padding: 4,
    borderWidth: 1,
    borderRadius: 999,
  },
});

export default Header;