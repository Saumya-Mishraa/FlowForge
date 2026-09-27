const { Environment } = require('../models');

const VAR_PATTERN = /\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g;

// Loads the active environment for a project (or a specific one by id) and
// returns a flat { KEY: value } map for substitution.
async function getVariableMap(projectId, environmentId = null) {
  const query = environmentId
    ? { _id: environmentId, project: projectId }
    : { project: projectId, isActive: true };

  const environment = await Environment.findOne(query);
  if (!environment) return { environment: null, variables: {} };

  const variables = {};
  for (const v of environment.variables) {
    variables[v.key] = v.value;
  }
  return { environment, variables };
}

// Replaces every {{KEY}} occurrence in a string with its resolved value.
// Unresolved variables are left as-is (rather than silently becoming an
// empty string) so a missing variable is visible in the request/response
// instead of failing invisibly.
function resolveString(input, variables) {
  if (typeof input !== 'string') return input;
  return input.replace(VAR_PATTERN, (match, key) => {
    return Object.prototype.hasOwnProperty.call(variables, key) ? variables[key] : match;
  });
}

function findUnresolvedVariables(input) {
  if (typeof input !== 'string') return [];
  const found = [];
  let match;
  const re = new RegExp(VAR_PATTERN);
  while ((match = re.exec(input)) !== null) {
    found.push(match[1]);
  }
  return found;
}

module.exports = { getVariableMap, resolveString, findUnresolvedVariables, VAR_PATTERN };
