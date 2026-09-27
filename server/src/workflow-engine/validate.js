const { validateConditionSyntax } = require('./conditionEvaluator');

const VALID_TYPES = [
  'start',
  'apiRequest',
  'variable',
  'extractVariable',
  'condition',
  'transform',
  'delay',
  'log',
  'end',
];

function detectCycle(nodes, edges) {
  const adjacency = new Map(nodes.map((n) => [n.id, []]));
  for (const e of edges) {
    if (adjacency.has(e.source)) adjacency.get(e.source).push(e.target);
  }

  const WHITE = 0;
  const GRAY = 1;
  const BLACK = 2;
  const color = new Map(nodes.map((n) => [n.id, WHITE]));

  function visit(id) {
    color.set(id, GRAY);
    for (const next of adjacency.get(id) || []) {
      if (color.get(next) === GRAY) return true;
      if (color.get(next) === WHITE && visit(next)) return true;
    }
    color.set(id, BLACK);
    return false;
  }

  for (const n of nodes) {
    if (color.get(n.id) === WHITE && visit(n.id)) return true;
  }
  return false;
}

// Returns an array of human-readable error strings — empty means the
// workflow is safe to execute. Never throws; callers decide what to do with
// a non-empty list (block execution, show inline errors, etc).
function validateWorkflow(workflow) {
  const errors = [];
  const nodes = workflow.nodes || [];
  const edges = workflow.edges || [];
  const nodeIds = new Set(nodes.map((n) => n.id));

  const starts = nodes.filter((n) => n.type === 'start');
  if (starts.length === 0) errors.push('Workflow is missing a Start node');
  if (starts.length > 1) errors.push('Workflow must have exactly one Start node');

  const ends = nodes.filter((n) => n.type === 'end');
  if (ends.length === 0) errors.push('Workflow is missing an End node');

  for (const n of nodes) {
    if (!VALID_TYPES.includes(n.type)) {
      errors.push(`Node "${n.id}" has an unknown type "${n.type}"`);
    }
  }

  for (const e of edges) {
    if (!nodeIds.has(e.source)) errors.push(`Edge "${e.id}" references a missing source node`);
    if (!nodeIds.has(e.target)) errors.push(`Edge "${e.id}" references a missing target node`);
  }

  for (const n of nodes) {
    const data = n.data || {};
    switch (n.type) {
      case 'apiRequest':
        if (!data.url || !String(data.url).trim()) {
          errors.push(`API Request node "${n.id}" is missing a URL`);
        }
        if (!data.method) {
          errors.push(`API Request node "${n.id}" is missing an HTTP method`);
        }
        break;
      case 'condition': {
        const syntaxError = validateConditionSyntax(data.expression);
        if (syntaxError) errors.push(`Condition node "${n.id}": ${syntaxError}`);
        break;
      }
      case 'extractVariable':
        if (!data.path) errors.push(`Extract Variable node "${n.id}" is missing a source path`);
        if (!data.as) errors.push(`Extract Variable node "${n.id}" is missing a variable name to assign to`);
        break;
      case 'variable':
        if (!Array.isArray(data.assignments) || data.assignments.length === 0) {
          errors.push(`Variable node "${n.id}" has no variables to set`);
        } else if (data.assignments.some((a) => !a.key)) {
          errors.push(`Variable node "${n.id}" has an assignment with no key`);
        }
        break;
      case 'transform':
        if (!data.source) errors.push(`Transform node "${n.id}" is missing a source`);
        if (!data.operation) errors.push(`Transform node "${n.id}" is missing an operation`);
        if (!data.output) errors.push(`Transform node "${n.id}" is missing an output variable name`);
        break;
      case 'delay':
        if (typeof data.ms !== 'number' || data.ms < 0) {
          errors.push(`Delay node "${n.id}" needs a non-negative millisecond duration`);
        }
        if (data.ms > 60000) {
          errors.push(`Delay node "${n.id}" exceeds the 60s maximum allowed delay`);
        }
        break;
      default:
        break;
    }
  }

  // Every condition node needs both a TRUE and a FALSE outgoing edge, or
  // one branch of the workflow can never be reached.
  for (const n of nodes.filter((n) => n.type === 'condition')) {
    const outgoing = edges.filter((e) => e.source === n.id);
    const hasTrue = outgoing.some((e) => e.sourceHandle === 'true');
    const hasFalse = outgoing.some((e) => e.sourceHandle === 'false');
    if (!hasTrue || !hasFalse) {
      errors.push(`Condition node "${n.id}" needs both a TRUE and a FALSE branch connected`);
    }
  }

  // Non-condition, non-end nodes should have exactly one outgoing edge —
  // more than one is ambiguous (which one runs?), zero silently ends the
  // workflow early, which validation should surface rather than hide.
  for (const n of nodes.filter((n) => n.type !== 'condition' && n.type !== 'end')) {
    const outgoing = edges.filter((e) => e.source === n.id);
    if (outgoing.length === 0) {
      errors.push(`Node "${n.id}" (${n.type}) has no outgoing connection`);
    } else if (outgoing.length > 1) {
      errors.push(`Node "${n.id}" (${n.type}) has more than one outgoing connection`);
    }
  }

  if (nodeIds.size > 0 && detectCycle(nodes, edges)) {
    errors.push('Workflow contains a circular connection and cannot be executed');
  }

  return errors;
}

module.exports = { validateWorkflow, VALID_TYPES };
