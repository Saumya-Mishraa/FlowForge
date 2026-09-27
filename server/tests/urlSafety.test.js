const { assertUrlIsSafeToFetch } = require('../src/utils/urlSafety');

describe('urlSafety.assertUrlIsSafeToFetch', () => {
  it('blocks the cloud metadata address', async () => {
    await expect(assertUrlIsSafeToFetch('http://169.254.169.254/latest/meta-data/')).rejects.toThrow(
      /private\/internal network/
    );
  });

  it('blocks loopback addresses', async () => {
    await expect(assertUrlIsSafeToFetch('http://127.0.0.1:8080/admin')).rejects.toThrow(
      /private\/internal network/
    );
  });

  it('blocks RFC1918 private ranges', async () => {
    await expect(assertUrlIsSafeToFetch('http://192.168.1.1/')).rejects.toThrow(/private\/internal network/);
    await expect(assertUrlIsSafeToFetch('http://10.0.0.5/')).rejects.toThrow(/private\/internal network/);
    await expect(assertUrlIsSafeToFetch('http://172.16.0.5/')).rejects.toThrow(/private\/internal network/);
  });

  it('blocks the literal hostname "localhost"', async () => {
    await expect(assertUrlIsSafeToFetch('http://localhost:3000')).rejects.toThrow(/localhost/);
  });

  it('rejects non-http(s) protocols', async () => {
    await expect(assertUrlIsSafeToFetch('ftp://example.com')).rejects.toThrow(/Unsupported protocol/);
  });

  it('rejects malformed URLs', async () => {
    await expect(assertUrlIsSafeToFetch('not a url')).rejects.toThrow(/Invalid URL/);
  });

  it('allows a plain public IPv4 address', async () => {
    await expect(assertUrlIsSafeToFetch('http://8.8.8.8/')).resolves.toBeDefined();
  });
});
