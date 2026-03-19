import { streamText, createUIMessageStream, createUIMessageStreamResponse, convertToModelMessages } from 'ai';
import type { UIMessage, LanguageModel } from 'ai';
import { getContextString } from '../../../../lib/graph';
import { extractAndSaveEntities } from '../../../../lib/extractor';
import { appendToChatLog } from '../../../../lib/storage';

function resolveModel(): LanguageModel {
  if (process.env.OPENAI_API_KEY) {
    const { openai } = require('@ai-sdk/openai');
    return openai('gpt-4o-mini');
  }
  if (process.env.ANTHROPIC_API_KEY) {
    const { anthropic } = require('@ai-sdk/anthropic');
    return anthropic('claude-haiku-4-5-20251001');
  }
  throw new Error('No LLM API key found. Set OPENAI_API_KEY or ANTHROPIC_API_KEY.');
}

export async function POST(req: Request) {
  const body = await req.json();
  const messages: UIMessage[] = body.messages ?? [];
  const sessionId: string = body.sessionId || 'default';

  // Extract the latest user message text
  const lastMsg = messages.at(-1);
  const userText =
    (lastMsg?.parts as Array<{ type: string; text?: string }> | undefined)
      ?.find(p => p.type === 'text')?.text ?? '';

  // Persist entities and user message to vault
  await extractAndSaveEntities(userText);
  appendToChatLog(sessionId, `## User\n${userText}`);

  // Build system prompt enriched with current knowledge graph
  const context = getContextString();
  // ✏️ Edit this to change the assistant's behaviour
  const basePrompt =
    'You are a casual, sharp chat assistant. Reply like a human in a chat — short, direct, no fluff. ' +
    'Never explain things the user didn\'t ask about. No emojis unless the user uses them first. ' +
    'Match the user\'s energy and brevity.';

  const system = context
    ? `${basePrompt}\n\n## Knowledge Graph\n${context}`
    : basePrompt;

  const modelMessages = await convertToModelMessages(messages);

  const stream = createUIMessageStream({
    execute: async ({ writer }) => {
      const result = streamText({
        model: resolveModel(),
        system,
        messages: modelMessages,
        onFinish: ({ text }) => {
          appendToChatLog(sessionId, `## Assistant\n${text}`);
        },
      });
      writer.merge(result.toUIMessageStream());
    },
    onError: error => (error instanceof Error ? error.message : String(error)),
  });

  return createUIMessageStreamResponse({ stream });
}
