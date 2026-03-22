import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { StorageService } from './storage.service';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly storage = inject(StorageService);

  readonly isDark = signal(false);

  constructor() {
    const saved = this.storage.get<boolean>('darkMode', false);
    this.isDark.set(saved);
    this.applyTheme(saved);
  }

  toggle(): void {
    const newValue = !this.isDark();
    this.isDark.set(newValue);
    this.storage.set('darkMode', newValue);
    this.applyTheme(newValue);
  }

  setDark(dark: boolean): void {
    this.isDark.set(dark);
    this.storage.set('darkMode', dark);
    this.applyTheme(dark);
  }

  private applyTheme(dark: boolean): void {
    if (!isPlatformBrowser(this.platformId)) return;
    if (dark) {
      document.documentElement.classList.add('dark-theme');
    } else {
      document.documentElement.classList.remove('dark-theme');
    }
  }
}
