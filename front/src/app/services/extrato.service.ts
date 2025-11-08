import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';

export interface LancamentoDto {
    nome: string;
    dataPrevista: string | null;
    dataEfetiva: string | null;
    descricao: string | null;
    valorEfetivo: number | null;
    valorPrevisto: number | null;
    tipo: string;
    status: string;
    projeto: string;
    categoria: string | null;
}

export interface ExtratoResponse {
    pessoaNome: string;
    lancamentos: LancamentoDto[];
    ultimaAtualizacao?: string; // ISO date (yyyy-MM-dd) from backend
    anosDisponiveis?: number[]; // anos distintos de dataPrevista para a pessoa
    anoSelecionado?: number;
}

@Injectable({providedIn: 'root'})
export class ExtratoService {
    constructor(private http: HttpClient) {
    }

    getExtrato(slug: string, year?: number): Observable<ExtratoResponse> {
        const url = year ? `/api/extrato/${slug}?year=${year}` : `/api/extrato/${slug}`;
        return this.http.get<ExtratoResponse>(url);
    }
}
