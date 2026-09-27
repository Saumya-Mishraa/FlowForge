const yaml = require('js-yaml');

const METHODS = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options'];
const MAX_SCHEMA_DEPTH = 4;

// Parses a raw spec string as JSON first, then YAML — OpenAPI/Swagger specs
// are commonly published in either format and this build supports both, as
// documented in the README's "Known limitations" section.
function parseSpecText(rawText) {
  try {
    return JSON.parse(rawText);
  } catch {
    // fall through to YAML
  }
  try {
    return yaml.load(rawText);
  } catch (err) {
    throw new Error('Could not parse the file as JSON or YAML');
  }
}

function resolveRef(spec, ref) {
  // Only local refs like "#/components/schemas/User" are supported —
  // external file/URL refs are out of scope for this build.
  if (!ref || !ref.startsWith('#/')) return null;
  const path = ref.slice(2).split('/');
  let node = spec;
  for (const segment of path) {
    node = node?.[segment];
    if (node === undefined) return null;
  }
  return node;
}

// Produces a small, illustrative example value for a schema — not a full
// JSON-Schema-to-example generator. Handles $ref, primitives, arrays, and
// object properties; anything more exotic (oneOf/anyOf/allOf, formats,
// patterns) is skipped rather than guessed at.
function sampleFromSchema(spec, schema, depth = 0) {
  if (!schema || depth > MAX_SCHEMA_DEPTH) return null;
  if (schema.$ref) return sampleFromSchema(spec, resolveRef(spec, schema.$ref), depth + 1);
  if (schema.example !== undefined) return schema.example;

  switch (schema.type) {
    case 'string':
      return schema.enum?.[0] ?? '';
    case 'number':
    case 'integer':
      return 0;
    case 'boolean':
      return false;
    case 'array':
      return [sampleFromSchema(spec, schema.items, depth + 1)].filter((v) => v !== null);
    case 'object':
    default: {
      if (!schema.properties) return {};
      const obj = {};
      for (const [key, propSchema] of Object.entries(schema.properties)) {
        obj[key] = sampleFromSchema(spec, propSchema, depth + 1);
      }
      return obj;
    }
  }
}

function getBaseUrl(spec) {
  if (Array.isArray(spec.servers) && spec.servers[0]?.url) return spec.servers[0].url;
  if (spec.host) {
    const scheme = spec.schemes?.[0] || 'https';
    return `${scheme}://${spec.host}${spec.basePath || ''}`;
  }
  return '';
}

// Converts an operation's declared parameters into FlowForge's
// key/value-row shape, split by where they belong.
function extractParams(parameters = []) {
  const params = [];
  const headers = [];
  for (const p of parameters) {
    const row = { key: p.name, value: p.example ?? p.schema?.example ?? '', enabled: true };
    if (p.in === 'query') params.push(row);
    else if (p.in === 'header') headers.push(row);
    // 'path' params are left inline in the URL as {param}; 'cookie' params
    // are out of scope for this build.
  }
  return { params, headers };
}

function extractBody(spec, requestBody) {
  const jsonContent = requestBody?.content?.['application/json'];
  if (!jsonContent) return { mode: 'none' };
  const example =
    jsonContent.example ?? Object.values(jsonContent.examples || {})[0]?.value ?? sampleFromSchema(spec, jsonContent.schema);
  return { mode: 'json', json: JSON.stringify(example ?? {}, null, 2) };
}

// Returns { title, baseUrl, endpoints: [{ method, path, name, description,
// params, headers, body }] }. Path parameters (e.g. "{id}") are left as-is
// in the path string — FlowForge's own {{VARIABLE}} substitution can be
// used by renaming them after import, or by matching an environment
// variable of the same bracket-free name (documented limitation: this
// build does not auto-convert {id} to {{id}}).
function parseOpenApiSpec(rawText) {
  const spec = parseSpecText(rawText);

  if (!spec.openapi && !spec.swagger) {
    throw new Error('This does not look like an OpenAPI or Swagger document (no "openapi" or "swagger" field found)');
  }

  const baseUrl = getBaseUrl(spec);
  const endpoints = [];

  for (const [path, pathItem] of Object.entries(spec.paths || {})) {
    for (const method of METHODS) {
      const operation = pathItem[method];
      if (!operation) continue;

      const { params, headers } = extractParams([...(pathItem.parameters || []), ...(operation.parameters || [])]);

      endpoints.push({
        method: method.toUpperCase(),
        path,
        name: operation.summary || `${method.toUpperCase()} ${path}`,
        description: operation.description || '',
        params,
        headers,
        body: extractBody(spec, operation.requestBody),
      });
    }
  }

  return {
    title: spec.info?.title || 'Imported API',
    version: spec.info?.version || '',
    baseUrl,
    endpointCount: endpoints.length,
    endpoints,
  };
}

module.exports = { parseOpenApiSpec };
