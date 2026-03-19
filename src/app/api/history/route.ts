import fs from 'fs';
import path from 'path';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get('sessionId');
  if (!sessionId) return Response.json([]);

  const filePath = path.join(process.cwd(), 'vault', 'messages', `${sessionId}.md`);
  if (!fs.existsSync(filePath)) return Response.json([]);

  const content = fs.readFileSync(filePath, 'utf-8');

  // Parse "## User\n..." and "## Assistant\n..." blocks
  const messages: { id: string; role: 'user' | 'assistant'; parts: { type: 'text'; text: string }[] }[] = [];
  const blocks = content.split(/\n\n+/);
  let idx = 0;

  for (const block of blocks) {
    const userMatch = block.match(/^## User\n([\s\S]+)/);
    const assistantMatch = block.match(/^## Assistant\n([\s\S]+)/);
    if (userMatch) {
      messages.push({ id: `msg-${idx++}`, role: 'user', parts: [{ type: 'text', text: userMatch[1].trim() }] });
    } else if (assistantMatch) {
      messages.push({ id: `msg-${idx++}`, role: 'assistant', parts: [{ type: 'text', text: assistantMatch[1].trim() }] });
    }
  }

  return Response.json(messages);
}
