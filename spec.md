# GraphChat Technical Specification
**Current Version:** v2.0

---

## ACTIVE PHASE: v2.0 (Boardy)

### Core Objective (v2.0)
Upgrade the local Next.js webchat to support per-user memory, traceability, and graph visualization using local Markdown files.

### Architecture Rules (v2.0)
1. **Per-User Vault:** All storage must now use `vault/[username]/nodes/` and `vault/[username]/messages/`.
2. **Perfect Memory:** Boardy must only feed the last 25 messages of a session to the LLM to prevent context overflow.
3. **Traceability:** Every node must track `source_context` (quote from the chat) and `source_message_id` (the ID of the message that spawned this knowledge).
4. **Visualization:** Use `react-force-graph-2d` to render a visual graph of the user's nodes.
5. **Quality of Life (QoL):** The UI must include a 1-button reset (to wipe a user's vault) and a 1-button dummy data generator (to seed 2 months of backdated nodes/messages).

### Required Tasks for Claude (v2.0)
1. Read the updated `/lib` files carefully. Do NOT rewrite their core logic; use them as your data layer to build the UI and APIs.
2. Ensure `react-force-graph-2d` is installed.
3. Build `app/api/graph/route.ts` to fetch and return `getKnowledgeGraph(username)` as JSON.
4. Build `app/api/chat/route.ts` and strictly enforce the 25-message sliding window before sending context to the LLM.
5. Build the UI in `app/page.tsx` that includes:
    - A username login/input state.
    - The main chat interface.
    - A "View Graph" button that renders the provided `components/GraphVisualizer.tsx`.
    - A "Reset Memory" button that calls `/api/system/reset`.
    - A "Seed Dummy Data" button that calls `/api/system/seed`.

---

## ARCHIVE: Phase 1 Spec (v1.0 - For Context Only)

### Core Objective
Build a local Next.js 15 (App Router) webchat. It uses local Markdown files as a database and builds an in-memory Knowledge Graph from those files to give the AI long-term memory.

### Architecture & Rules
1. **No external DBs.** All state lives in the `/vault` directory at the project root (`/vault/nodes`, `/vault/messages`).
2. **Schema:** The data contracts for the Markdown frontmatter are strictly defined in `lib/schema.ts`.
3. **Storage:** Use the existing `lib/storage.ts` to read/write Markdown files using Node's `fs` and `gray-matter`.
4. **Memory:** Use `lib/graph.ts` to parse `[[WikiLinks]]` from the markdown files to build context.
5. **Entity Extraction:** When a user sends a message, use `lib/extractor.ts` to evaluate the text, create new Markdown nodes for capitalized concepts/entities, and append the message to the chat log.

### Required Tasks for Claude (Already Completed in v1.0)
1. Run `npx create-next-app@latest .` (TypeScript, Tailwind, App Router).
2. Install dependencies: `npm install gray-matter lucide-react ai @ai-sdk/openai zod`.
3. Build the UI in `app/page.tsx`: A dark-themed layout with a left sidebar showing Knowledge Graph nodes (from `lib/graph.ts`) and a central chat interface. Include a simple name-input overlay for auth.
4. Build the API route in `app/api/chat/route.ts` that wires together `storage.ts`, `graph.ts`, and `extractor.ts` to process messages, update the graph, and return the AI's response.