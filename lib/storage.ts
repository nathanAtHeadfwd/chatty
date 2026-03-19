import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { NodeFrontmatter } from './schema';

const getVaultPaths = (username: string) => {
  const base = path.join(process.cwd(), 'vault', username);
  return {
    base,
    nodes: path.join(base, 'nodes'),
    chat: path.join(base, 'messages')
  };
};

export const initVault = (username: string) => {
  const paths = getVaultPaths(username);
  [paths.nodes, paths.chat].forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  });
};

export const saveNode = (username: string, frontmatter: Omit<NodeFrontmatter, 'created_at' | 'updated_at'> & { created_at?: string; updated_at?: string }, content: string) => {
  initVault(username);
  const { nodes } = getVaultPaths(username);
  const fileName = `${frontmatter.title.replace(/\s+/g, '_')}.md`;
  const filePath = path.join(nodes, fileName);

  const existing = fs.existsSync(filePath) ? matter(fs.readFileSync(filePath, 'utf-8')) : null;

  const data = {
    ...frontmatter,
    created_at: frontmatter.created_at ?? (existing ? existing.data.created_at : new Date().toISOString()),
    updated_at: frontmatter.updated_at ?? new Date().toISOString(),
  };

  const fileContent = matter.stringify(content, data);
  fs.writeFileSync(filePath, fileContent);
};

export const appendToChatLog = (username: string, sessionId: string, message: string) => {
  initVault(username);
  const { chat } = getVaultPaths(username);
  const filePath = path.join(chat, `${sessionId}.md`);
  fs.appendFileSync(filePath, `${message}\n\n`);
};

export const getAllNodes = (username: string) => {
  initVault(username);
  const { nodes } = getVaultPaths(username);
  const files = fs.readdirSync(nodes).filter(f => f.endsWith('.md'));
  return files.map(f => {
    const raw = fs.readFileSync(path.join(nodes, f), 'utf-8');
    return matter(raw);
  });
};
