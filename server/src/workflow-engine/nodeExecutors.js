const { getByPath } = require('./pathUtils');
const { resolveToken, evaluateCondition } = require('./conditionEvaluator');
const { resolveString } = require('../services/environmentService');
const { executeRequest } = require('../services/requestExecutorService');

const MAX_DELAY_MS = 60000;

function baseResult(node) {
  return {
    nodeId: node.id,
    nodeType: node.type,
    label: node.data?.label || '',
    status: 'running',
    startedAt: new Date(),
  };
}

function finish(result, patch) {
  result.finishedAt = new Date();
  result.durationMs = result.finishedAt - result.startedAt;
  Object.assign(result, patch);
  return result;
}

// Executes exactly one node and returns its recorded result. Mutates
// `context.variables` and `context.lastResponse` directly — the engine
// (full run) and the debug-session service both drive this same function so
// "run" and "step through in Debug Mode" can never behave differently.
async function executeNode(node, context) {
  const result = baseResult(node);

  try {
    switch (node.type) {
      case 'start':
        return finish(result, { status: 'success', output: null });

      case 'end':
        return finish(result, { status: 'success', output: null });

      case 'apiRequest': {
        const data = node.data || {};
        const requestDef = {
          method: data.method || 'GET',
          url: data.url || '',
          params: data.params || [],
          headers: data.headers || [],
          auth: data.auth || { type: 'none' },
          body: data.body || { mode: 'none' },
        };
        const response = await executeRequest(requestDef, context.variables);
        context.lastResponse = { status: response.status, headers: response.headers, body: response.data };

        return finish(result, {
          status: response.ok ? 'success' : 'failed',
          request: { method: requestDef.method, url: resolveString(requestDef.url, context.variables) },
          response: {
            status: response.status,
            statusText: response.statusText,
            headers: response.headers,
            body: response.data,
          },
          output: { status: response.status, ok: response.ok },
          error: response.ok ? '' : response.errorMessage || `Request failed with status ${response.status}`,
        });
      }

      case 'variable': {
        const assignments = node.data?.assignments || [];
        const applied = {};
        for (const { key, value } of assignments) {
          if (!key) continue;
          const resolved = resolveString(String(value ?? ''), context.variables);
          context.variables[key] = resolved;
          applied[key] = resolved;
        }
        return finish(result, { status: 'success', output: applied });
      }

      case 'extractVariable': {
        const { path, as } = node.data || {};
        const scope = {
          statusCode: context.lastResponse?.status,
          response: context.lastResponse?.body,
          variables: context.variables,
        };
        const value =
          path.startsWith('response.') || path === 'statusCode'
            ? resolveToken(path, scope)
            : getByPath(context.lastResponse, path);

        if (value === undefined) {
          return finish(result, { status: 'failed', error: `Could not find "${path}" in the last response` });
        }
        const stored = typeof value === 'object' && value !== null ? JSON.stringify(value) : String(value);
        context.variables[as] = stored;
        return finish(result, { status: 'success', output: { [as]: stored } });
      }

      case 'condition': {
        const scope = {
          statusCode: context.lastResponse?.status,
          response: context.lastResponse?.body,
          variables: context.variables,
        };
        const conditionResult = evaluateCondition(node.data?.expression, scope);
        return finish(result, {
          status: 'success',
          output: { expression: node.data?.expression, result: conditionResult },
        });
      }

      case 'transform': {
        const { source, operation, output } = node.data || {};
        const scope = {
          statusCode: context.lastResponse?.status,
          response: context.lastResponse?.body,
          variables: context.variables,
        };
        const inputValue = resolveToken(source, scope);
        const transformed = applyTransform(operation, inputValue);
        context.variables[output] = typeof transformed === 'object' ? JSON.stringify(transformed) : String(transformed);
        return finish(result, { status: 'success', output: { [output]: context.variables[output] } });
      }

      case 'delay': {
        const ms = Math.min(Math.max(node.data?.ms || 0, 0), MAX_DELAY_MS);
        await new Promise((resolve) => setTimeout(resolve, ms));
        return finish(result, { status: 'success', output: { waitedMs: ms } });
      }

      case 'log': {
        const message = resolveString(node.data?.message || '', context.variables);
        return finish(result, { status: 'success', output: { message } });
      }

      default:
        return finish(result, { status: 'failed', error: `Unknown node type "${node.type}"` });
    }
  } catch (err) {
    return finish(result, { status: 'failed', error: err.message });
  }
}

function applyTransform(operation, value) {
  switch (operation) {
    case 'toUpperCase':
      return String(value ?? '').toUpperCase();
    case 'toLowerCase':
      return String(value ?? '').toLowerCase();
    case 'trim':
      return String(value ?? '').trim();
    case 'toNumber':
      return Number(value);
    case 'toString':
      return String(value ?? '');
    case 'jsonStringify':
      return JSON.stringify(value);
    case 'jsonParse':
      return typeof value === 'string' ? JSON.parse(value) : value;
    case 'length':
      return value?.length ?? 0;
    default:
      throw new Error(`Unknown transform operation "${operation}"`);
  }
}

module.exports = { executeNode };
