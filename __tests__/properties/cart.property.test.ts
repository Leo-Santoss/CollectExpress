/**
 * Property-Based Tests for Cart Logic (Frontend)
 *
 * Tests the cart validation rules as pure functions:
 * - Property 17: Cart enforces single-cacambeiro constraint
 * - Property 18: Cart item quantity and duration constraints
 *
 * **Validates: Requirements 7.1, 7.2, 7.4, 7.7**
 */

import * as fc from 'fast-check';

// ─── Pure Validation Functions (extracted from CartContext/carrinho logic) ────

/**
 * Validates that a new item can be added to a cart without violating
 * the single-cacambeiro constraint.
 *
 * Returns { valid: true } if the item can be added, or
 * { valid: false, reason: string } if it violates the constraint.
 */
function validateSingleCacambeiroConstraint(
  cartCacambeiroId: string | null,
  newItemCacambeiroId: string,
): { valid: boolean; reason?: string } {
  // If cart is empty (no cacambeiro set), any cacambeiro is allowed
  if (!cartCacambeiroId) {
    return { valid: true };
  }

  // If the new item is from the same cacambeiro, it's allowed
  if (cartCacambeiroId === newItemCacambeiroId) {
    return { valid: true };
  }

  // Different cacambeiro → rejected
  return {
    valid: false,
    reason: 'Todos os itens do carrinho devem ser do mesmo fornecedor.',
  };
}

/**
 * Validates that quantidade is within the allowed range [1, 10].
 */
function validateQuantidade(quantidade: number): { valid: boolean; reason?: string } {
  if (!Number.isInteger(quantidade)) {
    return { valid: false, reason: 'Quantidade deve ser um número inteiro.' };
  }
  if (quantidade < 1 || quantidade > 10) {
    return {
      valid: false,
      reason: 'Quantidade deve ser entre 1 e 10 unidades.',
    };
  }
  return { valid: true };
}

/**
 * Validates that dias_aluguel is within the allowed range [1, 90].
 */
function validateDiasAluguel(diasAluguel: number): { valid: boolean; reason?: string } {
  if (!Number.isInteger(diasAluguel)) {
    return { valid: false, reason: 'Dias de aluguel deve ser um número inteiro.' };
  }
  if (diasAluguel < 1 || diasAluguel > 90) {
    return {
      valid: false,
      reason: 'Dias de aluguel deve ser entre 1 e 90 dias.',
    };
  }
  return { valid: true };
}

/**
 * Validates a complete cart item addition operation.
 * Combines single-cacambeiro, quantidade, and dias_aluguel checks.
 */
function validateAddItemToCart(
  cartCacambeiroId: string | null,
  newItem: { cacambeiro_id: string; quantidade: number; dias_aluguel: number },
): { valid: boolean; reasons: string[] } {
  const reasons: string[] = [];

  const cacambeiroCheck = validateSingleCacambeiroConstraint(
    cartCacambeiroId,
    newItem.cacambeiro_id,
  );
  if (!cacambeiroCheck.valid) {
    reasons.push(cacambeiroCheck.reason!);
  }

  const quantidadeCheck = validateQuantidade(newItem.quantidade);
  if (!quantidadeCheck.valid) {
    reasons.push(quantidadeCheck.reason!);
  }

  const diasCheck = validateDiasAluguel(newItem.dias_aluguel);
  if (!diasCheck.valid) {
    reasons.push(diasCheck.reason!);
  }

  return { valid: reasons.length === 0, reasons };
}

// ─── Generators ──────────────────────────────────────────────────────────────

/** Generates a valid UUID-like string for IDs */
const uuidArb = fc.uuid();

/** Generates a valid quantidade (1-10) */
const validQuantidadeArb = fc.integer({ min: 1, max: 10 });

/** Generates an invalid quantidade (outside 1-10) */
const invalidQuantidadeArb = fc.oneof(
  fc.integer({ min: -1000, max: 0 }),
  fc.integer({ min: 11, max: 1000 }),
);

/** Generates a valid dias_aluguel (1-90) */
const validDiasAluguelArb = fc.integer({ min: 1, max: 90 });

/** Generates an invalid dias_aluguel (outside 1-90) */
const invalidDiasAluguelArb = fc.oneof(
  fc.integer({ min: -1000, max: 0 }),
  fc.integer({ min: 91, max: 1000 }),
);

