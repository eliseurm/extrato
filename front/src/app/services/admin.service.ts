import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {PessoaMagicDto} from "../class/pessoa-magic.dto";
import {ImportacaoResumoDto} from "../class/importacao-resumo.dto";

@Injectable({providedIn: 'root'})
export class AdminService {
    constructor(private http: HttpClient) {
    }

    // getExtrato(slug: string, year?: number): Observable<ExtratoResponse> {
    //     const url = year ? `/api/extrato/${slug}?year=${year}` : `/api/extrato/${slug}`;
    //     return this.http.get<ExtratoResponse>(url);
    // }

    getPessoaNumeroMagico():Observable<PessoaMagicDto[]>{
        return this.http.get<PessoaMagicDto[]>('/api/admin/pessoas');
    }

    importaCSV(form: FormData):Observable<ImportacaoResumoDto>{
        return this.http.post<ImportacaoResumoDto>('/api/admin/importacao-csv', form);
    }


}
