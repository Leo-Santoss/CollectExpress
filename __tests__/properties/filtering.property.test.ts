/**
 * Property-Based Tests for Marketplace Filtering Logic (Frontend)
 *
 * Property 11: Marketplace filtering returns only matching results
 *
 * Tests the filtering logic as a pure function:
 * - Filter AND logic (all active filters must be satisfied simultaneously)
 * - Case-insensitive search matching on nome
 * - Only available (disponivel=true) dumpsters are returned
 *
 * **Validates: Requirements 4.2, 4.3**
 */

import * as fc from 'fast-check';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Cacamba {
  id: string;
  nome: string;
  tipo_residuo: string;
  cacambeiro_id: string;
  disponivel: boolean;
  preco_diaria: number;
  tamanho_m3: number;
}

interface Filters {
  tipo_residuo?: string;
  cacambeiro_id?: string;
  search?: string;
}

// ─── Pure Filtering Function (extracted from marketplace logic) ───────────────

/**
 * Filters a list of cacambas based on the provided filters.
 * Implements AND logic: all active filters must be satisfied.
 *
 * Rules:
 * - Only disponivel=true items are returned
 * - tipo_residuo: exact match when filter is active
 * - cacambeiro_id: exact match when filter is active
 * - search: case-insensitive substring match on nome (only applied if 3+ chars)
 */
function filterCacambas(cacambas: Cacamba[], filters: Filters): Cacamba[] {
  return cacambas.filter((c) => {
    // Must be available
    if (!c.disponivel) return false;

    // tipo_residuo filter (exact match)
    if (filters.tipo_residuo && c.tipo_residuo !== filters.tipo_residuo) return false;

    // cacambeiro filter (exact match)
    if (filters.cacambeiro_id && c.cacambeiro_id !== filters.cacambeiro_id) return false;

    // search filter (case-insensitive, min 3 chars, matches nome)
    if (filters.search && filters.search.length >= 3) {
      const searchLower = filters.search.toLowerCase();
      if (!c.nome.toLowerCase().includes(searchLower)) return false;
    }

    return true;
  });
}

// ─── Generators ──────────────────────────────────────────────────────────────

const tiposResiduoOptions = ['entulho', 'madeira', 'metal', 'plastico', 'organico', 'misto'];

/** Generates a tipo_residuo value */
const tipoResiduoArb = fc.constantFrom(...tiposResiduoOptions);

/** Generates a valid UUID-like string for IDs */
const uuidArb = fc.uuid();

/** Generates a non-empty nome string */
const nomeArb = fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length > 0);

/** Generates a valid Cacamba object */
const cacambaArb = fc.record({
  id: uuidArb,
  nome: nomeArb,
  tipo_residuo: tipoResiduoArb,
  cacambeiro_id: uuidArb,
  disponivel: fc.boolean(),
  preco_diaria: fc.double({ min: 50, max: 500, noNaN: true }),
  tamanho_m3: fc.constantFrom(3, 5, 7, 10, 12, 15),
});

/** Generates a list of cacambas */
const cacambasListArb = fc.array(cacambaArb, { minLength: 0, maxLength: 30 });

/** Generates a search string with at least 3 characters */
const validSearchArb = fc.string({ minLength: 3, maxLength: 20 }).filter((s) => s.trim().length >= 3);

/** Generates a short search string (< 3 chars) that should NOT trigger search filtering */
const shortSearchArb = fc.string({ minLength: 0, maxLength: 2 });

