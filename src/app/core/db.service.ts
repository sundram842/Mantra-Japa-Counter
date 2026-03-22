import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { User, JapaSession } from '../shared/models/user.model';

const DB_KEYS = {
  USERS: 'japa_db_users',
  SESSIONS: 'japa_db_sessions',
} as const;

@Injectable({ providedIn: 'root' })
export class DbService {
  private readonly platformId = inject(PLATFORM_ID);

  // --- Users ---

  getUsers(): User[] {
    return this.load<User[]>(DB_KEYS.USERS, []);
  }

  findUserByEmail(email: string): User | undefined {
    return this.getUsers().find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  findUserById(id: string): User | undefined {
    return this.getUsers().find((u) => u.id === id);
  }

  createUser(user: User): void {
    const users = this.getUsers();
    users.push(user);
    this.save(DB_KEYS.USERS, users);
  }

  // --- Japa Sessions ---

  getSessions(userId: string): JapaSession[] {
    return this.load<JapaSession[]>(DB_KEYS.SESSIONS, []).filter((s) => s.userId === userId);
  }

  addSession(session: JapaSession): void {
    const all = this.load<JapaSession[]>(DB_KEYS.SESSIONS, []);
    all.push(session);
    this.save(DB_KEYS.SESSIONS, all);
  }

  getSessionsByDateRange(userId: string, startDate: string, endDate: string): JapaSession[] {
    return this.getSessions(userId).filter((s) => s.date >= startDate && s.date <= endDate);
  }

  getTodaySessions(userId: string): JapaSession[] {
    const today = new Date().toISOString().split('T')[0];
    return this.getSessions(userId).filter((s) => s.date === today);
  }

  // --- Helpers ---

  private load<T>(key: string, defaultValue: T): T {
    if (!isPlatformBrowser(this.platformId)) return defaultValue;
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  private save(key: string, value: unknown): void {
    if (!isPlatformBrowser(this.platformId)) return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Storage full
    }
  }
}
