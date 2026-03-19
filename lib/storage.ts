import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { NodeFrontmatter } from './schema';

const VAULT_PATH = path.join(process.cwd(), 'vault');
const NODES_PATH = path.join(VAULT_PATH, 'nodes');
const CHAT_PATH = path.join(VAULT_PATH, 'messages');

export const initVault = () => {
    [NODES_PATH, CHAT_PATH].forEach(dir => {
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    });
};

export const saveNode = (frontmatter: Omit<NodeFrontmatter, 'created_at' | 'updated_at'>, content: string) => {
    initVault();
    const fileName = `${frontmatter.title.replace(/\s+/g, '_')}.md`;
    const filePath = path.join(NODES_PATH, fileName);

    const existing = fs.existsSync(filePath) ? matter(fs.readFileSync(filePath, 'utf-8')) : null;

    const data = {
        ...frontmatter,
        created_at: existing ? existing.data.created_at : new Date().toISOString(),
        updated_at: new Date().toISOString()
    };

    const fileContent = matter.stringify(content, data);
    fs.writeFileSync(filePath, fileContent);
};

export const appendToChatLog = (sessionId: string, message: string) => {
    initVault();
    const filePath = path.join(CHAT_PATH, `${sessionId}.md`);
    fs.appendFileSync(filePath, `${message}\n\n`);
};

export const getAllNodes = () => {
    initVault();
    const files = fs.readdirSync(NODES_PATH).filter(f => f.endsWith('.md'));
    return files.map(f => {
        const raw = fs.readFileSync(path.join(NODES_PATH, f), 'utf-8');
        return matter(raw);
    });
};