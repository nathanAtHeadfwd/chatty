import { streamText, createUIMessageStream, createUIMessageStreamResponse, convertToModelMessages } from 'ai';
import type { UIMessage, LanguageModel } from 'ai';
import { getContextString } from '@/lib/graph';
import { extractAndSaveEntities } from '@/lib/extractor';
import { appendToChatLog } from '@/lib/storage';

const SLIDING_WINDOW = 25;

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
  const username: string = body.username || 'default';
  const sessionId: string = body.sessionId || username;

  // Extract text from the latest user message
  const lastMsg = messages.at(-1);
  const userText =
    (lastMsg?.parts as Array<{ type: string; text?: string }> | undefined)
      ?.find(p => p.type === 'text')?.text ?? '';
  const messageId = lastMsg?.id ?? `msg_${Date.now()}`;

  // Persist user message and extract entities (non-blocking on failure)
  appendToChatLog(username, sessionId, `## User\n${userText}`);
  extractAndSaveEntities(username, userText, messageId).catch(e =>
    console.error('Entity extraction failed:', e)
  );

  // Build system prompt with knowledge graph context
  const context = getContextString(username);
  // ✏️ Edit this to change the assistant's behaviour
  const basePrompt =
    'You are a casual, sharp chat assistant. Reply like a human in a chat — short, direct, no fluff. ' +
    "Never explain things the user didn't ask about. No emojis unless the user uses them first. " +
    "Match the user's energy and brevity.";

  const system = context
    ? `${basePrompt}\n\n## Knowledge Graph\n${context}`
    : basePrompt;

  // Enforce 25-message sliding window before sending to LLM
  const windowedMessages = messages.slice(-SLIDING_WINDOW);
  const modelMessages = await convertToModelMessages(windowedMessages);

  const stream = createUIMessageStream({
    execute: async ({ writer }) => {
      const result = streamText({
        model: resolveModel(),
        system,
        messages: modelMessages,
        onFinish: ({ text }) => {
          appendToChatLog(username, sessionId, `## Assistant\n${text}`);
        },
      });
      writer.merge(result.toUIMessageStream());
    },
    onError: error => (error instanceof Error ? error.message : String(error)),
  });

  return createUIMessageStreamResponse({ stream });
}
