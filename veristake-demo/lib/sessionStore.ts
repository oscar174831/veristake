import "server-only";
import { kv, type VercelKV } from "@vercel/kv";
import type { DemoSession } from "@/lib/demoOrchestrator";

export interface SessionStore {
  getSession(id: string): Promise<DemoSession | null>;
  putSession(session: DemoSession): Promise<void>;
  listRecentSessions(limit: number): Promise<DemoSession[]>;
  deleteSession(id: string): Promise<void>;
  incrementCounter(key: string, ttlSeconds: number): Promise<number>;
}

type MemoryState = {
  sessions: Map<string, DemoSession>;
  counters: Map<string, { count: number; expiresAt: number }>;
};

declare global {
  // eslint-disable-next-line no-var
  var __veristakeSessionStore: MemoryState | undefined;
}

function memoryState(): MemoryState {
  if (!globalThis.__veristakeSessionStore) {
    globalThis.__veristakeSessionStore = {
      sessions: new Map<string, DemoSession>(),
      counters: new Map<string, { count: number; expiresAt: number }>()
    };
  }
  return globalThis.__veristakeSessionStore;
}

export class MemorySessionStore implements SessionStore {
  private readonly state = memoryState();

  async getSession(id: string) {
    return this.state.sessions.get(id) ?? null;
  }

  async putSession(session: DemoSession) {
    this.state.sessions.set(session.id, session);
  }

  async listRecentSessions(limit: number) {
    return Array.from(this.state.sessions.values())
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, limit);
  }

  async deleteSession(id: string) {
    this.state.sessions.delete(id);
  }

  async incrementCounter(key: string, ttlSeconds: number) {
    const now = Date.now();
    const existing = this.state.counters.get(key);
    if (!existing || existing.expiresAt <= now) {
      this.state.counters.set(key, { count: 1, expiresAt: now + ttlSeconds * 1000 });
      return 1;
    }
    existing.count += 1;
    return existing.count;
  }
}

export class VercelKVSessionStore implements SessionStore {
  constructor(private readonly client: VercelKV) {}

  async getSession(id: string) {
    return (await this.client.get<DemoSession>(this.sessionKey(id))) ?? null;
  }

  async putSession(session: DemoSession) {
    await this.client.set(this.sessionKey(session.id), session, { ex: 60 * 60 * 24 });
  }

  async listRecentSessions(limit: number) {
    const sessions: DemoSession[] = [];
    for await (const key of this.client.scanIterator({ match: "session:*", count: 100 })) {
      const session = await this.client.get<DemoSession>(String(key));
      if (session) sessions.push(session);
      if (sessions.length >= limit * 3) break;
    }
    return sessions.sort((a, b) => b.createdAt - a.createdAt).slice(0, limit);
  }

  async deleteSession(id: string) {
    await this.client.del(this.sessionKey(id));
  }

  async incrementCounter(key: string, ttlSeconds: number) {
    const count = await this.client.incr(key);
    if (count === 1) {
      await this.client.expire(key, ttlSeconds);
    }
    return count;
  }

  private sessionKey(id: string) {
    return `session:${id}`;
  }
}

const memoryStore = new MemorySessionStore();

export function getSessionStore(): SessionStore {
  return process.env.SESSION_STORE === "kv" ? new VercelKVSessionStore(kv) : memoryStore;
}
