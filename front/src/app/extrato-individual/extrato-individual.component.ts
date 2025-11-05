import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ExtratoResponse, ExtratoService, LancamentoDto } from '../extrato.service';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

interface GroupedLancamentos {
  projeto: string;
  categorias: { nome: string | null; itens: LancamentoDto[] }[];
}

@Component({
  selector: 'app-extrato-individual',
  standalone: true,
  imports: [CommonModule, ScrollingModule, TableModule, TagModule, ProgressSpinnerModule],
  template: `
  <div class="container">
    <h2 *ngIf="nome" class="titulo">Extrato de {{ nome }}</h2>

    <p *ngIf="loading" class="loading"><p-progressSpinner styleClass="w-3rem h-3rem"></p-progressSpinner></p>
    <p *ngIf="!loading && erro" class="erro">{{ erro }}</p>

    <cdk-virtual-scroll-viewport *ngIf="!loading && grouped.length" itemSize="64" class="viewport">
      <div *cdkVirtualFor="let grupo of grouped" class="grupo">
        <h3 class="grupo-titulo">Projeto: {{ grupo.projeto }}</h3>

        <div *ngFor="let cat of grupo.categorias" class="categoria-bloco">
          <h4 class="categoria-titulo">Categoria: {{ cat.nome || '—' }}</h4>
          <div class="tabela-wrapper">
            <table class="tabela" role="table">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Descrição</th>
                  <th>Tipo</th>
                  <th>Status</th>
                  <th>Valor Previsto</th>
                  <th>Valor Efetivo</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let l of cat.itens">
                  <td>{{ (l.dataEfetiva || l.dataPrevista) | date:'dd/MM/yyyy' }}</td>
                  <td>{{ l.descricao }}</td>
                  <td><p-tag [value]="l.tipo" [severity]="l.tipo === 'Receita' ? 'success' : 'danger'"></p-tag></td>
                  <td>{{ l.status }}</td>
                  <td class="num">{{ l.valorPrevisto || 0 | number:'1.2-2' }}</td>
                  <td class="num">{{ l.valorEfetivo || 0 | number:'1.2-2' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </cdk-virtual-scroll-viewport>
  </div>
  `,
  styles: [`
    .container { padding: 1rem; }
    .titulo { margin: 0 0 1rem; }
    .loading, .erro { text-align: center; margin-top: 2rem; }
    .viewport { height: calc(100vh - 120px); width: 100%; }
    .grupo { padding: .5rem 0 1rem; border-bottom: 1px solid #eee; }
    .grupo-titulo { margin: .5rem 0; }
    .categoria-titulo { margin: .5rem 0; color: #555; }
    .tabela-wrapper { overflow-x: auto; }
    .tabela { width: 100%; border-collapse: collapse; font-size: 14px; }
    .tabela th, .tabela td { padding: .5rem; border-bottom: 1px solid #eee; }
    .num { text-align: right; white-space: nowrap; }
    @media (max-width: 768px) {
      .tabela { font-size: 12px; }
    }
  `]
})
export class ExtratoIndividualComponent implements OnInit {
  nome = '';
  grouped: GroupedLancamentos[] = [];
  loading = true;
  erro: string | null = null;

  constructor(private route: ActivatedRoute, private extratoSvc: ExtratoService) {}

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('slug') || '';
    this.extratoSvc.getExtrato(slug).subscribe({
      next: (resp) => {
        this.nome = resp.pessoaNome;
        const sorted = [...resp.lancamentos].sort((a, b) => this.dateKey(a).localeCompare(this.dateKey(b)));
        const byProjeto = new Map<string, LancamentoDto[]>();
        for (const l of sorted) {
          const key = l.projeto || '';
          if (!byProjeto.has(key)) byProjeto.set(key, []);
          byProjeto.get(key)!.push(l);
        }
        this.grouped = Array.from(byProjeto.entries()).map(([projeto, itens]) => {
          const byCat = new Map<string | null, LancamentoDto[]>();
          for (const it of itens) {
            const ck = it.categoria ?? null;
            if (!byCat.has(ck)) byCat.set(ck, []);
            byCat.get(ck)!.push(it);
          }
          const categorias = Array.from(byCat.entries()).map(([nome, its]) => ({ nome, itens: its }));
          return { projeto, categorias } as GroupedLancamentos;
        });
        this.loading = false;
      },
      error: (e) => {
        this.erro = e?.status === 404 ? 'Extrato não encontrado' : 'Erro ao carregar extrato';
        this.loading = false;
      }
    });
  }

  private dateKey(l: LancamentoDto): string {
    return (l.dataEfetiva || l.dataPrevista || '9999-12-31');
  }
}
