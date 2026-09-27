const { getByPath } = require('./pathUtils');

// Resolves a bare token used on either side of a condition to a value from
// the execution scope. Recognizes three forms:
//   - "statusCode"        -> scope.statusCode (the last API response's HTTP status)
//   - "response.<path>"   -> a path into the last API response's body
//   - anything else       -> a workflow variable by name, or a dot-path into
//                            the variables object if the bare name isn't found
function resolveToken(token, scope) {
  if (token === 'statusCode') return scope.statusCode;
  if (token === 'response') return scope.response;
  if (token.startsWith('response.')) return getByPath(scope.response, token.slice('response.'.length));
  if (Object.prototype.hasOwnProperty.call(scope.variables, token)) return scope.variables[token];
  return getByPath(scope.variables, token);
}

function resolveLiteralOrToken(token, scope) {
  const t = token.trim();
  if (/^'.*'$/.test(t) || /^".*"$/.test(t)) return t.slice(1, -1);
  if (t === 'true') return true;
  if (t === 'false') return false;
  if (t === 'null') return null;
  if (/^-?\d+(\.\d+)?$/.test(t)) return Number(t);
  return resolveToken(t, scope);
}

function looseEqual(a, b) {
  if (a === b) return true;
  if (a === undefined || a === null || b === undefined || b === null) return false;
  return String(a) === String(b);
}

const EXISTS_PATTERN = /^(.+?)\s+(not\s+)?exists$/i;
const COMPARISON_PATTERN = /^(.+?)\s*(==|!=|>=|<=|>|<)\s*(.+)$/;

// Throws only for genuinely unparseable expressions — used both at
// validation time (with an empty scope) and at execution time (with the
// real scope).
function evaluateCondition(expression, scope) {
  const trimmed = String(expression || '').trim();
  if (!trimmed) throw new Error('Condition expression is empty');

  const existsMatch = trimmed.match(EXISTS_PATTERN);
  if (existsMatch) {
    const [, pathExpr, notFlag] = existsMatch;
    const value = resolveToken(pathExpr.trim(), scope);
    const exists = value !== undefined && value !== null;
    return notFlag ? !exists : exists;
  }

  const comparisonMatch = trimmed.match(COMPARISON_PATTERN);
  if (comparisonMatch) {
    const [, leftRaw, op, rightRaw] = comparisonMatch;
    const left = resolveToken(leftRaw.trim(), scope);
    const right = resolveLiteralOrToken(rightRaw.trim(), scope);

    switch (op) {
      case '==':
        return looseEqual(left, right);
      case '!=':
        return !looseEqual(left, right);
      case '>':
        return Number(left) > Number(right);
      case '<':
        return Number(left) < Number(right);
      case '>=':
        return Number(left) >= Number(right);
      case '<=':
        return Number(left) <= Number(right);
      default:
        throw new Error(`Unsupported operator: ${op}`);
    }
  }

  throw new Error(
    `Unrecognized condition expression: "${expression}". Use "<field> == value", "<field> exists", or similar.`
  );
}

// Validates only that the expression is syntactically one of the supported
// shapes — does not require real data, so it's safe to call at workflow-save
// time before anything has ever executed.
function validateConditionSyntax(expression) {
  const trimmed = String(expression || '').trim();
  if (!trimmed) return 'Condition expression cannot be empty';
  if (EXISTS_PATTERN.test(trimmed) || COMPARISON_PATTERN.test(trimmed)) return null;
  return `Unrecognized condition expression: "${expression}"`;
}

module.exports = { evaluateCondition, validateConditionSyntax, resolveToken };
