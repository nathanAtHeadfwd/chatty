import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(req: Request) {
    try {
        const { username } = await req.json();
        if (!username) return NextResponse.json({ error: "Username required" }, { status: 400 });

        const userVaultPath = path.join(process.cwd(), 'vault', username);

        if (fs.existsSync(userVaultPath)) {
            fs.rmSync(userVaultPath, { recursive: true, force: true });
        }

        return NextResponse.json({ success: true, message: "Memory wiped completely." });
    } catch (error) {
        return NextResponse.json({ error: "Failed to reset" }, { status: 500 });
    }
}