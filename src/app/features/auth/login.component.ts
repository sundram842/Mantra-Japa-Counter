import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-login',
  imports: [
    FormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
  ],
  template: `
    <div class="auth-page">
      <mat-card class="auth-card">
        <mat-card-header>
          <mat-icon mat-card-avatar class="auth-avatar">self_improvement</mat-icon>
          <mat-card-title>Welcome Back</mat-card-title>
          <mat-card-subtitle>Sign in to your Japa Counter</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          @if (error()) {
            <div class="error-msg">{{ error() }}</div>
          }

          <form (ngSubmit)="onLogin()" class="auth-form">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Email</mat-label>
              <input matInput type="email" [(ngModel)]="email" name="email" required />
              <mat-icon matPrefix>email</mat-icon>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Password</mat-label>
              <input
                matInput
                [type]="showPassword() ? 'text' : 'password'"
                [(ngModel)]="password"
                name="password"
                required
              />
              <mat-icon matPrefix>lock</mat-icon>
              <button
                mat-icon-button
                matSuffix
                type="button"
                (click)="showPassword.set(!showPassword())"
              >
                <mat-icon>{{ showPassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
            </mat-form-field>

            <button
              mat-flat-button
              class="full-width submit-btn"
              type="submit"
              [disabled]="!email || !password"
            >
              Sign In
            </button>
          </form>
        </mat-card-content>

        <mat-card-actions align="end">
          <span class="auth-link-text">Don't have an account?</span>
          <a mat-button routerLink="/register" color="primary">Register</a>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: `
    .auth-page {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100dvh;
      padding: 16px;
      background: var(--mat-sys-surface-dim);
    }

    .auth-card {
      width: 100%;
      max-width: 420px;
      padding: 24px;
    }

    .auth-avatar {
      background: var(--mat-sys-primary-container);
      color: var(--mat-sys-on-primary-container);
      border-radius: 50%;
      width: 48px !important;
      height: 48px !important;
      font-size: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .auth-form {
      display: flex;
      flex-direction: column;
      gap: 4px;
      margin-top: 24px;
    }

    .full-width {
      width: 100%;
    }

    .submit-btn {
      height: 48px;
      font-size: 16px;
      margin-top: 8px;
    }

    .error-msg {
      background: var(--mat-sys-error-container);
      color: var(--mat-sys-on-error-container);
      padding: 12px 16px;
      border-radius: 8px;
      font-size: 14px;
      margin-top: 16px;
    }

    .auth-link-text {
      font-size: 14px;
      opacity: 0.7;
    }

    mat-card-actions {
      display: flex;
      align-items: center;
      gap: 4px;
    }
  `,
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  email = '';
  password = '';
  readonly error = signal('');
  readonly showPassword = signal(false);

  onLogin(): void {
    this.error.set('');
    const result = this.auth.login(this.email, this.password);
    if (result.success) {
      this.router.navigate(['/counter']);
    } else {
      this.error.set(result.error ?? 'Login failed.');
    }
  }
}
