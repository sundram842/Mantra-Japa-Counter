import { Component, inject, PLATFORM_ID, viewChild } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { CounterComponent } from './features/counter/counter.component';
import { SettingsComponent } from './features/settings/settings.component';
import { ThemeService } from './core/theme.service';
import { StorageService } from './core/storage.service';
import { DEFAULT_SETTINGS } from './shared/models/settings.model';

@Component({
  selector: 'app-root',
  imports: [
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatSnackBarModule,
    CounterComponent,
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly storage = inject(StorageService);
  private readonly platformId = inject(PLATFORM_ID);
  readonly themeService = inject(ThemeService);

  readonly counter = viewChild.required(CounterComponent);

  openSettings(): void {
    const dialogRef = this.dialog.open(SettingsComponent, {
      width: '90vw',
      maxWidth: '440px',
      autoFocus: false,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.counter().setTarget(result.target);
        this.snackBar.open('Settings saved', 'OK', { duration: 2000 });
      }
    });
  }

  onResetRequested(): void {
    const settings = this.storage.get('appSettings', DEFAULT_SETTINGS);
    if (settings.resetConfirmation) {
      this.confirmReset();
    } else {
      this.counter().reset();
    }
  }

  private confirmReset(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const ref = this.snackBar.open('Reset counter to 0?', 'Reset', {
      duration: 5000,
    });
    ref.onAction().subscribe(() => {
      this.counter().reset();
      this.snackBar.open('Counter reset', 'OK', { duration: 1500 });
    });
  }

  toggleTheme(): void {
    this.themeService.toggle();
    const settings = this.storage.get('appSettings', DEFAULT_SETTINGS);
    settings.darkMode = this.themeService.isDark();
    this.storage.set('appSettings', settings);
  }
}
