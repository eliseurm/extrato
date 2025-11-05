import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { InputTextModule } from 'primeng/inputtext';
import { MessageService } from 'primeng/api';

interface PessoaMagicDto {
  contato: string;
  primeiroNome: string;
  numeroMagico: string;
  slug: string;
}

@Component({
  selector: 'app-admin-pessoas',
  standalone: true,
  imports: [CommonModule, ButtonModule, TableModule, ToastModule, InputTextModule],
  providers: [MessageService],
  template: `
  <div class="container">
    <div class="topbar">
      <h2>Pessoas cadastradas</h2>
      <div class="actions">
        <span class="filter">
          <input pInputText type="text" placeholder="Filtrar por nome" (input)="dt.filterGlobal($any($event.target).value, 'contains')" />
        </span>
        <input type="file" (change)="onFile($event)" accept=".csv" />
        <button pButton label="Importar CSV" (click)="upload()" [disabled]="!file || uploading"></button>
        <button pButton label="Sair" class="p-button-secondary" (click)="logout()"></button>
      </div>
    </div>

    <p-table #dt [value]="pessoas" [tableStyle]="{ 'min-width': '50rem' }" [paginator]="true" [rows]="10" [globalFilterFields]="['contato','primeiroNome']">
      <ng-template pTemplate="header">
        <tr>
          <th>Contato</th>
          <th>Primeiro Nome</th>
          <th>Magic</th>
          <th>Slug</th>
          <th style="width:140px">Ações</th>
        </tr>
      </ng-template>
      <ng-template pTemplate="body" let-p>
        <tr>
          <td>{{ p.contato }}</td>
          <td>{{ p.primeiroNome }}</td>
          <td>{{ p.numeroMagico }}</td>
          <td>{{ p.slug }}</td>
          <td>
            <button pButton size="small" label="Abrir link" (click)="openLink(p)"></button>
          </td>
        </tr>
      </ng-template>
    </p-table>

    <p *ngIf="loading" class="hint">Carregando...</p>
  </div>

  <p-toast></p-toast>
  `,
  styles: [`
    .container { padding: 1rem; }
    .topbar { display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
    .actions { display: flex; align-items: center; gap: .5rem; flex-wrap: wrap; }
    .actions .filter { margin-right: auto; }
    .hint { color: #666; }
  `]
})
export class AdminPessoasComponent implements OnInit {
  pessoas: PessoaMagicDto[] = [];
  loading = false;
  file: File | null = null;
  uploading = false;

  constructor(private http: HttpClient, private msg: MessageService) {}

  ngOnInit(): void {
    this.fetch();
  }

  fetch(): void {
    this.loading = true;
    this.http.get<PessoaMagicDto[]>('/api/admin/pessoas').subscribe({
      next: (res) => { this.pessoas = res; this.loading = false; },
      error: () => { this.loading = false; this.msg.add({severity:'error', summary:'Erro', detail:'Falha ao carregar pessoas'}); }
    });
  }

  onFile(ev: Event): void {
    const input = ev.target as HTMLInputElement;
    this.file = (input.files && input.files.length) ? input.files[0] : null;
  }

  upload(): void {
    if (!this.file) return;
    this.uploading = true;
    const form = new FormData();
    form.append('file', this.file);
    this.http.post('/api/admin/importacao/csv', form).subscribe({
      next: () => {
        this.uploading = false;
        this.msg.add({severity:'success', summary:'Importado', detail:'Importação concluída'});
        this.fetch();
      },
      error: (e) => {
        this.uploading = false;
        const detail = e?.error?.message || 'Falha ao importar CSV';
        this.msg.add({severity:'error', summary:'Erro', detail});
      }
    });
  }

  copyLink(p: PessoaMagicDto) {
    const url = `${location.origin}/${p.slug}`;
    navigator.clipboard.writeText(url).then(() => {
      this.msg.add({severity:'success', summary:'Copiado', detail:'Link copiado para a área de transferência'});
    }).catch(() => {
      this.msg.add({severity:'warn', summary:'Atenção', detail:'Não foi possível copiar automaticamente'});
    });
  }

  openLink(p: PessoaMagicDto) {
    const url = `${location.origin}/${p.slug}`;
    window.open(url, '_blank');
  }

  logout() {
    localStorage.removeItem('auth_token');
    location.href = '/';
  }
}
