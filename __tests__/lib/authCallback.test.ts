import { parseAuthTokens } from '@/lib/authCallback';

describe('parseAuthTokens', () => {
  it('extracts tokens from a URL fragment', () => {
    const url =
      'lumio://auth/reset-password#access_token=abc123&refresh_token=def456&expires_in=3600&token_type=bearer&type=recovery';
    expect(parseAuthTokens(url)).toEqual({
      access_token: 'abc123',
      refresh_token: 'def456',
    });
  });

  it('extracts tokens when params are in the query string instead', () => {
    const url = 'lumio://auth/reset-password?access_token=abc123&refresh_token=def456';
    expect(parseAuthTokens(url)).toEqual({
      access_token: 'abc123',
      refresh_token: 'def456',
    });
  });

  it('returns null when tokens are missing', () => {
    expect(parseAuthTokens('lumio://auth/reset-password#type=recovery')).toBeNull();
  });

  it('returns null for an unparseable URL', () => {
    expect(parseAuthTokens('not a url')).toBeNull();
  });
});
