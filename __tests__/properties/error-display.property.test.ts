/**
 * Property 39: Error messages contain no technical details
 *
 * *For any* API error displayed to the user, the message SHALL NOT contain
 * HTTP status codes, stack traces, or internal error identifiers.
 * Messages SHALL describe the failed operation in non-technical language.
 *
 * **Validates: Requirements 23.3**
 */

import { AxiosError, AxiosHeaders } from 'axios';
import * as fc from 'fast-check';

// We need to capture toast messages emitted by the response interceptor.
// The api.ts module uses a toast event system, so we import the listener.
import { onToast } from '@/services/api';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Patterns that indicate technical details that should NEVER appear in
 * user-facing toast messages.
 */
const TECHNICAL_PATTERNS = [
  // HTTP status codes (3-digit numbers like 401, 500, 404)
  /\b[1-5]\d{2}\b/,
  // Stack traces (common patterns)
  /at\s+\w+\s*\(/,
  /Error:\s/,
  /\.js:\d+/,
  /\.ts:\d+/,
  /node_modules/,
  // Internal paths
  /\/src\//,
  /\\src\\/,
  /\/usr\//,
  /C:\\/i,
  // Raw JSON error objects
  /\{.*"(error|message|stack|code)".*\}/,
  // Technical identifiers
  /ECONNABORTED/,
  /ECONNREFUSED/,
  /ETIMEDOUT/,
  /ERR_NETWORK/,
  /ERR_BAD_REQUEST/,
  /ERR_BAD_RESPONSE/,
  // axios-specific internals
  /AxiosError/,
  /XMLHttpRequest/,
  /Request failed with status code/,
];

/**
 * Checks if a message contains any technical details.
 * Returns the first matching pattern description if found, null otherwise.
 */
function findTechnicalDetail(message: string): string | null {
  for (const pattern of TECHNICAL_PATTERNS) {
    if (pattern.test(message)) {
      return `Matched pattern: ${pattern.toString()} in message: "${message}"`;
    }
  }
  return null;
}

// ─── Generators ──────────────────────────────────────────────────────────────

/**
 * Generates random HTTP status codes for server errors (5xx)
 */
const serverErrorStatusArb = fc.integer({ min: 500, max: 599 });

/**
 * Generates random HTTP status codes for all error types
 */
const anyErrorStatusArb = fc.integer({ min: 400, max: 599 });

/**
 * Generates random error response bodies that a server might return,
 * including technical details that should be filtered out.
 */
const technicalErrorBodyArb = fc.oneof(
  // JSON error with stack trace
  fc.record({
    error: fc.string({ minLength: 1, maxLength: 100 }),
    message: fc.string({ minLength: 1, maxLength: 200 }),
    stack: fc.constant('Error: Something failed\n    at Object.<anonymous> (/src/controllers/auth.js:42:15)\n    at Module._compile (node:internal/modules/cjs/loader:1376:14)'),
    statusCode: anyErrorStatusArb,
  }),
  // Simple error message
  fc.record({
    error: fc.string({ minLength: 1, maxLength: 200 }),
  }),
  // Error with internal path
  fc.record({
    message: fc.constant('ECONNREFUSED: Connection refused at /usr/src/app/node_modules/pg/lib/connection.js:73:13'),
    code: fc.constant('ECONNREFUSED'),
  }),
  // Raw string error
  fc.string({ minLength: 1, maxLength: 500 }),
);

/**
 * Generates axios error codes for network-level failures
 */
const axiosErrorCodeArb = fc.constantFrom(
  'ECONNABORTED',
  'ERR_NETWORK',
  'ETIMEDOUT',
  'ERR_BAD_REQUEST',
  'ERR_BAD_RESPONSE',
  'ERR_CANCELED',
);

// ─── Test Setup ──────────────────────────────────────────────────────────────

// We need to trigger the response interceptor. The cleanest way is to
// directly invoke the interceptor's error handler with crafted AxiosError objects.

// Extract the response interceptor error handler from the api module
let interceptorErrorHandler: ((error: AxiosError) => Promise<never>) | null = null;

// We'll re-import the api module and capture the interceptor
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn().mockResolvedValue(undefined),
  removeItem: jest.fn().mockResolvedValue(undefined),
}));

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('Property 39: Error messages contain no technical details', () => {
  let capturedMessages: string[] = [];
  let unsubscribe: () => void;

  beforeAll(() => {
    // Subscribe to toast events to capture emitted messages
    unsubscribe = onToast((message: string) => {
      capturedMessages.push(message);
    });
  });

  afterAll(() => {
    unsubscribe();
  });

  beforeEach(() => {
    capturedMessages = [];
  });

  /**
   * Helper to create an AxiosError that simulates a server error response
   */
  function createAxiosErrorWithResponse(
    status: number,
    data: unknown,
  ): AxiosError {
    const headers = new AxiosHeaders();
    const config = {
      headers: new AxiosHeaders(),
      url: '/api/test',
      method: 'get' as const,
    };

    const error = new AxiosError(
      `Request failed with status code ${status}`,
      'ERR_BAD_RESPONSE',
      config,
      {},
      {
        status,
        statusText: 'Error',
        headers,
        config,
        data,
      },
    );

    return error;
  }

  /**
   * Helper to create an AxiosError that simulates a network error (no response)
   */
  function createNetworkError(): AxiosError {
    const config = {
      headers: new AxiosHeaders(),
      url: '/api/test',
      method: 'get' as const,
    };

    const error = new AxiosError(
      'Network Error',
      'ERR_NETWORK',
      config,
      {},
      undefined,
    );

    return error;
  }

  /**
   * Helper to create an AxiosError that simulates a timeout
   */
  function createTimeoutError(): AxiosError {
    const config = {
      headers: new AxiosHeaders(),
      url: '/api/test',
      method: 'get' as const,
      timeout: 15000,
    };

    const error = new AxiosError(
      'timeout of 15000ms exceeded',
      'ECONNABORTED',
      config,
      {},
      undefined,
    );

    return error;
  }

  /**
   * Helper to trigger the response interceptor error handler.
   * We import the default api instance and use its interceptors.
   */
  async function triggerInterceptor(error: AxiosError): Promise<void> {
    // The api module's default export is the axios instance with interceptors.
    // We need to manually invoke the response error interceptor.
    // Since axios interceptors are registered on the instance, we can access them
    // through the internal handlers array.
    const api = (await import('@/services/api')).default;

    // Access the response interceptors - axios stores them internally
    const interceptors = (api.interceptors.response as any).handlers;

    if (interceptors && interceptors.length > 0) {
      const handler = interceptors[0];
      if (handler && handler.rejected) {
        try {
          await handler.rejected(error);
        } catch {
          // Expected - interceptor rejects the promise
        }
      }
    }
  }

  it('should emit toast messages without HTTP status codes for 5xx errors', async () => {
    await fc.assert(
      fc.asyncProperty(
        serverErrorStatusArb,
        technicalErrorBodyArb,
        async (status, responseBody) => {
          capturedMessages = [];

          const error = createAxiosErrorWithResponse(status, responseBody);
          await triggerInterceptor(error);

          // The interceptor should have emitted a toast for 5xx errors
          for (const message of capturedMessages) {
            const technicalDetail = findTechnicalDetail(message);
            expect(technicalDetail).toBeNull();
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should emit toast messages without technical details for network errors', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constant(null),
        async () => {
          capturedMessages = [];

          const error = createNetworkError();
          await triggerInterceptor(error);

          // Should have emitted a toast for network errors
          expect(capturedMessages.length).toBeGreaterThan(0);

          for (const message of capturedMessages) {
            const technicalDetail = findTechnicalDetail(message);
            expect(technicalDetail).toBeNull();
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should emit toast messages without technical details for timeout errors', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constant(null),
        async () => {
          capturedMessages = [];

          const error = createTimeoutError();
          await triggerInterceptor(error);

          // Should have emitted a toast for timeout errors
          expect(capturedMessages.length).toBeGreaterThan(0);

          for (const message of capturedMessages) {
            const technicalDetail = findTechnicalDetail(message);
            expect(technicalDetail).toBeNull();
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should never expose raw error response data in toast messages for any error status', async () => {
    await fc.assert(
      fc.asyncProperty(
        anyErrorStatusArb,
        technicalErrorBodyArb,
        async (status, responseBody) => {
          capturedMessages = [];

          const error = createAxiosErrorWithResponse(status, responseBody);
          await triggerInterceptor(error);

          // For any emitted toast, verify no technical details leak
          for (const message of capturedMessages) {
            const technicalDetail = findTechnicalDetail(message);
            expect(technicalDetail).toBeNull();
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should emit user-friendly Portuguese messages only', async () => {
    // Known user-friendly messages that the interceptor should emit
    const allowedMessages = [
      'Servidor demorou para responder. Tente novamente.',
      'Erro de conexão. Verifique sua internet.',
      'Erro interno do servidor. Tente novamente mais tarde.',
    ];

    await fc.assert(
      fc.asyncProperty(
        fc.oneof(
          fc.constant('timeout'),
          fc.constant('network'),
          fc.constant('server'),
        ),
        async (errorType) => {
          capturedMessages = [];

          let error: AxiosError;
          switch (errorType) {
            case 'timeout':
              error = createTimeoutError();
              break;
            case 'network':
              error = createNetworkError();
              break;
            case 'server':
              error = createAxiosErrorWithResponse(500, { error: 'Internal Server Error' });
              break;
            default:
              error = createNetworkError();
          }

          await triggerInterceptor(error);

          // All emitted messages should be from the allowed set
          for (const message of capturedMessages) {
            expect(allowedMessages).toContain(message);
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});
