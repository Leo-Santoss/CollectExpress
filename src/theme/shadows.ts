export const shadows = {
  soft: {
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 3,
  },
  medium: {
    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.12)',
    elevation: 6,
  },
  hard: {
    boxShadow: '0px 6px 16px rgba(0, 0, 0, 0.16)',
    elevation: 10,
  },
} as const;

export type Shadows = typeof shadows;
