const { evaluateCondition, validateConditionSyntax } = require('../src/workflow-engine/conditionEvaluator');

describe('conditionEvaluator.evaluateCondition', () => {
  const scope = {
    statusCode: 200,
    response: { user: { active: true, name: 'Ada' }, token: 'abc123' },
    variables: { userId: '42', role: 'admin' },
  };

  it('evaluates statusCode == 200', () => {
    expect(evaluateCondition('statusCode == 200', scope)).toBe(true);
    expect(evaluateCondition('statusCode == 404', scope)).toBe(false);
  });

  it('evaluates a nested response path against a boolean literal', () => {
    expect(evaluateCondition('response.user.active == true', scope)).toBe(true);
  });

  it('evaluates a nested response path against a string literal', () => {
    expect(evaluateCondition("response.user.name == 'Ada'", scope)).toBe(true);
    expect(evaluateCondition("response.user.name == 'Bob'", scope)).toBe(false);
  });

  it('evaluates "exists" against a workflow variable', () => {
    expect(evaluateCondition('userId exists', scope)).toBe(true);
    expect(evaluateCondition('missingVar exists', scope)).toBe(false);
  });

  it('evaluates "not exists"', () => {
    expect(evaluateCondition('missingVar not exists', scope)).toBe(true);
    expect(evaluateCondition('userId not exists', scope)).toBe(false);
  });

  it('evaluates numeric comparisons', () => {
    expect(evaluateCondition('statusCode > 100', scope)).toBe(true);
    expect(evaluateCondition('statusCode < 100', scope)).toBe(false);
    expect(evaluateCondition('statusCode >= 200', scope)).toBe(true);
    expect(evaluateCondition('statusCode <= 199', scope)).toBe(false);
  });

  it('evaluates != correctly', () => {
    expect(evaluateCondition('statusCode != 404', scope)).toBe(true);
  });

  it('compares two workflow variables against each other', () => {
    expect(evaluateCondition("role == 'admin'", scope)).toBe(true);
  });

  it('throws for a genuinely unparseable expression', () => {
    expect(() => evaluateCondition('this is nonsense !!', scope)).toThrow(/Unrecognized condition/);
  });

  it('throws for an empty expression', () => {
    expect(() => evaluateCondition('', scope)).toThrow(/empty/);
  });
});

describe('conditionEvaluator.validateConditionSyntax', () => {
  it('accepts well-formed expressions without needing real data', () => {
    expect(validateConditionSyntax('statusCode == 200')).toBeNull();
    expect(validateConditionSyntax('userId exists')).toBeNull();
    expect(validateConditionSyntax('response.user.active == true')).toBeNull();
  });

  it('rejects empty or garbage expressions', () => {
    expect(validateConditionSyntax('')).toMatch(/empty/);
    expect(validateConditionSyntax('   ')).toMatch(/empty/);
    expect(validateConditionSyntax('not a real condition !!')).toMatch(/Unrecognized/);
  });
});
