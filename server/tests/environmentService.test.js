const { resolveString, findUnresolvedVariables } = require('../src/services/environmentService');

describe('environmentService.resolveString', () => {
  const variables = { BASE_URL: 'https://api.example.com', TOKEN: 'secret123' };

  it('replaces a single variable', () => {
    expect(resolveString('{{BASE_URL}}/users', variables)).toBe('https://api.example.com/users');
  });

  it('replaces multiple variables in one string', () => {
    expect(resolveString('{{BASE_URL}}/users?token={{TOKEN}}', variables)).toBe(
      'https://api.example.com/users?token=secret123'
    );
  });

  it('tolerates whitespace inside the braces', () => {
    expect(resolveString('{{ BASE_URL }}', variables)).toBe('https://api.example.com');
  });

  it('leaves unknown variables untouched instead of blanking them', () => {
    expect(resolveString('{{UNKNOWN_VAR}}/path', variables)).toBe('{{UNKNOWN_VAR}}/path');
  });

  it('returns non-string input unchanged', () => {
    expect(resolveString(42, variables)).toBe(42);
    expect(resolveString(undefined, variables)).toBe(undefined);
  });

  it('returns plain strings with no variables unchanged', () => {
    expect(resolveString('https://api.example.com/users', variables)).toBe(
      'https://api.example.com/users'
    );
  });
});

describe('environmentService.findUnresolvedVariables', () => {
  it('finds every variable name referenced in a string', () => {
    expect(findUnresolvedVariables('{{A}} and {{B}} and {{A}}')).toEqual(['A', 'B', 'A']);
  });

  it('returns an empty array when there are none', () => {
    expect(findUnresolvedVariables('no variables here')).toEqual([]);
  });
});
