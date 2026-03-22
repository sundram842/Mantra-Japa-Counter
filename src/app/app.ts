import { Component, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatMenuModule } from '@angular/material/menu';
import { ThemeService } from './core/theme.service';
import { AuthService } from './core/auth.service';
import { StorageService } from './core/storage.service';
import { SettingsComponent } from './features/settings/settings.component';
import { DEFAULT_SETTINGS } from './shared/models/settings.model';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatSnackBarModule,
    MatMenuModule,
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly storage = inject(StorageService);
  readonly themeService = inject(ThemeService);
  readonly auth = inject(AuthService);

  openSettings(): void {
    const dialogRef = this.dialog.open(SettingsComponent, {
      width: '90vw',
      maxWidth: '440px',
      autoFocus: false,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.snackBar.open('Settings saved', 'OK', { duration: 2000 });
      }
    });
  }

  toggleTheme(): void {
    this.themeService.toggle();
    const settings = this.storage.get('appSettings', DEFAULT_SETTINGS);
    settings.darkMode = this.themeService.isDark();
    this.storage.set('appSettings', settings);
  }

  logout(): void {
    this.auth.logout();
  }
}
