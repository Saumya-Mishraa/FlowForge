const { validateWorkflow } = require('./validate');
const { executeNode } = require('./nodeExecutors');
const ApiError = require('../utils/ApiError');

const MAX_STEPS = 200;

function buildGraph(workflow) {
  const nodesById = new Map(workflow.nodes.map((n) => [n.id, n]));
  const edgesBySource = new Map();
  for (const e of workflow.edges) {
    if (!edgesBySource.has(e.source)) edgesBySource.set(e.source, []);
    edgesBySource.get(e.source).push(e);
  }
  return { nodesById, edgesBySource };
}

// Shared by the full-run engine and the debug-session stepper so branching
// logic can never drift between the two: given the node that just ran and
// its result, decide what runs next (or null if the workflow is complete).
function getNextNode(current, nodeResult, graph) {
  const outgoing = graph.edgesBySource.get(current.id) || [];

  if (current.type === 'condition') {
    const branch = nodeResult.output?.result ? 'true' : 'false';
    const edge = outgoing.find((e) => e.sourceHandle === branch);
    return edge ? graph.nodesById.get(edge.target) : null;
  }

  const edge = outgoing[0];
  return edge ? graph.nodesById.get(edge.target) : null;
}

// Runs a workflow end-to-end synchronously and returns the full execution
// record. Throws an ApiError if the workflow fails validation — callers
// should validate (or catch) before charging ahead.
async function runWorkflow(workflow, { initialVariables = {} } = {}) {
  const errors = validateWorkflow(workflow);
  if (errors.length) {
    throw ApiError.badRequest('Workflow failed validation', errors);
  }

  const graph = buildGraph(workflow);
  const context = { variables: { ...initialVariables }, lastResponse: null };
  const nodeResults = [];

  let current = workflow.nodes.find((n) => n.type === 'start');
  let steps = 0;
  let status = 'succeeded';
  let error = '';

  while (current && steps < MAX_STEPS) {
    steps++;

    const nodeResult = await executeNode(current, context);
    nodeResults.push(nodeResult);

    if (nodeResult.status === 'failed') {
      status = 'failed';
      error = nodeResult.error || `Node "${current.id}" failed`;
      break;
    }

    if (current.type === 'end') break;

    const next = getNextNode(current, nodeResult, graph);
    if (!next) break;
    current = next;
  }

  if (steps >= MAX_STEPS) {
    status = 'failed';
    error = 'Execution exceeded the maximum step count (possible infinite loop)';
  }

  return { status, error, variables: context.variables, nodeResults };
}

module.exports = { runWorkflow, buildGraph, getNextNode, MAX_STEPS };
