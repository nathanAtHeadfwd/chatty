import { getAllNodes } from './storage';

export interface GraphNode {
    id: string;
    label: string;
    content: string;
    neighbors: string[]; // Other nodes mentioned in this node
}

export const getKnowledgeGraph = (): GraphNode[] => {
    const rawNodes = getAllNodes();

    return rawNodes.map(node => {
        const content = node.content;
        // Extract Obsidian-style links: [[Node Name]]
        const matches = [...content.matchAll(/\[\[(.*?)\]\]/g)];
        const links = matches.map(m => m[1]);

        return {
            id: node.data.id || node.data.title,
            label: node.data.title,
            content: content.substring(0, 500), // Keep memory lightweight
            neighbors: links
        };
    });
};

export const getContextString = (): string => {
    const graph = getKnowledgeGraph();
    return graph.map(g => `Entity: ${g.label}\nRelations: ${g.neighbors.join(', ')}\nDetails: ${g.content}`).join('\n\n');
};