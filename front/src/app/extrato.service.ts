import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

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
}

@Injectable({ providedIn: 'root' })
export class ExtratoService {
  constructor(private http: HttpClient) {}

  getExtrato(slug: string): Observable<ExtratoResponse> {
    return this.http.get<ExtratoResponse>(`/api/extrato/${slug}`);
  }
}
