const { getByPath, setByPath } = require('../src/workflow-engine/pathUtils');

describe('pathUtils.getByPath', () => {
  const obj = { user: { name: 'Ada', roles: ['admin', 'editor'] }, token: 'abc' };

  it('resolves a simple top-level key', () => {
    expect(getByPath(obj, 'token')).toBe('abc');
  });

  it('resolves a nested key', () => {
    expect(getByPath(obj, 'user.name')).toBe('Ada');
  });

  it('resolves an array index with bracket notation', () => {
    expect(getByPath(obj, 'user.roles[0]')).toBe('admin');
    expect(getByPath(obj, 'user.roles[1]')).toBe('editor');
  });

  it('returns undefined for a missing path instead of throwing', () => {
    expect(getByPath(obj, 'user.missing.deeper')).toBeUndefined();
    expect(getByPath(obj, 'nothing')).toBeUndefined();
  });

  it('returns undefined for a null/undefined root object', () => {
    expect(getByPath(null, 'a.b')).toBeUndefined();
    expect(getByPath(undefined, 'a.b')).toBeUndefined();
  });
});

describe('pathUtils.setByPath', () => {
  it('sets a nested value, creating intermediate objects as needed', () => {
    const obj = {};
    setByPath(obj, 'a.b.c', 42);
    expect(obj).toEqual({ a: { b: { c: 42 } } });
  });

  it('overwrites an existing value', () => {
    const obj = { a: { b: 1 } };
    setByPath(obj, 'a.b', 2);
    expect(obj.a.b).toBe(2);
  });
});
