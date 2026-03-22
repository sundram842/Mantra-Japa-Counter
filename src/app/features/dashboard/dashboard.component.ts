import {
  Component,
  inject,
  signal,
  computed,
  ElementRef,
  viewChild,
  afterNextRender,
  PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDividerModule } from '@angular/material/divider';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/auth.service';
import { DbService } from '../../core/db.service';
import { JapaSession } from '../../shared/models/user.model';

type RangeOption = '7d' | '30d' | '90d';

interface DayData {
  date: string;
  label: string;
  count: number;
  sessions: number;
}

@Component({
  selector: 'app-dashboard',
  imports: [
    MatCardModule,
    MatIconModule,
    MatButtonToggleModule,
    MatDividerModule,
    FormsModule,
  ],
  template: `
    <div class="dashboard">
      <!-- Summary Cards -->
      <div class="summary-row">
        <mat-card class="summary-card">
          <mat-icon class="summary-icon today-icon">today</mat-icon>
          <div class="summary-info">
            <span class="summary-value">{{ todayCount() }}</span>
            <span class="summary-label">Today's Japas</span>
          </div>
        </mat-card>

        <mat-card class="summary-card">
          <mat-icon class="summary-icon total-icon">functions</mat-icon>
          <div class="summary-info">
            <span class="summary-value">{{ totalCount() }}</span>
            <span class="summary-label">Total Japas</span>
          </div>
        </mat-card>

        <mat-card class="summary-card">
          <mat-icon class="summary-icon session-icon">flag</mat-icon>
          <div class="summary-info">
            <span class="summary-value">{{ totalSessions() }}</span>
            <span class="summary-label">Sessions</span>
          </div>
        </mat-card>

        <mat-card class="summary-card">
          <mat-icon class="summary-icon streak-icon">local_fire_department</mat-icon>
          <div class="summary-info">
            <span class="summary-value">{{ currentStreak() }}</span>
            <span class="summary-label">Day Streak</span>
          </div>
        </mat-card>
      </div>

      <!-- Bar Chart -->
      <mat-card class="chart-card">
        <div class="chart-header">
          <h3>Japa History</h3>
          <mat-button-toggle-group
            [(ngModel)]="selectedRange"
            (ngModelChange)="onRangeChange()"
          >
            <mat-button-toggle value="7d">7 Days</mat-button-toggle>
            <mat-button-toggle value="30d">30 Days</mat-button-toggle>
            <mat-button-toggle value="90d">90 Days</mat-button-toggle>
          </mat-button-toggle-group>
        </div>

        <div class="chart-wrapper">
          <canvas #barChart width="800" height="300"></canvas>
        </div>
      </mat-card>

      <!-- Recent Sessions -->
      <mat-card class="sessions-card">
        <h3>Recent Sessions</h3>
        <mat-divider />

        @if (recentSessions().length === 0) {
          <div class="empty-state">
            <mat-icon>self_improvement</mat-icon>
            <p>No sessions yet. Start counting your japas!</p>
          </div>
        }

        @for (session of recentSessions(); track session.id) {
          <div class="session-row">
            <div class="session-info">
              <span class="session-date">{{ formatDate(session.completedAt) }}</span>
              <span class="session-mantra">{{ session.mantraName }}</span>
            </div>
            <div class="session-stats">
              <span class="session-count">{{ session.count }}</span>
              <span class="session-target">/ {{ session.target }}</span>
            </div>
          </div>
        }
      </mat-card>
    </div>
  `,
  styles: `
    .dashboard {
      padding: 16px;
      max-width: 800px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .summary-row {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
    }

    @media (min-width: 600px) {
      .summary-row {
        grid-template-columns: repeat(4, 1fr);
      }
    }

    .summary-card {
      padding: 16px;
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .summary-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
      opacity: 0.8;
    }

    .today-icon { color: var(--mat-sys-primary); }
    .total-icon { color: var(--mat-sys-tertiary); }
    .session-icon { color: var(--mat-sys-secondary); }
    .streak-icon { color: #ff6b35; }

    .summary-info {
      display: flex;
      flex-direction: column;
    }

    .summary-value {
      font-size: 22px;
      font-weight: 600;
      line-height: 1.2;
    }

    .summary-label {
      font-size: 11px;
      opacity: 0.6;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .chart-card {
      padding: 20px;
    }

    .chart-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;
      margin-bottom: 16px;
    }

    .chart-header h3 {
      margin: 0;
      font-size: 18px;
      font-weight: 500;
    }

    .chart-wrapper {
      width: 100%;
      overflow-x: auto;
    }

    .chart-wrapper canvas {
      width: 100%;
      height: 250px;
    }

    .sessions-card {
      padding: 20px;
    }

    .sessions-card h3 {
      margin: 0 0 12px;
      font-size: 18px;
      font-weight: 500;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 32px 16px;
      opacity: 0.5;
      gap: 8px;
    }

    .empty-state mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
    }

    .session-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 0;
      border-bottom: 1px solid var(--mat-sys-outline-variant);
    }

    .session-row:last-child {
      border-bottom: none;
    }

    .session-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .session-date {
      font-size: 14px;
      font-weight: 500;
    }

    .session-mantra {
      font-size: 12px;
      opacity: 0.6;
    }

    .session-stats {
      text-align: right;
    }

    .session-count {
      font-size: 18px;
      font-weight: 600;
      color: var(--mat-sys-primary);
    }

    .session-target {
      font-size: 13px;
      opacity: 0.5;
    }
  `,
})
export class DashboardComponent {
  private readonly auth = inject(AuthService);
  private readonly db = inject(DbService);
  private readonly platformId = inject(PLATFORM_ID);

