const { buildAxiosConfig } = require('../src/services/requestExecutorService');

describe('requestExecutorService redirect guard (beforeRedirect)', () => {
  const variables = {};

  function getGuard() {
    const config = buildAxiosConfig({ method: 'GET', url: 'https://example.com' }, variables);
    return config.beforeRedirect;
  }

  it('is attached when private-network blocking is enabled', () => {
    expect(typeof getGuard()).toBe('function');
  });

  it('throws synchronously for a redirect to a private IPv4 literal', () => {
    const guard = getGuard();
    expect(() => guard({ hostname: '169.254.169.254', protocol: 'http:', path: '/' })).toThrow(
      /private\/internal network/
    );
  });

  it('throws synchronously for a redirect to "localhost"', () => {
    const guard = getGuard();
    expect(() => guard({ hostname: 'localhost', protocol: 'http:', path: '/' })).toThrow(/localhost/);
  });

  it('does not throw for a redirect to a public IP literal', () => {
    const guard = getGuard();
    expect(() => guard({ hostname: '8.8.8.8', protocol: 'https:', path: '/' })).not.toThrow();
  });

  it('does not throw for a redirect to an ordinary public hostname', () => {
    // Documented limitation: hostname-based redirect targets aren't
    // re-resolved via DNS in this synchronous hook, only IP literals and
    // "localhost"/".local" are checked. This test pins that documented
    // behavior so a future change doesn't silently alter it.
    const guard = getGuard();
    expect(() => guard({ hostname: 'example.com', protocol: 'https:', path: '/' })).not.toThrow();
  });
});
