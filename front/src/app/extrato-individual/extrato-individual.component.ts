import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ExtratoResponse, ExtratoService, LancamentoDto } from '../extrato.service';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { TableModule } from 'primeng/table';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { FormsModule } from '@angular/forms';

interface GroupedLancamentos {
  projeto: string;
  categorias: { nome: string | null; itens: LancamentoDto[] }[];
}

@Component({
  selector: 'app-extrato-individual',
  standalone: true,
  imports: [CommonModule, FormsModule, ScrollingModule, TableModule, ProgressSpinnerModule],
  template: `
  <div class="container">
    <div class="header">
      <div class="left">
        <h2 *ngIf="nome" class="titulo">Extrato de {{ nome }}</h2>
        <div class="atualizacao" *ngIf="ultimaAtualizacao">Última Atualização: {{ ultimaAtualizacao | date:'dd/MM/yyyy' }}</div>
      </div>
      <div class="right">
        <label for="anoSel">Ano:</label>
        <select id="anoSel" [(ngModel)]="selectedYear" (ngModelChange)="onYearChange($event)" [disabled]="!yearOptions.length">
          <option *ngFor="let y of yearOptions" [value]="y">{{ y }}</option>
        </select>
      </div>
    </div>

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
                  <th>Tipo</th>
                  <th>Data prevista</th>
                  <th>Data efetivada</th>
                  <th>Status</th>
                  <th>Descrição</th>
                  <th class="num">Valor efetivado</th>
                  <th class="num">Valor previsto</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let l of cat.itens">
                  <td>{{ l.tipo }}</td>
                  <td>{{ l.dataPrevista | date:'dd/MM/yyyy' }}</td>
                  <td>{{ l.dataEfetiva | date:'dd/MM/yyyy' }}</td>
                  <td [ngClass]="statusClass(l.status)">{{ l.status }}</td>
                  <td>{{ l.descricao }}</td>
                  <td class="num">{{ (l.valorEfetivo || 0) | number:'1.2-2' }}</td>
                  <td class="num">{{ (l.valorPrevisto || 0) | number:'1.2-2' }}</td>
                </tr>
              </tbody>
              <tfoot>
                <tr class="totais">
                  <td colspan="7">
                    <div class="totais-wrap">
                      <span class="total total-confirmado">Total confirmado: {{ totalPorStatus(cat.itens, 'Confirmado') | number:'1.2-2' }}</span>
                      <span class="total total-pendente">Total pendente: {{ totalPorStatus(cat.itens, 'Pendente') | number:'1.2-2' }}</span>
                      <span class="total total-agendado">Total agendado: {{ totalPorStatus(cat.itens, 'Agendado') | number:'1.2-2' }}</span>
                    </div>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </cdk-virtual-scroll-viewport>
  </div>
  `,
  styles: [`
    .container { padding: .5rem .75rem; }
    .header { display: flex; align-items: flex-end; justify-content: space-between; gap: 1rem; flex-wrap: wrap; }
    .left { display: flex; flex-direction: column; gap: .15rem; }
    .right { margin-left: auto; }
    .titulo { margin: 0; font-size: 1rem; }
    .atualizacao { font-size: .85rem; color: #555; }
    .loading, .erro { text-align: center; margin-top: 1rem; }
    .viewport { height: calc(100vh - 96px); width: 100%; }

    /* Espaçamento entre agrupamentos */
    .grupo { padding: .5rem 0 1rem; border-bottom: 1px solid #eee; margin-bottom: 1rem; }
    .grupo-titulo { margin: .25rem 0 .5rem; font-size: .95rem; }
    .categoria-bloco { margin: 0 0 1.25rem; }
    .categoria-titulo { margin: .25rem 0 .35rem; color: #555; font-size: .9rem; }

    .tabela-wrapper { overflow-x: auto; }
    .tabela { width: 100%; border-collapse: collapse; font-size: 13px; }
    .tabela th, .tabela td { padding: .25rem .35rem; border-bottom: 1px solid #eee; line-height: 1.1; }
    .tabela th { background: #fafafa; text-align: left; font-weight: 600; }
    .num { text-align: right; white-space: nowrap; }

    .status-confirmado { color: #2e7d32; }
    .status-pendente { color: #c62828; }
    .status-agendado { color: #1565c0; }

    /* Totais alinhados à direita, empilhando no mobile */
    .totais td { padding-top: .35rem; }
    .totais { background: #fcfcfc; }
    .totais-wrap { display: flex; justify-content: flex-end; align-items: center; gap: 1rem; flex-wrap: wrap; }
    .totais .total { font-weight: 600; font-size: .9em; }
    .totais .total-confirmado { color: #2e7d32; }
    .totais .total-pendente { color: #c62828; }
    .totais .total-agendado { color: #1565c0; }

    @media (max-width: 768px) {
      .tabela { font-size: 11px; }
      .tabela th, .tabela td { padding: .2rem .25rem; }
      .titulo { font-size: .95rem; }
      .totais-wrap { flex-direction: column; align-items: flex-end; gap: .25rem; }
    }
  `]
})
export class ExtratoIndividualComponent implements OnInit {
  nome = '';
  grouped: GroupedLancamentos[] = [];
  loading = true;
  erro: string | null = null;
  ultimaAtualizacao: string | null = null;

