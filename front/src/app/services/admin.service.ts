import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {PessoaMagicDto} from "../class/pessoa-magic.dto";
import {ImportacaoResumoDto} from "../class/importacao-resumo.dto";

@Injectable({providedIn: 'root'})
export class AdminService {
    constructor(private http: HttpClient) {
    }

    getPessoaNumeroMagico():Observable<PessoaMagicDto[]>{
        return this.http.get<PessoaMagicDto[]>('/api/admin/pessoas');
    }

    importaCSV(form: FormData):Observable<ImportacaoResumoDto>{
        return this.http.post<ImportacaoResumoDto>('/api/admin/importacao-csv', form);
    }

    salvarTelefones(pessoas: PessoaMagicDto[]): Observable<{atualizados: number}> {
        return this.http.post<{atualizados: number}>('/api/admin/pessoas/telefones', pessoas);
    }
}
