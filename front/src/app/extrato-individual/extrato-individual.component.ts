import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ActivatedRoute} from '@angular/router';
import {ExtratoResponse, ExtratoService, LancamentoDto} from '../services/extrato.service';
import {ScrollingModule} from '@angular/cdk/scrolling';
import {TableModule} from 'primeng/table';
import {ProgressSpinnerModule} from 'primeng/progressspinner';
import {FormsModule} from '@angular/forms';

interface GroupedLancamentos {
    projeto: string;
    categorias: { nome: string | null; itens: LancamentoDto[] }[];
}

@Component({
    selector: 'app-extrato-individual',
    standalone: true,
    imports: [CommonModule, FormsModule, ScrollingModule, TableModule, ProgressSpinnerModule],
    templateUrl: './extrato-individual.component.html',
    styleUrls: ['./extrato-individual.component.scss']
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

    constructor(private route: ActivatedRoute, private extratoSvc: ExtratoService) {
    }

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
                this.yearOptions = [...anos].sort((a, b) => b - a);

                // Seta o ano seleciona no back, caso ele nao exista, seta o atual
                const current = resp.anoSelecionado ?? new Date().getFullYear();
                // Se o ano corrente nao exitir no veto de anos, seto o primeiro ano do vetor
                this.selectedYear = this.yearOptions.includes(current) ? current : (this.yearOptions[0] ?? null);

                // if (this.selectedYear != null) {
                //     // Buscar dados do ano selecionado (sempre refetch)
                //     this.fetchByYear(slug, this.selectedYear);
                //     return;
                // }

                // Monta os agrupamento
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

                // Monta os agrupamentos
                this.rebuildGroups();

                this.loading = false;
            },
            error: () => {
                this.erro = 'Erro ao carregar extrato';
                this.loading = false;
            }
        });
    }

    private rebuildGroups() {
        // Se não houver ano selecionado (null), usa todos os itens; caso contrário filtra pelo ano selecionado
        // const base = this.selectedYear == null ? [...this.original] : this.original.filter(l => {
        //     return this.yearFromDate(l.dataPrevista) == this.selectedYear;
        // });

        const sorted = this.original.sort((a, b) => {
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
            const categorias = Array.from(byCat.entries()).map(([nome, its]) => ({nome, itens: its}));
            return {projeto, categorias} as GroupedLancamentos;
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