  readonly barChartRef = viewChild<ElementRef<HTMLCanvasElement>>('barChart');

  selectedRange: RangeOption = '7d';

  private allSessions = signal<JapaSession[]>([]);

  readonly todayCount = computed(() => {
    const today = new Date().toISOString().split('T')[0];
    return this.allSessions()
      .filter((s) => s.date === today)
      .reduce((sum, s) => sum + s.count, 0);
  });

  readonly totalCount = computed(() =>
    this.allSessions().reduce((sum, s) => sum + s.count, 0)
  );

  readonly totalSessions = computed(() => this.allSessions().length);

  readonly currentStreak = computed(() => {
    const sessions = this.allSessions();
    if (sessions.length === 0) return 0;

    const dates = new Set(sessions.map((s) => s.date));
    let streak = 0;
    const d = new Date();

    // Check if today has sessions, if not start from yesterday
    const todayStr = d.toISOString().split('T')[0];
    if (!dates.has(todayStr)) {
      d.setDate(d.getDate() - 1);
    }

    while (true) {
      const dateStr = d.toISOString().split('T')[0];
      if (dates.has(dateStr)) {
        streak++;
        d.setDate(d.getDate() - 1);
      } else {
        break;
      }
    }
    return streak;
  });

  readonly recentSessions = computed(() => {
    return [...this.allSessions()]
      .sort((a, b) => b.completedAt.localeCompare(a.completedAt))
      .slice(0, 10);
  });

  constructor() {
    this.loadData();

    afterNextRender(() => {
      this.drawChart();
    });
  }

  onRangeChange(): void {
    this.drawChart();
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  private loadData(): void {
    const user = this.auth.currentUser();
    if (!user) return;
    this.allSessions.set(this.db.getSessions(user.id));
  }

  private getDayData(): DayData[] {
    const days = this.selectedRange === '7d' ? 7 : this.selectedRange === '30d' ? 30 : 90;
    const result: DayData[] = [];
    const sessions = this.allSessions();

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const daySessions = sessions.filter((s) => s.date === dateStr);
      result.push({
        date: dateStr,
        label:
          days <= 7
            ? d.toLocaleDateString('en', { weekday: 'short' })
            : d.toLocaleDateString('en', { day: 'numeric', month: 'short' }),
        count: daySessions.reduce((sum, s) => sum + s.count, 0),
        sessions: daySessions.length,
      });
    }
    return result;
  }

