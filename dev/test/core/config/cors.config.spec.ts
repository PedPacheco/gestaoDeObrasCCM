import { getAllowedOrigins } from 'src/core/config/cors.config';
import { afterEach, describe, expect, it, vi } from 'vitest';

describe('getAllowedOrigins', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('uses CORS_ORIGINS when it is configured', () => {
    expect(
      getAllowedOrigins({
        CORS_ORIGINS: 'https://app.example.com,https://admin.example.com',
        CORS_ORIGIN: 'https://legacy.example.com',
      }),
    ).toEqual(['https://app.example.com', 'https://admin.example.com']);
  });

  it('trims whitespace around each origin', () => {
    expect(
      getAllowedOrigins({
        CORS_ORIGINS: '  https://app.example.com , https://admin.example.com  ',
      }),
    ).toEqual(['https://app.example.com', 'https://admin.example.com']);
  });

  it('filters out empty entries', () => {
    expect(
      getAllowedOrigins({
        CORS_ORIGINS: ',https://app.example.com,, ,https://admin.example.com,',
      }),
    ).toEqual(['https://app.example.com', 'https://admin.example.com']);
  });

  it('falls back to CORS_ORIGIN when CORS_ORIGINS is undefined', () => {
    expect(
      getAllowedOrigins({ CORS_ORIGIN: 'https://legacy.example.com' }),
    ).toEqual(['https://legacy.example.com']);
  });

  it('does not fall back when CORS_ORIGINS is an empty string', () => {
    expect(
      getAllowedOrigins({
        CORS_ORIGINS: '',
        CORS_ORIGIN: 'https://legacy.example.com',
      }),
    ).toEqual([]);
  });

  it('returns an empty array when neither variable is configured', () => {
    expect(getAllowedOrigins({})).toEqual([]);
  });

  it('uses process.env by default', () => {
    vi.stubEnv(
      'CORS_ORIGINS',
      'https://app.example.com, https://admin.example.com',
    );
    vi.stubEnv('CORS_ORIGIN', 'https://legacy.example.com');

    expect(getAllowedOrigins()).toEqual([
      'https://app.example.com',
      'https://admin.example.com',
    ]);
  });
});
