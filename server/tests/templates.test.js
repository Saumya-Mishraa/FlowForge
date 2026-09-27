const { listTemplates, buildTemplate } = require('../src/workflow-engine/templates');
const { validateWorkflow } = require('../src/workflow-engine/validate');

describe('workflow templates', () => {
  it('lists at least the three templates specified in the brief', () => {
    const keys = listTemplates().map((t) => t.key);
    expect(keys).toEqual(expect.arrayContaining(['auth-flow', 'crud-flow', 'user-verification']));
  });

  it.each(listTemplates().map((t) => t.key))('template "%s" builds a graph that passes validation', (key) => {
    const graph = buildTemplate(key);
    expect(graph).not.toBeNull();
    expect(graph.nodes.length).toBeGreaterThan(0);
    const errors = validateWorkflow(graph);
    expect(errors).toEqual([]);
  });

  it('returns null for an unknown template key', () => {
    expect(buildTemplate('not-a-real-template')).toBeNull();
  });
});
