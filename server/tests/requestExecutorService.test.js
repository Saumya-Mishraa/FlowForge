const { buildAxiosConfig } = require('../src/services/requestExecutorService');

describe('requestExecutorService.buildAxiosConfig', () => {
  const variables = { BASE_URL: 'https://api.example.com', TOKEN: 'abc123' };

  it('resolves variables in the URL', () => {
    const config = buildAxiosConfig({ method: 'GET', url: '{{BASE_URL}}/users' }, variables);
    expect(config.url).toBe('https://api.example.com/users');
  });

  it('merges enabled query params and skips disabled ones', () => {
    const config = buildAxiosConfig(
      {
        method: 'GET',
        url: '{{BASE_URL}}/users',
        params: [
          { key: 'active', value: 'true', enabled: true },
          { key: 'skip_me', value: 'x', enabled: false },
        ],
      },
      variables
    );
    expect(config.url).toBe('https://api.example.com/users?active=true');
  });

  it('applies bearer auth with variable substitution', () => {
    const config = buildAxiosConfig(
      { method: 'GET', url: '{{BASE_URL}}', auth: { type: 'bearer', bearerToken: '{{TOKEN}}' } },
      variables
    );
    expect(config.headers.Authorization).toBe('Bearer abc123');
  });

  it('applies basic auth as a base64-encoded header', () => {
    const config = buildAxiosConfig(
      { method: 'GET', url: '{{BASE_URL}}', auth: { type: 'basic', basicUsername: 'u', basicPassword: 'p' } },
      variables
    );
    expect(config.headers.Authorization).toBe(`Basic ${Buffer.from('u:p').toString('base64')}`);
  });

  it('applies an API key to the query string when configured for query placement', () => {
    const config = buildAxiosConfig(
      {
        method: 'GET',
        url: '{{BASE_URL}}',
        auth: { type: 'apiKey', apiKeyName: 'key', apiKeyValue: '{{TOKEN}}', apiKeyIn: 'query' },
      },
      variables
    );
    expect(config.url).toContain('key=abc123');
  });

  it('parses a JSON body and sets the content type', () => {
    const config = buildAxiosConfig(
      { method: 'POST', url: '{{BASE_URL}}', body: { mode: 'json', json: '{"name":"{{TOKEN}}"}' } },
      variables
    );
    expect(config.data).toEqual({ name: 'abc123' });
    expect(config.headers['Content-Type']).toBe('application/json');
  });

  it('falls back to raw text if the JSON body is invalid, instead of dropping it', () => {
    const config = buildAxiosConfig(
      { method: 'POST', url: '{{BASE_URL}}', body: { mode: 'json', json: 'not json' } },
      variables
    );
    expect(config.data).toBe('not json');
  });

  it('serializes urlencoded bodies', () => {
    const config = buildAxiosConfig(
      {
        method: 'POST',
        url: '{{BASE_URL}}',
        body: { mode: 'urlencoded', urlencoded: [{ key: 'a', value: '1', enabled: true }] },
      },
      variables
    );
    expect(config.data).toBe('a=1');
    expect(config.headers['Content-Type']).toBe('application/x-www-form-urlencoded');
  });
});
