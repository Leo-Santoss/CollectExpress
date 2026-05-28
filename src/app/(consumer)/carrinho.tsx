import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  Button,
  Card,
  EmptyState,
  LoadingSpinner,
} from '../../components/ui';
import { useCart } from '../../context/CartContext';
import { useTheme } from '../../hooks/useTheme';
import * as alugueisService from '../../services/alugueisService';
import * as enderecosService from '../../services/enderecosService';
import { Endereco, ItemCarrinho } from '../../types';

export default function CarrinhoScreen() {
  const router = useRouter();
  const { colors, spacing, typography, radius } = useTheme();
  const { cart, itemCount, total, isLoading, updateItem, clearCart, refreshCart } = useCart();

  // Refresh cart when screen gains focus
  const navigation = useNavigation();
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      refreshCart();
    });
    return unsubscribe;
  }, [navigation, refreshCart]);

  // Checkout state
  const [enderecos, setEnderecos] = useState<Endereco[]>([]);
  const [selectedEnderecoId, setSelectedEnderecoId] = useState<string>('');
  const [dataInicio, setDataInicio] = useState<string>('');
  const [diasAluguel, setDiasAluguel] = useState<string>('1');
  const [loadingEnderecos, setLoadingEnderecos] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [showAddressPicker, setShowAddressPicker] = useState(false);

  // ── Load addresses ──────────────────────────────────────────────────────────

  const loadEnderecos = useCallback(async () => {
    setLoadingEnderecos(true);
    try {
      const data = await enderecosService.listar();
      setEnderecos(data);
      if (data.length > 0 && !selectedEnderecoId) {
        setSelectedEnderecoId(data[0].id);
      }
    } catch {
      // Silently fail, user can retry
    } finally {
      setLoadingEnderecos(false);
    }
  }, [selectedEnderecoId]);

  useEffect(() => {
    if (cart && cart.itens && cart.itens.length > 0) {
      loadEnderecos();
      // Set default date to tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setDataInicio(formatDateForInput(tomorrow));
    }
  }, [cart?.id]);

  // ── Helpers ─────────────────────────────────────────────────────────────────

  function formatDateForInput(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function formatDateDisplay(dateStr: string): string {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  }

  function getMinDate(): string {
    const min = new Date();
    min.setDate(min.getDate() + 1);
    return formatDateForInput(min);
  }

  function getMaxDate(): string {
    const max = new Date();
    max.setDate(max.getDate() + 60);
    return formatDateForInput(max);
  }

  function isDateValid(dateStr: string): boolean {
    if (!dateStr) return false;
    const date = new Date(dateStr + 'T00:00:00');
    const min = new Date();
    min.setDate(min.getDate() + 1);
    min.setHours(0, 0, 0, 0);
    const max = new Date();
    max.setDate(max.getDate() + 60);
    max.setHours(23, 59, 59, 999);
    return date >= min && date <= max;
  }

  function isDiasAluguelValid(dias: string): boolean {
    const num = parseInt(dias, 10);
    return !isNaN(num) && num >= 1 && num <= 30;
  }

  // ── Calculate price breakdown ───────────────────────────────────────────────

  const diasAluguelNum = isDiasAluguelValid(diasAluguel) ? parseInt(diasAluguel, 10) : 1;
  const subtotal = cart?.itens?.reduce((sum, item) => {
    const preco = Number(item.cacamba?.preco_diaria ?? 0);
    return sum + item.quantidade * diasAluguelNum * preco;
  }, 0) || 0;
  // Note: taxa_entrega comes from the cacambeiro details, not available in cart items directly
  // The backend calculates the final price during checkout

  // ── Quantity handlers ───────────────────────────────────────────────────────

  const handleQuantityChange = async (item: ItemCarrinho, newQty: number) => {
    if (newQty < 1 || newQty > 10) return;
    await updateItem(item.id, newQty);
  };

  // ── Clear cart handler ──────────────────────────────────────────────────────

  const handleClearCart = () => {
    Alert.alert(
      'Limpar carrinho',
      'Tem certeza que deseja remover todos os itens do carrinho?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Limpar',
          style: 'destructive',
          onPress: async () => {
            await clearCart();
          },
        },
      ]
    );
  };

  // ── Checkout handler ────────────────────────────────────────────────────────

  const handleCheckout = async () => {
    // Validate fields
    if (!selectedEnderecoId) {
      Alert.alert('Erro', 'Selecione um endereço de entrega.');
      return;
    }
    if (!isDateValid(dataInicio)) {
      Alert.alert('Erro', 'Selecione uma data de início válida (entre 1 e 60 dias a partir de hoje).');
      return;
    }
    if (!isDiasAluguelValid(diasAluguel)) {
      Alert.alert('Erro', 'Informe um período de aluguel válido (1 a 30 dias).');
      return;
    }

    setCheckingOut(true);
    try {
      await alugueisService.checkout({
        endereco_id: selectedEnderecoId,
        data_inicio: dataInicio,
        dias_aluguel: parseInt(diasAluguel, 10),
      });

      // Clear cart locally
      await clearCart();

      Alert.alert(
        'Pedido realizado!',
        'Seu pedido foi criado com sucesso.',
        [
          {
            text: 'Ver meus pedidos',
            onPress: () => router.push('/(consumer)/pedidos'),
          },
        ]
      );
    } catch (error: any) {
      const message =
        error?.response?.data?.mensagem ||
        error?.response?.data?.message ||
        'Não foi possível finalizar o pedido. Tente novamente.';
      Alert.alert('Erro no checkout', message);
    } finally {
      setCheckingOut(false);
    }
  };

  // ── Date picker handler (simple text input for cross-platform) ──────────────

  const handleDateChange = (text: string) => {
    // Allow user to type date in YYYY-MM-DD format
    setDataInicio(text);
  };

  // ── Loading state ───────────────────────────────────────────────────────────

  if (isLoading && !cart) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <LoadingSpinner message="Carregando carrinho..." />
      </View>
    );
  }

  // ── Empty state ─────────────────────────────────────────────────────────────

  if (!cart || !cart.itens || cart.itens.length === 0) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <EmptyState
          title="Carrinho vazio"
          description="Você ainda não adicionou nenhuma caçamba ao carrinho. Explore o marketplace para encontrar a caçamba ideal."
          icon="cart-outline"
          actionLabel="Explorar Marketplace"
          onActionPress={() => router.push('/(consumer)/(home)')}
        />
      </View>
    );
  }

  // ── Cart with items ─────────────────────────────────────────────────────────

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: spacing.xxxl }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={[styles.header, { paddingHorizontal: spacing.lg, paddingTop: spacing.lg }]}>
          <Text
            style={{
              fontSize: typography.fontSize.xl,
              fontFamily: typography.fontFamilyBold,
              color: colors.textPrimary,
            }}
          >
            Carrinho ({itemCount} {itemCount === 1 ? 'item' : 'itens'})
          </Text>
          <TouchableOpacity
            onPress={handleClearCart}
            accessibilityLabel="Limpar carrinho"
            accessibilityRole="button"
            style={{ padding: spacing.xs }}
          >
            <Ionicons name="trash-outline" size={22} color={colors.error} />
          </TouchableOpacity>
        </View>

        {/* Cart Items */}
        {cart.itens.map((item) => (
          <Card
            key={item.id}
            style={{ marginHorizontal: spacing.lg, marginTop: spacing.md }}
            accessibilityLabel={`Item: ${item.cacamba?.nome || 'Caçamba'}`}
          >
            <View style={styles.itemRow}>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: typography.fontSizeMd,
                    fontFamily: typography.fontFamilyBold,
                    color: colors.textPrimary,
                    marginBottom: spacing.xs,
                  }}
                >
                  {item.cacamba?.nome || 'Caçamba'}
                </Text>
                <Text
                  style={{
                    fontSize: typography.fontSizeSm,
                    color: colors.textSecondary,
                    marginBottom: spacing.xs,
                  }}
                >
                  {item.cacamba?.tipo_residuo || ''}
                </Text>
                <Text
                  style={{
                    fontSize: typography.fontSizeSm,
                    color: colors.textSecondary,
                  }}
                >
                  R$ {Number(item.cacamba?.preco_diaria ?? 0).toFixed(2)} / dia
                </Text>
              </View>

              {/* Quantity controls */}
              <View style={styles.quantityContainer}>
                <TouchableOpacity
                  onPress={() => handleQuantityChange(item, item.quantidade - 1)}
                  disabled={item.quantidade <= 1}
                  accessibilityLabel="Diminuir quantidade"
                  accessibilityRole="button"
                  style={[
                    styles.quantityButton,
                    {
                      backgroundColor: colors.gray,
                      borderRadius: radius.sm,
                      opacity: item.quantidade <= 1 ? 0.4 : 1,
                    },
                  ]}
                >
                  <Ionicons name="remove" size={18} color={colors.textPrimary} />
                </TouchableOpacity>

                <Text
                  style={{
                    fontSize: typography.fontSizeMd,
                    fontFamily: typography.fontFamilyBold,
                    color: colors.textPrimary,
                    marginHorizontal: spacing.md,
                    minWidth: 24,
                    textAlign: 'center',
                  }}
                  accessibilityLabel={`Quantidade: ${item.quantidade}`}
                >
                  {item.quantidade}
                </Text>

                <TouchableOpacity
                  onPress={() => handleQuantityChange(item, item.quantidade + 1)}
                  disabled={item.quantidade >= 10}
                  accessibilityLabel="Aumentar quantidade"
                  accessibilityRole="button"
                  style={[
                    styles.quantityButton,
                    {
                      backgroundColor: colors.primaryGreen,
                      borderRadius: radius.sm,
                      opacity: item.quantidade >= 10 ? 0.4 : 1,
                    },
                  ]}
                >
                  <Ionicons name="add" size={18} color={colors.textInverse} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Item subtotal */}
            <View style={[styles.itemSubtotal, { marginTop: spacing.sm, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border }]}>
              <Text style={{ fontSize: typography.fontSizeSm, color: colors.textSecondary }}>
                {item.quantidade} × {diasAluguelNum} dias × R$ {Number(item.cacamba?.preco_diaria ?? 0).toFixed(2)}
              </Text>
              <Text
                style={{
                  fontSize: typography.fontSizeMd,
                  fontFamily: typography.fontFamilyBold,
                  color: colors.primaryGreen,
                }}
              >
                R$ {(item.quantidade * diasAluguelNum * Number(item.cacamba?.preco_diaria ?? 0)).toFixed(2)}
              </Text>
            </View>
          </Card>
        ))}

        {/* Running Total */}
        <Card style={{ marginHorizontal: spacing.lg, marginTop: spacing.md }}>
          <View style={styles.totalRow}>
            <Text
              style={{
                fontSize: typography.fontSizeLg,
                fontFamily: typography.fontFamilyBold,
                color: colors.textPrimary,
              }}
            >
              Subtotal
            </Text>
            <Text
              style={{
                fontSize: typography.fontSizeLg,
                fontFamily: typography.fontFamilyBold,
                color: colors.primaryGreen,
              }}
            >
              R$ {subtotal.toFixed(2)}
            </Text>
          </View>
        </Card>

        {/* Checkout Section */}
        <View style={{ marginTop: spacing.xl, paddingHorizontal: spacing.lg }}>
          <Text
            style={{
              fontSize: typography.fontSize.lg,
              fontFamily: typography.fontFamilyBold,
              color: colors.textPrimary,
              marginBottom: spacing.md,
            }}
          >
            Finalizar Pedido
          </Text>

          {/* Date picker */}
          <Card style={{ marginBottom: spacing.md }}>
            <Text
              style={{
                fontSize: typography.fontSizeSm,
                fontFamily: typography.fontFamilyMedium,
                color: colors.textSecondary,
                marginBottom: spacing.xs,
              }}
            >
              Data de início (AAAA-MM-DD)
            </Text>
            <TextInput
              value={dataInicio}
              onChangeText={handleDateChange}
              placeholder={getMinDate()}
              placeholderTextColor={colors.textSecondary}
              style={[
                styles.input,
                {
                  backgroundColor: colors.background,
                  color: colors.textPrimary,
                  borderColor: isDateValid(dataInicio) || !dataInicio ? colors.border : colors.error,
                  borderRadius: radius.md,
                  padding: spacing.sm,
                  fontSize: typography.fontSizeMd,
                },
              ]}
              keyboardType={Platform.OS === 'ios' ? 'default' : 'default'}
              accessibilityLabel="Data de início do aluguel"
            />
            <Text
              style={{
                fontSize: typography.fontSizeXs,
                color: colors.textSecondary,
                marginTop: spacing.xs,
              }}
            >
              Mínimo: {formatDateDisplay(getMinDate())} | Máximo: {formatDateDisplay(getMaxDate())}
            </Text>
          </Card>

          {/* Dias aluguel */}
          <Card style={{ marginBottom: spacing.md }}>
            <Text
              style={{
                fontSize: typography.fontSizeSm,
                fontFamily: typography.fontFamilyMedium,
                color: colors.textSecondary,
                marginBottom: spacing.xs,
              }}
            >
              Dias de aluguel (1-30)
            </Text>
            <TextInput
              value={diasAluguel}
              onChangeText={(text) => {
                const cleaned = text.replace(/[^0-9]/g, '');
                setDiasAluguel(cleaned);
              }}
              placeholder="1"
              placeholderTextColor={colors.textSecondary}
              keyboardType="numeric"
              maxLength={2}
              style={[
                styles.input,
                {
                  backgroundColor: colors.background,
                  color: colors.textPrimary,
                  borderColor: isDiasAluguelValid(diasAluguel) || !diasAluguel ? colors.border : colors.error,
                  borderRadius: radius.md,
                  padding: spacing.sm,
                  fontSize: typography.fontSizeMd,
                },
              ]}
              accessibilityLabel="Número de dias de aluguel"
            />
          </Card>

          {/* Address selection */}
          <Card style={{ marginBottom: spacing.md }}>
            <Text
              style={{
                fontSize: typography.fontSizeSm,
                fontFamily: typography.fontFamilyMedium,
                color: colors.textSecondary,
                marginBottom: spacing.xs,
              }}
            >
              Endereço de entrega
            </Text>

            {loadingEnderecos ? (
              <LoadingSpinner message="Carregando endereços..." />
            ) : enderecos.length === 0 ? (
              <View>
                <Text
                  style={{
                    fontSize: typography.fontSizeSm,
                    color: colors.textSecondary,
                    marginBottom: spacing.sm,
                  }}
                >
                  Nenhum endereço cadastrado.
                </Text>
                <Button
                  label="Cadastrar endereço"
                  onPress={() => router.push('/(consumer)/perfil/enderecos')}
                  variant="outline"
                  fullWidth={false}
                />
              </View>
            ) : (
              <View>
                <TouchableOpacity
                  onPress={() => setShowAddressPicker(!showAddressPicker)}
                  accessibilityLabel="Selecionar endereço"
                  accessibilityRole="button"
                  style={[
                    styles.addressSelector,
                    {
                      backgroundColor: colors.background,
                      borderColor: colors.border,
                      borderRadius: radius.md,
                      padding: spacing.sm,
                    },
                  ]}
                >
                  <Text
                    style={{
                      fontSize: typography.fontSizeSm,
                      color: colors.textPrimary,
                      flex: 1,
                    }}
                    numberOfLines={1}
                  >
                    {selectedEnderecoId
                      ? (() => {
                          const addr = enderecos.find((e) => e.id === selectedEnderecoId);
                          return addr
                            ? `${addr.logradouro}, ${addr.numero} - ${addr.bairro}`
                            : 'Selecione um endereço';
                        })()
                      : 'Selecione um endereço'}
                  </Text>
                  <Ionicons
                    name={showAddressPicker ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>

                {showAddressPicker && (
                  <View style={{ marginTop: spacing.sm }}>
                    {enderecos.map((endereco) => (
                      <TouchableOpacity
                        key={endereco.id}
                        onPress={() => {
                          setSelectedEnderecoId(endereco.id);
                          setShowAddressPicker(false);
                        }}
                        accessibilityLabel={`Endereço: ${endereco.logradouro}, ${endereco.numero}`}
                        accessibilityRole="radio"
                        accessibilityState={{ selected: selectedEnderecoId === endereco.id }}
                        style={[
                          styles.addressOption,
                          {
                            backgroundColor:
                              selectedEnderecoId === endereco.id
                                ? colors.primaryGreen + '15'
                                : colors.background,
                            borderColor:
                              selectedEnderecoId === endereco.id
                                ? colors.primaryGreen
                                : colors.border,
                            borderRadius: radius.sm,
                            padding: spacing.sm,
                            marginBottom: spacing.xs,
                          },
                        ]}
                      >
                        <Text
                          style={{
                            fontSize: typography.fontSizeSm,
                            color: colors.textPrimary,
                            fontFamily:
                              selectedEnderecoId === endereco.id
                                ? typography.fontFamilyBold
                                : typography.fontFamilyRegular,
                          }}
                        >
                          {endereco.logradouro}, {endereco.numero}
                        </Text>
                        <Text
                          style={{
                            fontSize: typography.fontSizeXs,
                            color: colors.textSecondary,
                            marginTop: 2,
                          }}
                        >
                          {endereco.bairro} - {endereco.cidade_estado} | CEP: {endereco.cep}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            )}
          </Card>

          {/* Price breakdown */}
          <Card style={{ marginBottom: spacing.lg }}>
            <Text
              style={{
                fontSize: typography.fontSizeMd,
                fontFamily: typography.fontFamilyBold,
                color: colors.textPrimary,
                marginBottom: spacing.md,
              }}
            >
              Resumo do pedido
            </Text>

            <View style={[styles.priceRow, { marginBottom: spacing.sm }]}>
              <Text style={{ fontSize: typography.fontSizeSm, color: colors.textSecondary }}>
                Subtotal dos itens
              </Text>
              <Text style={{ fontSize: typography.fontSizeSm, color: colors.textPrimary }}>
                R$ {subtotal.toFixed(2)}
              </Text>
            </View>

            <View style={[styles.priceRow, { marginBottom: spacing.sm }]}>
              <Text style={{ fontSize: typography.fontSizeSm, color: colors.textSecondary }}>
                Taxa de entrega
              </Text>
              <Text style={{ fontSize: typography.fontSizeSm, color: colors.textPrimary }}>
                Calculada no checkout
              </Text>
            </View>

            <View
              style={[
                styles.priceRow,
                {
                  paddingTop: spacing.sm,
                  borderTopWidth: 1,
                  borderTopColor: colors.border,
                },
              ]}
            >
              <Text
                style={{
                  fontSize: typography.fontSizeLg,
                  fontFamily: typography.fontFamilyBold,
                  color: colors.textPrimary,
                }}
              >
                Total estimado
              </Text>
              <Text
                style={{
                  fontSize: typography.fontSizeLg,
                  fontFamily: typography.fontFamilyBold,
                  color: colors.primaryGreen,
                }}
              >
                R$ {subtotal.toFixed(2)}
              </Text>
            </View>
          </Card>

          {/* Checkout button */}
          <Button
            label="Finalizar Pedido"
            onPress={handleCheckout}
            variant="primary"
            loading={checkingOut}
            disabled={
              !selectedEnderecoId ||
              !isDateValid(dataInicio) ||
              !isDiasAluguelValid(diasAluguel) ||
              checkingOut
            }
            accessibilityLabel="Finalizar pedido"
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemSubtotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  input: {
    borderWidth: 1,
  },
  addressSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
  addressOption: {
    borderWidth: 1,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
