// Starter workflow templates. Building an actual node/edge graph (not just a
// description) so "Create from template" produces something immediately
// runnable once the user fills in real URLs — matching the brief's
// requirement that templates create real workflow structures, not just
// text describing what they'd contain.

const emptyAuth = { type: 'none' };
const emptyBody = { mode: 'none' };

function apiNode(id, { method, url, auth, body }) {
  return {
    id,
    type: 'apiRequest',
    position: { x: 0, y: 0 },
    data: { method, url, params: [], headers: [], auth: auth || emptyAuth, body: body || emptyBody },
  };
}

const TEMPLATES = {
  'auth-flow': {
    label: 'Authentication Flow',
    description: 'Register → Login → Extract Token → Get Profile',
    build: () => ({
      nodes: [
        { id: 'start', type: 'start', position: { x: 0, y: 0 }, data: {} },
        apiNode('register', { method: 'POST', url: '{{BASE_URL}}/auth/register' }),
        apiNode('login', { method: 'POST', url: '{{BASE_URL}}/auth/login' }),
        { id: 'extract', type: 'extractVariable', position: { x: 0, y: 0 }, data: { path: 'response.token', as: 'authToken' } },
        apiNode('profile', {
          method: 'GET',
          url: '{{BASE_URL}}/auth/me',
          auth: { type: 'bearer', bearerToken: '{{authToken}}' },
        }),
        { id: 'end', type: 'end', position: { x: 0, y: 0 }, data: {} },
      ],
      edges: [
        { id: 'e1', source: 'start', target: 'register' },
        { id: 'e2', source: 'register', target: 'login' },
        { id: 'e3', source: 'login', target: 'extract' },
        { id: 'e4', source: 'extract', target: 'profile' },
        { id: 'e5', source: 'profile', target: 'end' },
      ],
    }),
  },

  'crud-flow': {
    label: 'CRUD Flow',
    description: 'Create → Read → Update → Delete',
    build: () => ({
      nodes: [
        { id: 'start', type: 'start', position: { x: 0, y: 0 }, data: {} },
        apiNode('create', { method: 'POST', url: '{{BASE_URL}}/resources', body: { mode: 'json', json: '{}' } }),
        apiNode('read', { method: 'GET', url: '{{BASE_URL}}/resources/{{resourceId}}' }),
        apiNode('update', { method: 'PUT', url: '{{BASE_URL}}/resources/{{resourceId}}', body: { mode: 'json', json: '{}' } }),
        apiNode('delete', { method: 'DELETE', url: '{{BASE_URL}}/resources/{{resourceId}}' }),
        { id: 'end', type: 'end', position: { x: 0, y: 0 }, data: {} },
      ],
      edges: [
        { id: 'e1', source: 'start', target: 'create' },
        { id: 'e2', source: 'create', target: 'read' },
        { id: 'e3', source: 'read', target: 'update' },
        { id: 'e4', source: 'update', target: 'delete' },
        { id: 'e5', source: 'delete', target: 'end' },
      ],
    }),
  },

  'user-verification': {
    label: 'User Verification',
    description: 'Login → Get User → Check Status → Continue/Stop',
    build: () => ({
      nodes: [
        { id: 'start', type: 'start', position: { x: 0, y: 0 }, data: {} },
        apiNode('login', { method: 'POST', url: '{{BASE_URL}}/auth/login' }),
        apiNode('getUser', { method: 'GET', url: '{{BASE_URL}}/auth/me' }),
        { id: 'check', type: 'condition', position: { x: 0, y: 0 }, data: { expression: 'response.isEmailVerified == true' } },
        { id: 'continueLog', type: 'log', position: { x: 0, y: 0 }, data: { message: 'User verified — continuing' } },
        { id: 'stopLog', type: 'log', position: { x: 0, y: 0 }, data: { message: 'User not verified — stopping' } },
        { id: 'end', type: 'end', position: { x: 0, y: 0 }, data: {} },
      ],
      edges: [
        { id: 'e1', source: 'start', target: 'login' },
        { id: 'e2', source: 'login', target: 'getUser' },
        { id: 'e3', source: 'getUser', target: 'check' },
        { id: 'e4', source: 'check', target: 'continueLog', sourceHandle: 'true' },
        { id: 'e5', source: 'check', target: 'stopLog', sourceHandle: 'false' },
        { id: 'e6', source: 'continueLog', target: 'end' },
        { id: 'e7', source: 'stopLog', target: 'end' },
      ],
    }),
  },
};

function listTemplates() {
  return Object.entries(TEMPLATES).map(([key, t]) => ({ key, label: t.label, description: t.description }));
}

function buildTemplate(key) {
  const template = TEMPLATES[key];
  if (!template) return null;
  return template.build();
}

module.exports = { listTemplates, buildTemplate };
