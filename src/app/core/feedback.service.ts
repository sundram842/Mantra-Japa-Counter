import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class FeedbackService {
  private readonly platformId = inject(PLATFORM_ID);
  private clickAudio: HTMLAudioElement | null = null;

  vibrate(duration: number): void {
    if (!isPlatformBrowser(this.platformId)) return;
    if ('vibrate' in navigator) {
      navigator.vibrate(duration);
    }
  }

  playClick(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    try {
      if (!this.clickAudio) {
        this.clickAudio = new Audio('assets/click.mp3');
        this.clickAudio.volume = 0.3;
      }
      this.clickAudio.currentTime = 0;
      this.clickAudio.play().catch(() => {
        // Audio play blocked by browser policy
      });
    } catch {
      // Audio not available
    }
  }
}