/** Generates two distinct UUIDs (for different cacambeiros) */
const twoDifferentUuidsArb = fc
  .tuple(uuidArb, uuidArb)
  .filter(([a, b]) => a !== b);

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('Property 17: Cart enforces single-cacambeiro constraint', () => {
  /**
   * **Validates: Requirements 7.2**
   *
   * For any cart containing items from cacambeiro A, attempting to add
   * an item from a different cacambeiro B should be rejected.
   */

  it('should allow adding items from the same cacambeiro', () => {
    fc.assert(
      fc.property(uuidArb, (cacambeiroId) => {
        const result = validateSingleCacambeiroConstraint(cacambeiroId, cacambeiroId);
        expect(result.valid).toBe(true);
        expect(result.reason).toBeUndefined();
      }),
      { numRuns: 200 },
    );
  });

  it('should reject adding items from a different cacambeiro', () => {
    fc.assert(
      fc.property(twoDifferentUuidsArb, ([cacambeiroA, cacambeiroB]) => {
        const result = validateSingleCacambeiroConstraint(cacambeiroA, cacambeiroB);
        expect(result.valid).toBe(false);
        expect(result.reason).toBeDefined();
        expect(result.reason!.length).toBeGreaterThan(0);
      }),
      { numRuns: 200 },
    );
  });

  it('should allow adding any item to an empty cart (no cacambeiro set)', () => {
    fc.assert(
      fc.property(uuidArb, (newCacambeiroId) => {
        const result = validateSingleCacambeiroConstraint(null, newCacambeiroId);
        expect(result.valid).toBe(true);
      }),
      { numRuns: 200 },
    );
  });

  it('should be symmetric: if A rejects B, then B rejects A', () => {
    fc.assert(
      fc.property(twoDifferentUuidsArb, ([cacambeiroA, cacambeiroB]) => {
        const resultAB = validateSingleCacambeiroConstraint(cacambeiroA, cacambeiroB);
        const resultBA = validateSingleCacambeiroConstraint(cacambeiroB, cacambeiroA);
        expect(resultAB.valid).toBe(false);
        expect(resultBA.valid).toBe(false);
      }),
      { numRuns: 200 },
    );
  });

  it('should be reflexive: same cacambeiro always passes regardless of ID value', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 100 }),
        (id) => {
          const result = validateSingleCacambeiroConstraint(id, id);
          expect(result.valid).toBe(true);
        },
      ),
      { numRuns: 200 },
    );
  });
});

