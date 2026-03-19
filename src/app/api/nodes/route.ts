import { getKnowledgeGraph } from '../../../../lib/graph';

export async function GET() {
  const nodes = getKnowledgeGraph();
  return Response.json(nodes);
}
