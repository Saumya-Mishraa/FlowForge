const { randomUUID } = require('crypto');
const { validateWorkflow } = require('./validate');
const { executeNode } = require('./nodeExecutors');
const { buildGraph, getNextNode, MAX_STEPS } = require('./engine');
const ApiError = require('../utils/ApiError');

// Debug Mode runs one node at a time on the real engine primitives (the same
// executeNode/getNextNode a full "Run" uses), pausing between each so the
// person can inspect variables and the last response before continuing —
// and can genuinely stop before a not-yet-executed node ever runs, unlike a
// UI that merely replays an already-completed run.
//
// Sessions live in-process memory only (not Mongo, not Redis) and expire
// after 15 minutes of inactivity. That means: debug sessions do not survive
// a server restart, and won't work if you ever run multiple server
// instances behind a load balancer without sticky sessions — acceptable for
// this build's scope, called out in the README.
const SESSION_TTL_MS = 15 * 60 * 1000;
const sessions = new Map();

function scheduleExpiry(sessionId) {
  const session = sessions.get(sessionId);
  if (!session) return;
  clearTimeout(session.expiryTimer);
  session.expiryTimer = setTimeout(() => sessions.delete(sessionId), SESSION_TTL_MS);
  session.expiryTimer.unref?.();
}

function startSession({ workflow, owner, initialVariables }) {
  const errors = validateWorkflow(workflow);
  if (errors.length) {
    throw ApiError.badRequest('Workflow failed validation', errors);
  }

  const graph = buildGraph(workflow);
  const startNode = workflow.nodes.find((n) => n.type === 'start');

  const sessionId = randomUUID();
  const session = {
    id: sessionId,
    owner: String(owner),
    workflowId: String(workflow._id),
    graph,
    context: { variables: { ...initialVariables }, lastResponse: null },
    current: startNode,
    nodeResults: [],
    status: 'running',
    steps: 0,
  };
  sessions.set(sessionId, session);
  scheduleExpiry(sessionId);

  return publicView(session);
}

function getOwnedSession(sessionId, owner) {
  const session = sessions.get(sessionId);
  if (!session || session.owner !== String(owner)) {
    throw ApiError.notFound('Debug session not found or has expired');
  }
  return session;
}

async function stepSession(sessionId, owner) {
  const session = getOwnedSession(sessionId, owner);
  scheduleExpiry(sessionId);

  if (session.status !== 'running' || !session.current) {
    return publicView(session);
  }

  session.steps++;
  if (session.steps > MAX_STEPS) {
    session.status = 'failed';
    session.error = 'Execution exceeded the maximum step count (possible infinite loop)';
    session.current = null;
    return publicView(session);
  }

  const nodeResult = await executeNode(session.current, session.context);
  session.nodeResults.push(nodeResult);

  if (nodeResult.status === 'failed') {
    session.status = 'failed';
    session.error = nodeResult.error;
    session.current = null;
    return publicView(session);
  }

  if (session.current.type === 'end') {
    session.status = 'succeeded';
    session.current = null;
    return publicView(session);
  }

  const next = getNextNode(session.current, nodeResult, session.graph);
  if (!next) {
    session.status = 'succeeded';
    session.current = null;
  } else {
    session.current = next;
  }

  return publicView(session);
}

function stopSession(sessionId, owner) {
  const session = getOwnedSession(sessionId, owner);
  clearTimeout(session.expiryTimer);
  session.status = 'stopped';
  const result = publicView(session);
  sessions.delete(sessionId);
  return result;
}

function publicView(session) {
  return {
    sessionId: session.id,
    status: session.status,
    currentNode: session.current ? { id: session.current.id, type: session.current.type } : null,
    lastResult: session.nodeResults[session.nodeResults.length - 1] || null,
    nodeResults: session.nodeResults,
    variables: session.context.variables,
    error: session.error || '',
  };
}

module.exports = { startSession, stepSession, stopSession };