  private drawChart(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const canvasEl = this.barChartRef()?.nativeElement;
    if (!canvasEl) return;

    const ctx = canvasEl.getContext('2d');
    if (!ctx) return;

    const data = this.getDayData();
    const dpr = window.devicePixelRatio || 1;

    // Get CSS-computed colors for theme compatibility
    const style = getComputedStyle(document.documentElement);
    const primaryColor = style.getPropertyValue('--mat-sys-primary').trim() || '#e65100';
    const surfaceColor =
      style.getPropertyValue('--mat-sys-surface-container').trim() || '#f5f5f5';
    const textColor =
      style.getPropertyValue('--mat-sys-on-surface').trim() || '#333';
    const outlineColor =
      style.getPropertyValue('--mat-sys-outline-variant').trim() || '#ddd';

    // Size canvas for DPR
    const cssWidth = canvasEl.clientWidth;
    const cssHeight = canvasEl.clientHeight;
    canvasEl.width = cssWidth * dpr;
    canvasEl.height = cssHeight * dpr;
    ctx.scale(dpr, dpr);

    // Clear
    ctx.clearRect(0, 0, cssWidth, cssHeight);

    const padding = { top: 20, right: 16, bottom: 40, left: 50 };
    const chartW = cssWidth - padding.left - padding.right;
    const chartH = cssHeight - padding.top - padding.bottom;

    const maxVal = Math.max(1, ...data.map((d) => d.count));
    const barWidth = Math.max(4, (chartW / data.length) * 0.6);
    const gap = chartW / data.length;

    // Grid lines
    ctx.strokeStyle = outlineColor;
    ctx.lineWidth = 0.5;
    const gridLines = 5;
    for (let i = 0; i <= gridLines; i++) {
      const y = padding.top + chartH - (chartH / gridLines) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(cssWidth - padding.right, y);
      ctx.stroke();

      // Y-axis labels
      ctx.fillStyle = textColor;
      ctx.font = '11px Roboto, sans-serif';
      ctx.textAlign = 'right';
      ctx.globalAlpha = 0.6;
      ctx.fillText(
        Math.round((maxVal / gridLines) * i).toString(),
        padding.left - 8,
        y + 4
      );
    }
    ctx.globalAlpha = 1;

    // Bars
    data.forEach((d, i) => {
      const x = padding.left + gap * i + (gap - barWidth) / 2;
      const barH = maxVal > 0 ? (d.count / maxVal) * chartH : 0;
      const y = padding.top + chartH - barH;

      // Bar
      ctx.fillStyle = d.count > 0 ? primaryColor : surfaceColor;
      ctx.beginPath();
      const radius = Math.min(barWidth / 2, 6);
      if (barH > radius * 2) {
        ctx.moveTo(x, y + barH);
        ctx.lineTo(x, y + radius);
        ctx.arcTo(x, y, x + radius, y, radius);
        ctx.lineTo(x + barWidth - radius, y);
        ctx.arcTo(x + barWidth, y, x + barWidth, y + radius, radius);
        ctx.lineTo(x + barWidth, y + barH);
      } else if (barH > 0) {
        ctx.rect(x, y, barWidth, barH);
      } else {
        // Minimum visual indicator
        ctx.fillStyle = outlineColor;
        ctx.rect(x, padding.top + chartH - 2, barWidth, 2);
      }
      ctx.fill();

      // Count on top of bar
      if (d.count > 0) {
        ctx.fillStyle = textColor;
        ctx.font = 'bold 10px Roboto, sans-serif';
        ctx.textAlign = 'center';
        ctx.globalAlpha = 0.8;
        ctx.fillText(d.count.toString(), x + barWidth / 2, y - 6);
        ctx.globalAlpha = 1;
      }

      // X-axis labels
      ctx.fillStyle = textColor;
      ctx.font = '10px Roboto, sans-serif';
      ctx.textAlign = 'center';
      ctx.globalAlpha = 0.6;

      // For 90 days, only show every 7th label
      const showLabel =
        data.length <= 14 || i % 7 === 0 || i === data.length - 1;
      if (showLabel) {
        ctx.fillText(d.label, x + barWidth / 2, cssHeight - padding.bottom + 20);
      }
      ctx.globalAlpha = 1;
    });
  }
}
