import { Component, computed, effect, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { StorageService } from '../../core/storage.service';
import { FeedbackService } from '../../core/feedback.service';
import { AuthService } from '../../core/auth.service';
import { DbService } from '../../core/db.service';
import { DEFAULT_COUNTER_STATE } from '../../shared/models/counter.model';
import { AppSettings, DEFAULT_SETTINGS } from '../../shared/models/settings.model';
import { JapaSession } from '../../shared/models/user.model';

@Component({
  selector: 'app-counter',
  imports: [
    DecimalPipe,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatTooltipModule,
    MatSnackBarModule,
  ],
  template: `
    <div class="counter-container">
      <!-- Today's stats -->
      <div class="today-badge">
        Today's Japas: {{ todayTotal() }}
      </div>

      <!-- Stats display -->
      <div class="stats-row">
        <div class="stat-item">
          <span class="stat-label">Target</span>
          <span class="stat-value">{{ target() }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Remaining</span>
          <span class="stat-value">{{ remaining() }}</span>
        </div>
      </div>

      <!-- Circular progress with counter -->
      <div class="progress-wrapper">
        <mat-progress-spinner
          class="progress-bg"
          [diameter]="240"
          [strokeWidth]="8"
          mode="determinate"
          [value]="100"
        />
        <mat-progress-spinner
          class="progress-fg"
          [diameter]="240"
          [strokeWidth]="8"
          mode="determinate"
          [value]="progressPercent()"
        />
        <button
          class="tap-button"
          [class.pulse]="isPulsing()"
          (click)="increment()"
          mat-fab
          extended
          aria-label="Tap to count"
        >
          <span class="count-display">{{ count() }}</span>
          <span class="tap-label">TAP</span>
        </button>
      </div>

      <!-- Progress percentage -->
      <div class="progress-text">
        {{ progressPercent() | number: '1.0-1' }}% complete
      </div>

      <!-- Action buttons -->
      <div class="action-row">
        <button
          mat-icon-button
          (click)="undo()"
          [disabled]="count() === 0"
          matTooltip="Undo last count"
          aria-label="Undo"
        >
          <mat-icon>undo</mat-icon>
        </button>
        <button
          mat-icon-button
          (click)="onResetClick()"
          [disabled]="count() === 0"
          matTooltip="Reset counter"
          aria-label="Reset counter"
        >
          <mat-icon>refresh</mat-icon>
        </button>
      </div>

      @if (isComplete()) {
        <div class="completion-banner">
          <mat-icon>celebration</mat-icon>
          <span>Target reached! Session saved!</span>
        </div>
      }
    </div>
  `,
  styles: `
    :host {
      display: block;
    }

    .counter-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 24px;
      padding: 16px;
    }

    .today-badge {
      background: var(--mat-sys-tertiary-container);
      color: var(--mat-sys-on-tertiary-container);
      padding: 6px 18px;
      border-radius: 20px;
      font-size: 13px;
      font-weight: 500;
      letter-spacing: 0.3px;
    }

    .stats-row {
      display: flex;
      gap: 48px;
      justify-content: center;
    }

    .stat-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
    }

    .stat-label {
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 1px;
      opacity: 0.7;
    }

    .stat-value {
      font-size: 24px;
      font-weight: 500;
    }

    .progress-wrapper {
      position: relative;
      width: 240px;
      height: 240px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .progress-bg {
      position: absolute;
      opacity: 0.15;
    }

    .progress-fg {
      position: absolute;
    }

    .tap-button {
      width: 180px !important;
      height: 180px !important;
      border-radius: 50% !important;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: transform 0.15s ease;
      z-index: 1;
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
    }

    .tap-button:active {
      transform: scale(0.92);
    }

    .tap-button.pulse {
      animation: pulse-anim 0.3s ease-out;
    }

    @keyframes pulse-anim {
      0% { transform: scale(1); }
      50% { transform: scale(0.93); }
      100% { transform: scale(1); }
    }

    .count-display {
      font-size: 42px;
      font-weight: 300;
      line-height: 1;
    }

    .tap-label {
      font-size: 12px;
      letter-spacing: 2px;
      opacity: 0.8;
      margin-top: 4px;
    }

    .progress-text {
      font-size: 14px;
      opacity: 0.6;
    }

    .action-row {
      display: flex;
      gap: 16px;
    }

    .completion-banner {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 24px;
      border-radius: 24px;
      background: var(--mat-sys-primary-container);
      color: var(--mat-sys-on-primary-container);
      font-weight: 500;
      animation: fade-in 0.5s ease;
    }

    @keyframes fade-in {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `,
})
export class CounterComponent {
  private readonly storage = inject(StorageService);
  private readonly feedback = inject(FeedbackService);
  private readonly auth = inject(AuthService);
  private readonly db = inject(DbService);
  private readonly snackBar = inject(MatSnackBar);

  readonly count = signal(0);
  readonly target = signal(108);
  readonly isPulsing = signal(false);
  readonly todayTotal = signal(0);

  private sessionSaved = false;

  readonly remaining = computed(() => Math.max(0, this.target() - this.count()));
  readonly progressPercent = computed(() => {
    const t = this.target();
    if (t <= 0) return 0;
    return Math.min(100, (this.count() / t) * 100);
  });
  readonly isComplete = computed(() => this.count() >= this.target() && this.target() > 0);

  constructor() {
    const saved = this.storage.get('counterState', DEFAULT_COUNTER_STATE);
    this.count.set(saved.count);
    this.target.set(saved.target);
    this.refreshTodayTotal();

    effect(() => {
      this.storage.set('counterState', {
        count: this.count(),
        target: this.target(),
      });
    });
  }

  increment(): void {
    this.count.update((c) => c + 1);
    this.triggerPulse();
    this.triggerFeedback();

    // Save session when target is reached
    if (this.count() >= this.target() && !this.sessionSaved) {
      this.saveSession();
    }
  }

  undo(): void {
    if (this.count() > 0) {
      this.count.update((c) => c - 1);
      // Allow re-saving if they undo past target
      if (this.count() < this.target()) {
        this.sessionSaved = false;
      }
    }
  }

  onResetClick(): void {
    const settings = this.storage.get<AppSettings>('appSettings', DEFAULT_SETTINGS);
    if (settings.resetConfirmation) {
      const ref = this.snackBar.open('Reset counter to 0?', 'Reset', { duration: 5000 });
      ref.onAction().subscribe(() => {
        this.reset();
        this.snackBar.open('Counter reset', 'OK', { duration: 1500 });
      });
    } else {
      this.reset();
    }
  }

  reset(): void {
    this.count.set(0);
    this.sessionSaved = false;
  }

  setTarget(value: number): void {
    this.target.set(value);
    this.sessionSaved = false;
  }

  private saveSession(): void {
    const user = this.auth.currentUser();
    if (!user) return;

    const now = new Date();
    const session: JapaSession = {
      id: Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
      userId: user.id,
      date: now.toISOString().split('T')[0],
      count: this.count(),
      target: this.target(),
      mantraName: 'Default',
      completedAt: now.toISOString(),
    };
    this.db.addSession(session);
    this.sessionSaved = true;
    this.refreshTodayTotal();
  }

  private refreshTodayTotal(): void {
    const user = this.auth.currentUser();
    if (!user) return;
    const todaySessions = this.db.getTodaySessions(user.id);
    this.todayTotal.set(todaySessions.reduce((sum, s) => sum + s.count, 0));
  }

  private triggerPulse(): void {
    this.isPulsing.set(true);
    setTimeout(() => this.isPulsing.set(false), 300);
  }

  private triggerFeedback(): void {
    const settings = this.storage.get<AppSettings>('appSettings', DEFAULT_SETTINGS);
    if (settings.vibrationEnabled) {
      this.feedback.vibrate(settings.vibrationDuration);
    }
    if (settings.soundEnabled) {
      this.feedback.playClick();
    }
  }
}