/** Generates a Filters object with random active filters */
const filtersArb = fc.record({
  tipo_residuo: fc.option(tipoResiduoArb, { nil: undefined }),
  cacambeiro_id: fc.option(uuidArb, { nil: undefined }),
  search: fc.option(validSearchArb, { nil: undefined }),
});

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('Property 11: Marketplace filtering returns only matching results', () => {
  describe('disponivel constraint', () => {
    it('all returned items have disponivel=true', () => {
      fc.assert(
        fc.property(cacambasListArb, filtersArb, (cacambas, filters) => {
          const results = filterCacambas(cacambas, filters);

          for (const item of results) {
            expect(item.disponivel).toBe(true);
          }
        }),
        { numRuns: 200 },
      );
    });

    it('unavailable items are never returned regardless of other filters', () => {
      fc.assert(
        fc.property(cacambasListArb, filtersArb, (cacambas, filters) => {
          const results = filterCacambas(cacambas, filters);
          const unavailableIds = new Set(
            cacambas.filter((c) => !c.disponivel).map((c) => c.id),
          );

          for (const item of results) {
            expect(unavailableIds.has(item.id)).toBe(false);
          }
        }),
        { numRuns: 200 },
      );
    });
  });

  describe('tipo_residuo filter', () => {
    it('when tipo_residuo filter is active, all returned items match that tipo_residuo', () => {
      fc.assert(
        fc.property(cacambasListArb, tipoResiduoArb, (cacambas, tipoFiltro) => {
          const filters: Filters = { tipo_residuo: tipoFiltro };
          const results = filterCacambas(cacambas, filters);

          for (const item of results) {
            expect(item.tipo_residuo).toBe(tipoFiltro);
          }
        }),
        { numRuns: 200 },
      );
    });

    it('without tipo_residuo filter, items of any tipo_residuo can appear', () => {
      fc.assert(
        fc.property(cacambasListArb, (cacambas) => {
          const filters: Filters = {};
          const results = filterCacambas(cacambas, filters);

          // Results should include all available items (no tipo_residuo restriction)
          const allAvailable = cacambas.filter((c) => c.disponivel);
          expect(results.length).toBe(allAvailable.length);
        }),
        { numRuns: 200 },
      );
    });
  });

  describe('cacambeiro_id filter', () => {
    it('when cacambeiro_id filter is active, all returned items match that cacambeiro_id', () => {
      fc.assert(
        fc.property(cacambasListArb, uuidArb, (cacambas, cacambeiroFiltro) => {
          const filters: Filters = { cacambeiro_id: cacambeiroFiltro };
          const results = filterCacambas(cacambas, filters);

          for (const item of results) {
            expect(item.cacambeiro_id).toBe(cacambeiroFiltro);
          }
        }),
        { numRuns: 200 },
      );
    });
  });

  describe('search filter (case-insensitive)', () => {
    it('when search is active (3+ chars), all returned items have nome containing the search text case-insensitively', () => {
      fc.assert(
        fc.property(cacambasListArb, validSearchArb, (cacambas, searchText) => {
          const filters: Filters = { search: searchText };
          const results = filterCacambas(cacambas, filters);

          for (const item of results) {
            expect(item.nome.toLowerCase()).toContain(searchText.toLowerCase());
          }
        }),
        { numRuns: 200 },
      );
    });

    it('search is case-insensitive: uppercase and lowercase produce the same results', () => {
      fc.assert(
        fc.property(
          cacambasListArb,
          validSearchArb,
          (cacambas, searchText) => {
            const resultsLower = filterCacambas(cacambas, { search: searchText.toLowerCase() });
            const resultsUpper = filterCacambas(cacambas, { search: searchText.toUpperCase() });

            // Same items should be returned regardless of search case
            const idsLower = resultsLower.map((r) => r.id).sort();
            const idsUpper = resultsUpper.map((r) => r.id).sort();
            expect(idsLower).toEqual(idsUpper);
          },
        ),
        { numRuns: 200 },
      );
    });

    it('empty search (< 3 chars) does not filter by name', () => {
      fc.assert(
        fc.property(cacambasListArb, shortSearchArb, (cacambas, shortSearch) => {
          const resultsWithSearch = filterCacambas(cacambas, { search: shortSearch });
          const resultsWithoutSearch = filterCacambas(cacambas, {});

          // Short search should produce the same results as no search
          expect(resultsWithSearch.length).toBe(resultsWithoutSearch.length);
          const idsWithSearch = resultsWithSearch.map((r) => r.id).sort();
          const idsWithout = resultsWithoutSearch.map((r) => r.id).sort();
          expect(idsWithSearch).toEqual(idsWithout);
        }),
        { numRuns: 200 },
      );
    });

    it('items whose nome contains the search substring are included in results', () => {
      fc.assert(
        fc.property(
          cacambaArb,
          fc.string({ minLength: 3, maxLength: 8 }),
          (baseCacamba, searchText) => {
            // Create a cacamba whose nome contains the search text
            const matchingCacamba: Cacamba = {
              ...baseCacamba,
              nome: `prefix${searchText}suffix`,
              disponivel: true,
            };

            const results = filterCacambas([matchingCacamba], { search: searchText });
            expect(results.length).toBe(1);
            expect(results[0].id).toBe(matchingCacamba.id);
          },
        ),
        { numRuns: 200 },
      );
    });
  });

  describe('AND logic: multiple filters combined', () => {
    it('when multiple filters are active, all conditions must be satisfied simultaneously', () => {
      fc.assert(
        fc.property(
          cacambasListArb,
          tipoResiduoArb,
          uuidArb,
          validSearchArb,
          (cacambas, tipo, cacambeiroId, searchText) => {
            const filters: Filters = {
              tipo_residuo: tipo,
              cacambeiro_id: cacambeiroId,
              search: searchText,
            };
            const results = filterCacambas(cacambas, filters);

            for (const item of results) {
              // ALL conditions must hold simultaneously
              expect(item.disponivel).toBe(true);
              expect(item.tipo_residuo).toBe(tipo);
              expect(item.cacambeiro_id).toBe(cacambeiroId);
              expect(item.nome.toLowerCase()).toContain(searchText.toLowerCase());
            }
          },
        ),
        { numRuns: 200 },
      );
    });

    it('adding more filters can only reduce or maintain the result count (monotonicity)', () => {
      fc.assert(
        fc.property(
          cacambasListArb,
          tipoResiduoArb,
          uuidArb,
          (cacambas, tipo, cacambeiroId) => {
            const noFilters = filterCacambas(cacambas, {});
            const withTipo = filterCacambas(cacambas, { tipo_residuo: tipo });
            const withBoth = filterCacambas(cacambas, {
              tipo_residuo: tipo,
              cacambeiro_id: cacambeiroId,
            });

            // More filters → fewer or equal results
            expect(withTipo.length).toBeLessThanOrEqual(noFilters.length);
            expect(withBoth.length).toBeLessThanOrEqual(withTipo.length);
          },
        ),
        { numRuns: 200 },
      );
    });

    it('result set with combined filters is a subset of each individual filter result', () => {
      fc.assert(
        fc.property(
          cacambasListArb,
          tipoResiduoArb,
          uuidArb,
          (cacambas, tipo, cacambeiroId) => {
            const withTipo = filterCacambas(cacambas, { tipo_residuo: tipo });
            const withCacambeiro = filterCacambas(cacambas, { cacambeiro_id: cacambeiroId });
            const withBoth = filterCacambas(cacambas, {
              tipo_residuo: tipo,
              cacambeiro_id: cacambeiroId,
            });

            const tipoIds = new Set(withTipo.map((r) => r.id));
            const cacambeiroIds = new Set(withCacambeiro.map((r) => r.id));

            // Combined result must be a subset of each individual filter
            for (const item of withBoth) {
              expect(tipoIds.has(item.id)).toBe(true);
              expect(cacambeiroIds.has(item.id)).toBe(true);
            }
          },
        ),
        { numRuns: 200 },
      );
    });
  });

  describe('completeness: no valid items are excluded', () => {
    it('all available items matching all filters are included in results', () => {
      fc.assert(
        fc.property(
          cacambasListArb,
          tipoResiduoArb,
          uuidArb,
          (cacambas, tipo, cacambeiroId) => {
            const filters: Filters = { tipo_residuo: tipo, cacambeiro_id: cacambeiroId };
            const results = filterCacambas(cacambas, filters);
            const resultIds = new Set(results.map((r) => r.id));

            // Every item that matches all criteria should be in the results
            for (const c of cacambas) {
              if (c.disponivel && c.tipo_residuo === tipo && c.cacambeiro_id === cacambeiroId) {
                expect(resultIds.has(c.id)).toBe(true);
              }
            }
          },
        ),
        { numRuns: 200 },
      );
    });
  });
});
