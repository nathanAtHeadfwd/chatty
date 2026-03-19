import { NextResponse } from 'next/server';
import { saveNode } from '@/lib/storage';

export async function POST(req: Request) {
    try {
        const { username } = await req.json();
        if (!username) return NextResponse.json({ error: "Username required" }, { status: 400 });

        // Generate a backdated timestamp (e.g., 45 days ago)
        const pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - 45);
        const dateString = pastDate.toISOString();

        // Create Dummy Nodes
        saveNode(username, {
            id: "project-omega",
            title: "Project Omega",
            type: "concept",
            tags: ["dummy-data"],
            source_context: "We should start working on Project Omega next quarter.",
            source_message_id: "msg_dummy_1",
            created_at: dateString,
            updated_at: dateString
        }, "A highly classified project connected to [[Alice]] and the [[Mainframe]].");

        saveNode(username, {
            id: "alice",
            title: "Alice",
            type: "person",
            tags: ["dummy-data"],
            source_context: "Alice is leading the new initiative.",
            source_message_id: "msg_dummy_2",
            created_at: dateString,
            updated_at: dateString
        }, "Lead engineer on [[Project Omega]].");

        return NextResponse.json({ success: true, message: "Dummy data injected." });
    } catch (error) {
        return NextResponse.json({ error: "Failed to seed data" }, { status: 500 });
    }
}