import { Injectable, PLATFORM_ID, inject, signal, computed } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { DbService } from './db.service';
import { User, UserProfile } from '../shared/models/user.model';

const SESSION_KEY = 'japa_auth_session';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly db = inject(DbService);
  private readonly router = inject(Router);

  private readonly currentUserId = signal<string | null>(null);

  readonly isLoggedIn = computed(() => this.currentUserId() !== null);
  readonly currentUser = computed<UserProfile | null>(() => {
    const id = this.currentUserId();
    if (!id) return null;
    const user = this.db.findUserById(id);
    if (!user) return null;
    return { id: user.id, name: user.name, email: user.email };
  });

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      const savedId = sessionStorage.getItem(SESSION_KEY);
      if (savedId && this.db.findUserById(savedId)) {
        this.currentUserId.set(savedId);
      }
    }
  }

  register(name: string, email: string, password: string): { success: boolean; error?: string } {
    if (this.db.findUserByEmail(email)) {
      return { success: false, error: 'An account with this email already exists.' };
    }

    const user: User = {
      id: this.generateId(),
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash: this.hashPassword(password),
      createdAt: new Date().toISOString(),
    };

    this.db.createUser(user);
    this.setSession(user.id);
    return { success: true };
  }

  login(email: string, password: string): { success: boolean; error?: string } {
    const user = this.db.findUserByEmail(email);
    if (!user) {
      return { success: false, error: 'No account found with this email.' };
    }
    if (user.passwordHash !== this.hashPassword(password)) {
      return { success: false, error: 'Incorrect password.' };
    }
    this.setSession(user.id);
    return { success: true };
  }

  logout(): void {
    this.currentUserId.set(null);
    if (isPlatformBrowser(this.platformId)) {
      sessionStorage.removeItem(SESSION_KEY);
    }
    this.router.navigate(['/login']);
  }

  private setSession(userId: string): void {
    this.currentUserId.set(userId);
    if (isPlatformBrowser(this.platformId)) {
      sessionStorage.setItem(SESSION_KEY, userId);
    }
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
  }

  /**
   * Simple hash for localStorage-only auth.
   * NOT suitable for production — use bcrypt/scrypt on a real server.
   */
  private hashPassword(password: string): string {
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
      const char = password.charCodeAt(i);
      hash = ((hash << 5) - hash + char) | 0;
    }
    return 'h_' + Math.abs(hash).toString(36);
  }
}
