const { parseOpenApiSpec } = require('../src/openapi/parser');

const SAMPLE_SPEC_JSON = JSON.stringify({
  openapi: '3.0.0',
  info: { title: 'Pet Store', version: '1.0.0' },
  servers: [{ url: 'https://api.petstore.example.com/v1' }],
  paths: {
    '/pets': {
      get: {
        summary: 'List pets',
        parameters: [{ name: 'limit', in: 'query', schema: { type: 'integer' }, example: 10 }],
        responses: { 200: { description: 'ok' } },
      },
      post: {
        summary: 'Create a pet',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: { name: { type: 'string' }, tag: { type: 'string' } },
              },
            },
          },
        },
        responses: { 201: { description: 'created' } },
      },
    },
    '/pets/{petId}': {
      get: {
        summary: 'Get a pet by id',
        parameters: [{ name: 'petId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'ok' } },
      },
    },
  },
});

const SAMPLE_SPEC_YAML = `
openapi: 3.0.0
info:
  title: Mini API
  version: "1.0"
servers:
  - url: https://api.example.com
paths:
  /ping:
    get:
      summary: Ping
      responses:
        '200':
          description: ok
`;

describe('parseOpenApiSpec', () => {
  it('parses a JSON spec and extracts title, baseUrl, and endpoint count', () => {
    const result = parseOpenApiSpec(SAMPLE_SPEC_JSON);
    expect(result.title).toBe('Pet Store');
    expect(result.baseUrl).toBe('https://api.petstore.example.com/v1');
    expect(result.endpointCount).toBe(3);
  });

  it('extracts query parameters onto GET /pets', () => {
    const result = parseOpenApiSpec(SAMPLE_SPEC_JSON);
    const listPets = result.endpoints.find((e) => e.method === 'GET' && e.path === '/pets');
    expect(listPets.params).toEqual([{ key: 'limit', value: 10, enabled: true }]);
  });

  it('generates a JSON body example from the request schema on POST /pets', () => {
    const result = parseOpenApiSpec(SAMPLE_SPEC_JSON);
    const createPet = result.endpoints.find((e) => e.method === 'POST' && e.path === '/pets');
    expect(createPet.body.mode).toBe('json');
    const parsedBody = JSON.parse(createPet.body.json);
    expect(parsedBody).toEqual({ name: '', tag: '' });
  });

  it('leaves path parameters inline in the path rather than guessing a substitution', () => {
    const result = parseOpenApiSpec(SAMPLE_SPEC_JSON);
    const getPet = result.endpoints.find((e) => e.path === '/pets/{petId}');
    expect(getPet.path).toBe('/pets/{petId}');
  });

  it('parses a YAML spec identically to an equivalent JSON one', () => {
    const result = parseOpenApiSpec(SAMPLE_SPEC_YAML);
    expect(result.title).toBe('Mini API');
    expect(result.baseUrl).toBe('https://api.example.com');
    expect(result.endpointCount).toBe(1);
  });

  it('rejects a document with neither an "openapi" nor a "swagger" field', () => {
    expect(() => parseOpenApiSpec(JSON.stringify({ info: { title: 'Not a spec' } }))).toThrow(
      /does not look like an OpenAPI/
    );
  });

  it('rejects text that is neither valid JSON nor valid YAML', () => {
    expect(() => parseOpenApiSpec('{{{ not valid anything')).toThrow();
  });
});
