import { generateObject } from 'ai';
import { z } from 'zod';
import { saveNode } from './storage';

function resolveModel() {
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

export const extractAndSaveEntities = async (username: string, userMessage: string, messageId: string) => {
  const { object } = await generateObject({
    model: resolveModel(),
    schema: z.object({
      entities: z.array(z.object({
        title: z.string(),
        type: z.enum(["person", "concept", "event", "location", "unknown"]),
        description: z.string().describe("A brief summary based on the conversation, including [[WikiLinks]] to related concepts."),
        source_context: z.string().describe("The exact relevant quote from the user's message.")
      }))
    }),
    prompt: `Analyze this message and extract key nouns, concepts, or people. Message: "${userMessage}"`
  });

  object.entities.forEach(entity => {
    saveNode(username, {
      id: entity.title.toLowerCase().replace(/\s+/g, '-'),
      title: entity.title,
      type: entity.type,
      tags: ["auto-extracted"],
      source_context: entity.source_context,
      source_message_id: messageId
    }, entity.description);
  });

  return object.entities;
};
