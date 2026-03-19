# GraphChat Technical Specification

## Core Objective
Build a local Next.js 15 (App Router) webchat. It uses local Markdown files as a database and builds an in-memory Knowledge Graph from those files to give the AI long-term memory.

## Architecture & Rules
1. **No external DBs.** All state lives in the `/vault` directory at the project root (`/vault/nodes`, `/vault/messages`).
2. **Schema:** The data contracts for the Markdown frontmatter are strictly defined in `lib/schema.ts`.
3. **Storage:** Use the existing `lib/storage.ts` to read/write Markdown files using Node's `fs` and `gray-matter`.
4. **Memory:** Use `lib/graph.ts` to parse `[[WikiLinks]]` from the markdown files to build context.
5. **Entity Extraction:** When a user sends a message, use `lib/extractor.ts` to evaluate the text, create new Markdown nodes for capitalized concepts/entities, and append the message to the chat log.

## Required Tasks for Claude
1. Run `npx create-next-app@latest .` (TypeScript, Tailwind, App Router).
2. Install dependencies: `npm install gray-matter lucide-react ai @ai-sdk/openai zod`.
3. Build the UI in `app/page.tsx`: A dark-themed layout with a left sidebar showing Knowledge Graph nodes (from `lib/graph.ts`) and a central chat interface. Include a simple name-input overlay for auth.
4. Build the API route in `app/api/chat/route.ts` that wires together `storage.ts`, `graph.ts`, and `extractor.ts` to process messages, update the graph, and return the AI's response.