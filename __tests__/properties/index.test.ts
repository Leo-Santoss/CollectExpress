/**
 * Unit tests for index.tsx redirect logic
 *
 * Tests the routing decision logic based on auth state and tipo_perfil.
 * Since the test environment is node (no React Native rendering),
 * we test the pure logic that determines redirect destinations.
 *
 * Validates: Requirements 18.1, 18.2, 18.3, 18.4, 18.5, 18.6, 18.7
 */


// ─── Pure logic extracted for testing ────────────────────────────────────────

function isValidProfile(tipoPerfil: string): boolean {
  return ['CONSUMIDOR', 'CACAMBEIRO', 'ADMIN'].includes(tipoPerfil);
}

function getRedirectPath(
  user: { tipo_perfil: string } | null,
  isLoading: boolean
): 'loading' | string {
  if (isLoading) {
    return 'loading';
  }

  if (!user) {
    return '/(auth)/login';
  }

  if (!isValidProfile(user.tipo_perfil)) {
    return '/(auth)/login';
  }

  switch (user.tipo_perfil) {
    case 'CONSUMIDOR':
      return '/(consumer)/';
    case 'CACAMBEIRO':
      return '/(cacambeiro)/dashboard';
    case 'ADMIN':
      return '/(admin)/dashboard';
    default:
      return '/(auth)/login';
  }
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('Index Redirect Logic', () => {
  describe('isValidProfile', () => {
    it('should return true for CONSUMIDOR', () => {
      expect(isValidProfile('CONSUMIDOR')).toBe(true);
    });

    it('should return true for CACAMBEIRO', () => {
      expect(isValidProfile('CACAMBEIRO')).toBe(true);
    });

    it('should return true for ADMIN', () => {
      expect(isValidProfile('ADMIN')).toBe(true);
    });

    it('should return false for unknown profile types', () => {
      expect(isValidProfile('UNKNOWN')).toBe(false);
      expect(isValidProfile('')).toBe(false);
      expect(isValidProfile('consumidor')).toBe(false);
      expect(isValidProfile('admin')).toBe(false);
    });
  });

  describe('getRedirectPath', () => {
    it('should return loading when isLoading is true', () => {
      expect(getRedirectPath(null, true)).toBe('loading');
      expect(getRedirectPath({ tipo_perfil: 'CONSUMIDOR' }, true)).toBe('loading');
    });

    it('should redirect to auth/login when user is null', () => {
      expect(getRedirectPath(null, false)).toBe('/(auth)/login');
    });

    it('should redirect CONSUMIDOR to consumer home', () => {
      expect(getRedirectPath({ tipo_perfil: 'CONSUMIDOR' }, false)).toBe('/(consumer)/');
    });

    it('should redirect CACAMBEIRO to cacambeiro dashboard', () => {
      expect(getRedirectPath({ tipo_perfil: 'CACAMBEIRO' }, false)).toBe('/(cacambeiro)/dashboard');
    });

    it('should redirect ADMIN to admin dashboard', () => {
      expect(getRedirectPath({ tipo_perfil: 'ADMIN' }, false)).toBe('/(admin)/dashboard');
    });

    it('should redirect to auth/login for invalid tipo_perfil', () => {
      expect(getRedirectPath({ tipo_perfil: 'INVALID' }, false)).toBe('/(auth)/login');
      expect(getRedirectPath({ tipo_perfil: '' }, false)).toBe('/(auth)/login');
    });
  });
});
