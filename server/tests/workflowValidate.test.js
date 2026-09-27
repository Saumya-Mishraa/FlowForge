const { validateWorkflow } = require('../src/workflow-engine/validate');

function linearWorkflow(nodes, edges) {
  return { nodes, edges };
}

describe('validateWorkflow', () => {
  it('accepts a minimal valid Start -> End workflow', () => {
    const errors = validateWorkflow(
      linearWorkflow(
        [
          { id: 's', type: 'start', data: {} },
          { id: 'e', type: 'end', data: {} },
        ],
        [{ id: 'edge1', source: 's', target: 'e' }]
      )
    );
    expect(errors).toEqual([]);
  });

  it('requires exactly one Start node', () => {
    expect(validateWorkflow(linearWorkflow([{ id: 'e', type: 'end', data: {} }], []))).toEqual(
      expect.arrayContaining([expect.stringContaining('missing a Start node')])
    );

    expect(
      validateWorkflow(
        linearWorkflow(
          [
            { id: 's1', type: 'start', data: {} },
            { id: 's2', type: 'start', data: {} },
            { id: 'e', type: 'end', data: {} },
          ],
          []
        )
      )
    ).toEqual(expect.arrayContaining([expect.stringContaining('exactly one Start node')]));
  });

  it('requires at least one End node', () => {
    expect(
      validateWorkflow(linearWorkflow([{ id: 's', type: 'start', data: {} }], []))
    ).toEqual(expect.arrayContaining([expect.stringContaining('missing an End node')]));
  });

  it('flags edges referencing missing nodes', () => {
    const errors = validateWorkflow(
      linearWorkflow(
        [
          { id: 's', type: 'start', data: {} },
          { id: 'e', type: 'end', data: {} },
        ],
        [{ id: 'bad', source: 's', target: 'ghost' }]
      )
    );
    expect(errors).toEqual(expect.arrayContaining([expect.stringContaining('missing target node')]));
  });

  it('flags an apiRequest node missing a URL', () => {
    const errors = validateWorkflow(
      linearWorkflow(
        [
          { id: 's', type: 'start', data: {} },
          { id: 'api', type: 'apiRequest', data: { method: 'GET' } },
          { id: 'e', type: 'end', data: {} },
        ],
        [
          { id: 'e1', source: 's', target: 'api' },
          { id: 'e2', source: 'api', target: 'e' },
        ]
      )
    );
    expect(errors).toEqual(expect.arrayContaining([expect.stringContaining('missing a URL')]));
  });

  it('flags a condition node missing a TRUE or FALSE branch', () => {
    const errors = validateWorkflow(
      linearWorkflow(
        [
          { id: 's', type: 'start', data: {} },
          { id: 'c', type: 'condition', data: { expression: 'statusCode == 200' } },
          { id: 'e', type: 'end', data: {} },
        ],
        [
          { id: 'e1', source: 's', target: 'c' },
          { id: 'e2', source: 'c', target: 'e', sourceHandle: 'true' },
          // no 'false' branch
        ]
      )
    );
    expect(errors).toEqual(expect.arrayContaining([expect.stringContaining('TRUE and a FALSE branch')]));
  });

  it('accepts a condition node with both branches wired', () => {
    const errors = validateWorkflow(
      linearWorkflow(
        [
          { id: 's', type: 'start', data: {} },
          { id: 'c', type: 'condition', data: { expression: 'statusCode == 200' } },
          { id: 'e1', type: 'end', data: {} },
          { id: 'e2', type: 'end', data: {} },
        ],
        [
          { id: 'edge1', source: 's', target: 'c' },
          { id: 'edge2', source: 'c', target: 'e1', sourceHandle: 'true' },
          { id: 'edge3', source: 'c', target: 'e2', sourceHandle: 'false' },
        ]
      )
    );
    expect(errors).toEqual([]);
  });

  it('detects a circular connection', () => {
    const errors = validateWorkflow(
      linearWorkflow(
        [
          { id: 's', type: 'start', data: {} },
          { id: 'a', type: 'log', data: { message: 'x' } },
          { id: 'b', type: 'log', data: { message: 'y' } },
          { id: 'e', type: 'end', data: {} },
        ],
        [
          { id: 'e1', source: 's', target: 'a' },
          { id: 'e2', source: 'a', target: 'b' },
          { id: 'e3', source: 'b', target: 'a' }, // cycle: a -> b -> a
        ]
      )
    );
    expect(errors).toEqual(expect.arrayContaining([expect.stringContaining('circular connection')]));
  });

  it('flags a node with more than one outgoing edge (ambiguous path)', () => {
    const errors = validateWorkflow(
      linearWorkflow(
        [
          { id: 's', type: 'start', data: {} },
          { id: 'a', type: 'log', data: { message: 'x' } },
          { id: 'e1', type: 'end', data: {} },
          { id: 'e2', type: 'end', data: {} },
        ],
        [
          { id: 'edge1', source: 's', target: 'a' },
          { id: 'edge2', source: 'a', target: 'e1' },
          { id: 'edge3', source: 'a', target: 'e2' },
        ]
      )
    );
    expect(errors).toEqual(expect.arrayContaining([expect.stringContaining('more than one outgoing')]));
  });
});
