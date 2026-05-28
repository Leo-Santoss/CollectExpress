import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import TextInputField from './inputs/TextInputField';
import Button from './buttons/Button';
import { Ionicons } from '@expo/vector-icons';

interface SearchBarProps {
  searchValue: string;
  onChangeSearch: (text: string) => void;
  locationValue: string;
  onChangeLocation: (text: string) => void;
  onSearch: () => void;
}

const SearchBar: React.FC<SearchBarProps> = ({
  searchValue,
  onChangeSearch,
  locationValue,
  onChangeLocation,
  onSearch,
}) => {
  const { spacing, colors } = useTheme();

  return (
    <View style={[styles.container, { gap: spacing.sm }]}>
      <TextInputField
        label="O que você precisa?"
        placeholder="Ex: caçamba, coleta residencial..."
        value={searchValue}
        onChangeText={onChangeSearch}
        style={{ flex: 1 }}
      />
      <View style={styles.inlineRow}>
        <View style={{ flex: 1 }}>
          <TextInputField
            label="Localização"
            placeholder="Ex: São Paulo, SP"
            value={locationValue}
            onChangeText={onChangeLocation}
          />
        </View>
        <View style={{ marginLeft: spacing.sm }}>
          <Button
            label=""
            onPress={onSearch}
            variant="primary"
            fullWidth={false}
            style={{ paddingHorizontal: spacing.sm }}
          >
            {/* Não usamos children aqui porque o Button está implementado com label.
                Se quiser um botão só com ícone, poderia usar IconButton. */}
          </Button>
        </View>
      </View>

      {/* Alternativa: botão de busca separado com ícone */}
      <View style={{ alignItems: 'flex-end' }}>
        <Button
          label="Buscar serviços"
          onPress={onSearch}
          variant="secondary"
          fullWidth={false}
          style={{ flexDirection: 'row', alignItems: 'center' }}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  inlineRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
});

export default SearchBar;