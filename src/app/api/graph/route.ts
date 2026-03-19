import { getKnowledgeGraph } from '@/lib/graph';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const username = searchParams.get('username') ?? '';
  if (!username) return Response.json({ error: 'Username required' }, { status: 400 });

  const graph = getKnowledgeGraph(username);
  return Response.json(graph);
}