  // Filtro por ano (anos distintos vindos do backend para a pessoa)
  yearOptions: number[] = [];
  selectedYear: number | null = null;

  private original: LancamentoDto[] = [];

  constructor(private route: ActivatedRoute, private extratoSvc: ExtratoService) {}

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('slug') || '';
    // 1ª carga sem filtro para descobrir anos e última atualização
    this.extratoSvc.getExtrato(slug).subscribe({
      next: (resp) => {
        this.nome = resp.pessoaNome;
        this.original = resp.lancamentos ?? [];
        this.ultimaAtualizacao = resp.ultimaAtualizacao ?? null;

        // usar anos vindos do backend para a pessoa
        const anos = Array.isArray(resp.anosDisponiveis) ? resp.anosDisponiveis : [];
        this.yearOptions = [...anos].sort((a,b)=> b - a);

        // Seleciona automaticamente o ano atual se existir, senão o mais recente
        const current = new Date().getFullYear();
        const initial = this.yearOptions.includes(current) ? current : (this.yearOptions[0] ?? null);
        this.selectedYear = initial;

        if (this.selectedYear != null) {
          // Buscar dados do ano selecionado (sempre refetch)
          this.fetchByYear(slug, this.selectedYear);
          return;
        }
        // Sem anos disponíveis: apenas mostra grupo vazio (ou todos já carregados)
        this.rebuildGroups();
        this.loading = false;
      },
      error: (e) => {
        this.erro = e?.status === 404 ? 'Extrato não encontrado' : 'Erro ao carregar extrato';
        this.loading = false;
      }
    });
  }

  onYearChange(_: any) {
    const slug = this.route.snapshot.paramMap.get('slug') || '';
    if (this.selectedYear != null) {
      this.fetchByYear(slug, this.selectedYear);
    }
  }

  private fetchByYear(slug: string, year: number) {
    this.loading = true;
    this.extratoSvc.getExtrato(slug, year).subscribe({
      next: (resp) => {
        this.original = resp.lancamentos ?? [];
        this.ultimaAtualizacao = resp.ultimaAtualizacao ?? null;
        this.rebuildGroups();
        this.loading = false;
      },
      error: () => { this.erro = 'Erro ao carregar extrato'; this.loading = false; }
    });
  }

  private rebuildGroups() {
    // Se não houver ano selecionado (null), usa todos os itens; caso contrário filtra pelo ano selecionado
    const base = this.selectedYear == null ? [...this.original] : this.original.filter(l => {
        return this.yearFromDate(l.dataPrevista) == this.selectedYear;
    });

    const sorted = base.sort((a, b) => {
      const cmpProj = this.compareStr(a.projeto, b.projeto);
      if (cmpProj !== 0) return cmpProj;
      const cmpCat = this.compareStr(a.categoria ?? '', b.categoria ?? '');
      if (cmpCat !== 0) return cmpCat;
      const cmpTipo = this.compareStr(a.tipo, b.tipo);
      if (cmpTipo !== 0) return cmpTipo;
      const cmpPrev = this.compareDate(a.dataPrevista, b.dataPrevista);
      if (cmpPrev !== 0) return cmpPrev;
      const cmpEfet = this.compareDate(a.dataEfetiva, b.dataEfetiva);
      if (cmpEfet !== 0) return cmpEfet;
      return this.compareStr(a.status, b.status);
    });

    const byProjeto = new Map<string, LancamentoDto[]>();
    for (const l of sorted) {
      const key = l.projeto || '';
      if (!byProjeto.has(key)) byProjeto.set(key, []);
      byProjeto.get(key)!.push(l);
    }
    // montar grupos e categorias já na ordem
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
  }

  private dateKey(l: LancamentoDto): string {
    return (l.dataEfetiva || l.dataPrevista || '9999-12-31');
  }

  statusClass(status: string | null | undefined): string {
    const s = (status || '').toLowerCase();
    if (s.includes('confirm')) return 'status-confirmado';
    if (s.includes('pend')) return 'status-pendente';
    if (s.includes('agend')) return 'status-agendado';
    return '';
  }

  totalPorStatus(items: LancamentoDto[], status: string): number {
    const target = (status || '').toLowerCase();
    return items
      .filter(i => (i.status || '').toLowerCase().includes(target))
      .reduce((sum, i) => {
        // Regra solicitada: para "Confirmado", somar valorEfetivo; demais usam valorPrevisto
        const isConfirm = target.includes('confirm');
        const val = isConfirm ? (i.valorEfetivo ?? 0) : (i.valorPrevisto ?? 0);
        return sum + val;
      }, 0);
  }

  private yearFromDate(dateStr: string | null | undefined): number | null {
    if (!dateStr) return null;
    // Expecting ISO yyyy-MM-dd or similar parseable by Date
    const m = /^\d{4}/.exec(dateStr);
    if (m) return parseInt(m[0], 10);
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? null : d.getFullYear();
  }

  private compareStr(a: string | null | undefined, b: string | null | undefined): number {
    const as = (a ?? '').toLowerCase();
    const bs = (b ?? '').toLowerCase();
    if (as < bs) return -1;
    if (as > bs) return 1;
    return 0;
  }

  private compareDate(a: string | null | undefined, b: string | null | undefined): number {
    if (!a && !b) return 0;
    if (!a) return 1; // nulls last
    if (!b) return -1;
    return a.localeCompare(b);
  }
}
