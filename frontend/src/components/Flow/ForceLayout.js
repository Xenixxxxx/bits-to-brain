import * as d3 from 'd3';

export const createForceLayout = (nodes, edges, setNodes) => {
  const simulation = d3.forceSimulation(nodes)
    .force('link', d3.forceLink(edges)
      .id(d => d.id)
      .distance(200)
      .strength(0.5)
    )
    .force('charge', d3.forceManyBody()
      .strength(-300)
    )
    .force('center', d3.forceCenter(window.innerWidth / 2, window.innerHeight / 2))
    .force('collision', d3.forceCollide()
      .radius(100)
    )
    .force('x', d3.forceX(window.innerWidth / 2).strength(0.1))
    .force('y', d3.forceY(window.innerHeight / 2).strength(0.1));

  simulation.force('radial', d3.forceRadial(
    d => Math.random() * 300,
    window.innerWidth / 2,
    window.innerHeight / 2
  ).strength(0.1));

  simulation.on('tick', () => {
    const updatedNodes = nodes.map(node => ({
      ...node,
      position: {
        x: node.x,
        y: node.y
      }
    }));
    setNodes(updatedNodes);
  });

  return simulation;
}; 