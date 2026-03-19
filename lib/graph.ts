import { getAllNodes } from './storage';

export interface GraphNode {
  id: string;
  label: string;
  content: string;
  neighbors: string[];
}

export const getKnowledgeGraph = (username: string): GraphNode[] => {
  const rawNodes = getAllNodes(username);

  return rawNodes.map(node => {
    const content = node.content;
    const matches = [...content.matchAll(/\[\[(.*?)\]\]/g)];
    const links = matches.map(m => m[1]);

    return {
      id: node.data.id || node.data.title,
      label: node.data.title,
      content: content.substring(0, 500),
      neighbors: links
    };
  });
};

export const getContextString = (username: string): string => {
  const graph = getKnowledgeGraph(username);
  return graph.map(g => `Entity: ${g.label}\nRelations: ${g.neighbors.join(', ')}\nDetails: ${g.content}`).join('\n\n');
};
