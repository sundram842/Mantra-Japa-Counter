import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSliderModule } from '@angular/material/slider';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { StorageService } from '../../core/storage.service';
import { ThemeService } from '../../core/theme.service';
import { AppSettings, DEFAULT_SETTINGS } from '../../shared/models/settings.model';

export interface SettingsDialogData {
  currentTarget: number;
}

@Component({
  selector: 'app-settings',
  imports: [
    FormsModule,
    MatButtonModule,
    MatDialogModule,
    MatSlideToggleModule,
    MatSliderModule,
    MatInputModule,
    MatFormFieldModule,
    MatIconModule,
    MatDividerModule,
  ],
  template: `
    <h2 mat-dialog-title>
      <mat-icon>settings</mat-icon>
      Settings
    </h2>

    <mat-dialog-content>
      <!-- Target Count -->
      <section class="settings-section">
        <h3>Target Count</h3>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Target</mat-label>
          <input
            matInput
            type="number"
            [(ngModel)]="targetValue"
            min="1"
            max="100000"
            placeholder="e.g. 108"
          />
          <mat-hint>Min: 1, Max: 1,00,000</mat-hint>
        </mat-form-field>
        <div class="preset-chips">
          @for (preset of presets; track preset) {
            <button
              mat-stroked-button
              (click)="targetValue = preset"
              [class.active]="targetValue === preset"
            >
              {{ preset }}
            </button>
          }
        </div>
      </section>

      <mat-divider />

      <!-- Feedback Settings -->
      <section class="settings-section">
        <h3>Feedback</h3>

        <div class="setting-row">
          <div class="setting-info">
            <span>Vibration</span>
            <span class="setting-desc">Haptic feedback on tap</span>
          </div>
          <mat-slide-toggle [(ngModel)]="settings.vibrationEnabled" />
        </div>

        @if (settings.vibrationEnabled) {
          <div class="setting-row slider-row">
            <span class="slider-label">Duration: {{ settings.vibrationDuration }}ms</span>
            <mat-slider min="20" max="200" step="10" class="full-width">
              <input matSliderThumb [(ngModel)]="settings.vibrationDuration" />
            </mat-slider>
          </div>
        }

        <div class="setting-row">
          <div class="setting-info">
            <span>Sound</span>
            <span class="setting-desc">Click sound on tap</span>
          </div>
          <mat-slide-toggle [(ngModel)]="settings.soundEnabled" />
        </div>
      </section>

      <mat-divider />

      <!-- Behavior -->
      <section class="settings-section">
        <h3>Behavior</h3>

        <div class="setting-row">
          <div class="setting-info">
            <span>Reset Confirmation</span>
            <span class="setting-desc">Ask before resetting counter</span>
          </div>
          <mat-slide-toggle [(ngModel)]="settings.resetConfirmation" />
        </div>
      </section>

      <mat-divider />

      <!-- Appearance -->
      <section class="settings-section">
        <h3>Appearance</h3>

        <div class="setting-row">
          <div class="setting-info">
            <span>Dark Mode</span>
            <span class="setting-desc">Switch to dark theme</span>
          </div>
          <mat-slide-toggle
            [ngModel]="themeService.isDark()"
            (ngModelChange)="onDarkModeChange($event)"
          />
        </div>
      </section>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancel</button>
      <button mat-flat-button (click)="onSave()">Save</button>
    </mat-dialog-actions>
  `,
  styles: `
    [mat-dialog-title] {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    mat-dialog-content {
      min-width: 300px;
      max-width: 400px;
    }

    .settings-section {
      padding: 16px 0;
    }

    .settings-section h3 {
      margin: 0 0 12px;
      font-size: 14px;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      opacity: 0.7;
    }

    .full-width {
      width: 100%;
    }

    .preset-chips {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      margin-top: 8px;
    }

    .preset-chips button {
      min-width: auto;
      font-size: 13px;
    }

    .preset-chips button.active {
      background: var(--mat-sys-primary-container);
      color: var(--mat-sys-on-primary-container);
    }

    .setting-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 0;
    }

    .setting-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .setting-desc {
      font-size: 12px;
      opacity: 0.6;
    }

    .slider-row {
      flex-direction: column;
      align-items: flex-start;
      gap: 4px;
    }

    .slider-label {
      font-size: 13px;
      opacity: 0.7;
    }
  `,
})
export class SettingsComponent {
  private readonly storage = inject(StorageService);
  private readonly dialogRef = inject(MatDialogRef<SettingsComponent>);
  readonly themeService = inject(ThemeService);

  readonly presets = [108, 216, 432, 1000, 1008];

  settings: AppSettings;
  targetValue: number;

  constructor() {
    this.settings = { ...this.storage.get<AppSettings>('appSettings', DEFAULT_SETTINGS) };
    const counterState = this.storage.get('counterState', { count: 0, target: 108 });
    this.targetValue = counterState.target;
  }

  onDarkModeChange(dark: boolean): void {
    this.settings.darkMode = dark;
    this.themeService.setDark(dark);
  }

  onCancel(): void {
    // Revert dark mode if changed
    const saved = this.storage.get<AppSettings>('appSettings', DEFAULT_SETTINGS);
    if (saved.darkMode !== this.settings.darkMode) {
      this.themeService.setDark(saved.darkMode);
    }
    this.dialogRef.close(null);
  }

  onSave(): void {
    // Validate target
    if (this.targetValue < 1) this.targetValue = 1;
    if (this.targetValue > 100000) this.targetValue = 100000;
    this.targetValue = Math.floor(this.targetValue);

    this.storage.set('appSettings', this.settings);
    this.dialogRef.close({ settings: this.settings, target: this.targetValue });
  }
}
