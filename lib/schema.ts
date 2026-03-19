import { z } from "zod";

// Schema for the YAML Frontmatter of a Knowledge Node (Markdown file)
export const NodeFrontmatterSchema = z.object({
    id: z.string(),
    title: z.string(),
    type: z.enum(["person", "concept", "event", "location", "unknown"]),
    tags: z.array(z.string()).default([]),
    source_context: z.string().optional(),
    source_message_id: z.string().optional(),
    created_at: z.string(),
    updated_at: z.string(),
});

export type NodeFrontmatter = z.infer<typeof NodeFrontmatterSchema>;

// Schema for a Chat Message Log
export const MessageSchema = z.object({
    id: z.string(),
    role: z.enum(["user", "assistant"]),
    content: z.string(),
    timestamp: z.string(),
    extracted_entities: z.array(z.string()).default([]),
});

export type Message = z.infer<typeof MessageSchema>;
