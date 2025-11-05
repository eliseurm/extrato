import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, InputTextModule, PasswordModule, ButtonModule],
  template: `
  <div class="login-wrapper">
    <h2>Admin Login</h2>
    <form (ngSubmit)="onSubmit()" #f="ngForm" class="form">
      <label>Usuário</label>
      <input pInputText name="username" [(ngModel)]="username" required autocomplete="username" />

      <label>Senha</label>
      <input pInputText type="password" name="password" [(ngModel)]="password" required autocomplete="current-password" />

      <button pButton type="submit" label="Entrar" [disabled]="loading || !f.form.valid"></button>
      <span *ngIf="erro" class="erro">{{ erro }}</span>
    </form>
    <p class="hint">Acessos públicos do extrato continuam disponíveis via link direto (/:slug).</p>
  </div>
  `,
  styles: [`
    .login-wrapper { max-width: 360px; margin: 10vh auto; padding: 2rem; background: #fff; border-radius: 8px; box-shadow: 0 2px 12px rgba(0,0,0,.08); }
    h2 { margin-top: 0; }
    .form { display: flex; flex-direction: column; gap: .5rem; }
    label { font-size: .85rem; color: #555; }
    .erro { color: #b00020; margin-left: .5rem; }
    .hint { margin-top: 1rem; color: #666; font-size: .85rem; }
  `]
})
export class LoginComponent {
  username = '';
  password = '';
  loading = false;
  erro: string | null = null;

  constructor(private auth: AuthService, private router: Router) {}

  onSubmit() {
    if (this.loading) return;
    this.erro = null;
    this.loading = true;
    this.auth.login(this.username, this.password).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigateByUrl('/admin/pessoas');
      },
      error: (e) => {
        this.loading = false;
        this.erro = e?.status === 401 ? 'Usuário ou senha inválidos' : 'Erro ao autenticar';
      }
    });
  }
}
