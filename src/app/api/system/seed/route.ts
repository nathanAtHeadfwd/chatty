import { NextResponse } from 'next/server';
import { saveNode, appendToChatLog } from '@/lib/storage';

const daysAgo = (n: number) => {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d.toISOString();
};

const seedNodes = [
    {
        frontmatter: {
            id: 'project-omega',
            title: 'Project Omega',
            type: 'concept' as const,
            tags: ['dummy-data'],
            source_context: 'We should start working on Project Omega next quarter.',
            source_message_id: 'msg_dummy_1',
            created_at: daysAgo(60),
            updated_at: daysAgo(60),
        },
        content: 'A highly classified initiative connected to [[Alice]] and the [[Mainframe]]. Deadline is end of Q2.',
    },
    {
        frontmatter: {
            id: 'alice',
            title: 'Alice',
            type: 'person' as const,
            tags: ['dummy-data'],
            source_context: 'Alice is leading the new initiative.',
            source_message_id: 'msg_dummy_2',
            created_at: daysAgo(58),
            updated_at: daysAgo(30),
        },
        content: 'Lead engineer on [[Project Omega]]. Works closely with [[Bob]].',
    },
    {
        frontmatter: {
            id: 'mainframe',
            title: 'Mainframe',
            type: 'concept' as const,
            tags: ['dummy-data'],
            source_context: 'The Mainframe migration is the biggest risk on the project.',
            source_message_id: 'msg_dummy_3',
            created_at: daysAgo(45),
            updated_at: daysAgo(20),
        },
        content: 'Legacy infrastructure being migrated as part of [[Project Omega]]. High risk.',
    },
    {
        frontmatter: {
            id: 'bob',
            title: 'Bob',
            type: 'person' as const,
            tags: ['dummy-data'],
            source_context: 'Bob handles the backend infrastructure.',
            source_message_id: 'msg_dummy_4',
            created_at: daysAgo(40),
            updated_at: daysAgo(15),
        },
        content: 'Backend engineer supporting [[Alice]] on [[Project Omega]].',
    },
];

const seedMessages = [
    { daysAgo: 60, user: 'We should start working on Project Omega next quarter.', assistant: 'Got it. Who is leading it?' },
    { daysAgo: 58, user: 'Alice is leading the new initiative. She is the lead engineer.', assistant: 'Noted. Any key risks so far?' },
    { daysAgo: 45, user: 'The Mainframe migration is the biggest risk on the project.', assistant: 'Makes sense. Who handles the backend infrastructure?' },
    { daysAgo: 40, user: 'Bob handles the backend infrastructure alongside Alice.', assistant: 'Got it — Alice and Bob on backend, Mainframe the key risk.' },
    { daysAgo: 20, user: 'Quick update — Alice pushed the Mainframe migration back two weeks.', assistant: 'Understood. Still on track for Q2 overall?' },
    { daysAgo: 10, user: 'Yeah we are still on track. Bob is picking up the slack.', assistant: "Good to hear. I'll keep that in mind." },
];

export async function POST(req: Request) {
    try {
        const { username } = await req.json();
        if (!username) return NextResponse.json({ error: 'Username required' }, { status: 400 });

        const sessionId = username.trim().toLowerCase().replace(/\s+/g, '_');

        // Seed nodes
        for (const { frontmatter, content } of seedNodes) {
            saveNode(username, frontmatter, content);
        }

        // Seed backdated chat messages
        for (const msg of seedMessages) {
            const ts = daysAgo(msg.daysAgo);
            appendToChatLog(username, sessionId, `## User [${ts}]\n${msg.user}`);
            appendToChatLog(username, sessionId, `## Assistant [${ts}]\n${msg.assistant}`);
        }

        return NextResponse.json({ success: true, message: 'Dummy data injected.' });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to seed data' }, { status: 500 });
    }
}