describe('Property 18: Cart item quantity and duration constraints', () => {
  /**
   * **Validates: Requirements 7.1, 7.4, 7.7**
   *
   * For any cart item operation, quantidade must be 1-10 and
   * dias_aluguel must be 1-90. Values outside these ranges should be rejected.
   */

  describe('quantidade validation', () => {
    it('should accept valid quantidade values (1-10)', () => {
      fc.assert(
        fc.property(validQuantidadeArb, (quantidade) => {
          const result = validateQuantidade(quantidade);
          expect(result.valid).toBe(true);
          expect(result.reason).toBeUndefined();
        }),
        { numRuns: 200 },
      );
    });

    it('should reject quantidade values outside 1-10', () => {
      fc.assert(
        fc.property(invalidQuantidadeArb, (quantidade) => {
          const result = validateQuantidade(quantidade);
          expect(result.valid).toBe(false);
          expect(result.reason).toBeDefined();
        }),
        { numRuns: 200 },
      );
    });

    it('should reject non-integer quantidade values', () => {
      fc.assert(
        fc.property(
          fc.double({ min: 0.01, max: 10.99, noNaN: true }).filter((n) => !Number.isInteger(n)),
          (quantidade) => {
            const result = validateQuantidade(quantidade);
            expect(result.valid).toBe(false);
          },
        ),
        { numRuns: 200 },
      );
    });

    it('should accept exactly the boundary values 1 and 10', () => {
      expect(validateQuantidade(1).valid).toBe(true);
      expect(validateQuantidade(10).valid).toBe(true);
      expect(validateQuantidade(0).valid).toBe(false);
      expect(validateQuantidade(11).valid).toBe(false);
    });
  });

  describe('dias_aluguel validation', () => {
    it('should accept valid dias_aluguel values (1-90)', () => {
      fc.assert(
        fc.property(validDiasAluguelArb, (diasAluguel) => {
          const result = validateDiasAluguel(diasAluguel);
          expect(result.valid).toBe(true);
          expect(result.reason).toBeUndefined();
        }),
        { numRuns: 200 },
      );
    });

    it('should reject dias_aluguel values outside 1-90', () => {
      fc.assert(
        fc.property(invalidDiasAluguelArb, (diasAluguel) => {
          const result = validateDiasAluguel(diasAluguel);
          expect(result.valid).toBe(false);
          expect(result.reason).toBeDefined();
        }),
        { numRuns: 200 },
      );
    });

    it('should reject non-integer dias_aluguel values', () => {
      fc.assert(
        fc.property(
          fc.double({ min: 0.01, max: 90.99, noNaN: true }).filter((n) => !Number.isInteger(n)),
          (diasAluguel) => {
            const result = validateDiasAluguel(diasAluguel);
            expect(result.valid).toBe(false);
          },
        ),
        { numRuns: 200 },
      );
    });

    it('should accept exactly the boundary values 1 and 90', () => {
      expect(validateDiasAluguel(1).valid).toBe(true);
      expect(validateDiasAluguel(90).valid).toBe(true);
      expect(validateDiasAluguel(0).valid).toBe(false);
      expect(validateDiasAluguel(91).valid).toBe(false);
    });
  });

  describe('combined add-item validation', () => {
    it('should accept valid items from the same cacambeiro with valid ranges', () => {
      fc.assert(
        fc.property(
          uuidArb,
          uuidArb,
          validQuantidadeArb,
          validDiasAluguelArb,
          (cartCacambeiroId, cacambaId, quantidade, diasAluguel) => {
            const result = validateAddItemToCart(cartCacambeiroId, {
              cacambeiro_id: cartCacambeiroId,
              quantidade,
              dias_aluguel: diasAluguel,
            });
            expect(result.valid).toBe(true);
            expect(result.reasons).toHaveLength(0);
          },
        ),
        { numRuns: 200 },
      );
    });

    it('should reject items with invalid quantidade even from the same cacambeiro', () => {
      fc.assert(
        fc.property(
          uuidArb,
          invalidQuantidadeArb,
          validDiasAluguelArb,
          (cacambeiroId, quantidade, diasAluguel) => {
            const result = validateAddItemToCart(cacambeiroId, {
              cacambeiro_id: cacambeiroId,
              quantidade,
              dias_aluguel: diasAluguel,
            });
            expect(result.valid).toBe(false);
            expect(result.reasons.length).toBeGreaterThanOrEqual(1);
          },
        ),
        { numRuns: 200 },
      );
    });

    it('should reject items with invalid dias_aluguel even from the same cacambeiro', () => {
      fc.assert(
        fc.property(
          uuidArb,
          validQuantidadeArb,
          invalidDiasAluguelArb,
          (cacambeiroId, quantidade, diasAluguel) => {
            const result = validateAddItemToCart(cacambeiroId, {
              cacambeiro_id: cacambeiroId,
              quantidade,
              dias_aluguel: diasAluguel,
            });
            expect(result.valid).toBe(false);
            expect(result.reasons.length).toBeGreaterThanOrEqual(1);
          },
        ),
        { numRuns: 200 },
      );
    });

    it('should accumulate multiple reasons when multiple constraints are violated', () => {
      fc.assert(
        fc.property(
          twoDifferentUuidsArb,
          invalidQuantidadeArb,
          invalidDiasAluguelArb,
          ([cacambeiroA, cacambeiroB], quantidade, diasAluguel) => {
            const result = validateAddItemToCart(cacambeiroA, {
              cacambeiro_id: cacambeiroB,
              quantidade,
              dias_aluguel: diasAluguel,
            });
            expect(result.valid).toBe(false);
            // Should have at least 3 reasons: cacambeiro mismatch + invalid qty + invalid dias
            expect(result.reasons.length).toBe(3);
          },
        ),
        { numRuns: 200 },
      );
    });

    it('should allow any item to be added to an empty cart if quantity and duration are valid', () => {
      fc.assert(
        fc.property(
          uuidArb,
          validQuantidadeArb,
          validDiasAluguelArb,
          (cacambeiroId, quantidade, diasAluguel) => {
            const result = validateAddItemToCart(null, {
              cacambeiro_id: cacambeiroId,
              quantidade,
              dias_aluguel: diasAluguel,
            });
            expect(result.valid).toBe(true);
            expect(result.reasons).toHaveLength(0);
          },
        ),
        { numRuns: 200 },
      );
    });
  });
});
