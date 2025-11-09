import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {ButtonModule} from 'primeng/button';
import {TableModule} from 'primeng/table';
import {ToastModule} from 'primeng/toast';
import {InputTextModule} from 'primeng/inputtext';
import {MessageService} from 'primeng/api';
import {PessoaMagicDto} from "../class/pessoa-magic.dto";
import {AdminService} from "../services/admin.service";

@Component({
    selector: 'app-admin-pessoas',
    standalone: true,
    imports: [CommonModule, ButtonModule, TableModule, ToastModule, InputTextModule],
    providers: [MessageService],
    templateUrl: './admin-pessoas.component.html',
    styleUrls: ['./admin-pessoas.component.scss']
})
export class AdminPessoasComponent implements OnInit {

    pessoas: PessoaMagicDto[] = [];
    loading = false;
    file: File | null = null;
    uploading = false;

    constructor(private http: HttpClient,
                private msg: MessageService,
                private adminService: AdminService) {
    }

    ngOnInit(): void {
        this.fetch();
    }

    fetch(): void {
        this.loading = true;
        this.adminService.getPessoaNumeroMagico().subscribe({
            next: (res) => {
                this.pessoas = res;
                this.loading = false;
            },
            error: () => {
                this.loading = false;
                this.msg.add({severity: 'error', summary: 'Erro', detail: 'Falha ao carregar pessoas'});
            }
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
        this.adminService.importaCSV(form).subscribe({
            next: () => {
                this.uploading = false;
                this.msg.add({severity: 'success', summary: 'Importado', detail: 'Importação concluída'});
                this.fetch();
            },
            error: (e) => {
                this.uploading = false;
                const detail = e?.error?.message || 'Falha ao importar CSV';
                this.msg.add({severity: 'error', summary: 'Erro', detail});
            }
        });
    }

    copyLink(p: PessoaMagicDto) {
        // Usar o mesmo domínio da aplicação atual e incluir o prefixo /extrato/
        const origin = window.location.origin; // ex.: http://localhost:8080 ou https://mensageiros.udi.br
        const url = `${origin}/extrato/${p.slug}`;
        navigator.clipboard.writeText(url).then(() => {
            this.msg.add({severity: 'success', summary: 'Copiado', detail: 'Link copiado para a área de transferência'});
        }).catch(() => {
            this.msg.add({severity: 'warn', summary: 'Atenção', detail: 'Não foi possível copiar automaticamente'});
        });
    }

    openLink(p: PessoaMagicDto) {
        // Abrir na mesma origem do app com o prefixo /extrato/
        const url = `/extrato/${p.slug}`;
        window.open(url, '_blank');
    }

    exportLinks() {
        // Exporta arquivo CSV conforme especificado, usando o mesmo domínio do ambiente atual
        // const origin = window.location.origin; // ex.: http://localhost:8080 ou https://mensageiros.udi.br
        const origin = 'mensageiros.udi.br';

        const blocks: string[] = [];
        for (const p of this.pessoas) {
            if(p.fone1!=null) {
                blocks.push(this.novaMensagem(origin, p, p.fone1));
            }
            if(p.fone2!=null) {
                blocks.push(this.novaMensagem(origin, p, p.fone2));
            }
            if(p.fone3!=null) {
                blocks.push(this.novaMensagem(origin, p, p.fone3));
            }
        }
        const content = blocks.join('\n');
        const blob = new Blob([content], {type: 'text/csv;charset=utf-8'});
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'links_extrato.csv';
        document.body.appendChild(a);
        a.click();
        URL.revokeObjectURL(a.href);
        a.remove();
        this.msg.add({severity: 'success', summary: 'Exportado', detail: `${this.pessoas.length} link(s) gerados`});
    }

    private novaMensagem(origin: string, p: PessoaMagicDto, fone: string): string {

        // --- Exemplo da mensagem:
        // <nome_completo>; <link>
        //
        // *Tesouraria Clube Mensageiros*
        // Entre neste link sempre que quiser saber sobre pagamentos.
        // Você pode guardar este link em seus favoritos e usar sempre o mesmo.;

        const link = `${origin}/extrato/${p.slug}`;
        const msgWhats = this.gerarTextoCodificadoWhatsApp(fone, `${link} \n\n*Tesouraria Clube Mensageiros*\nEntre neste link sempre que quiser saber sobre pagamentos.\nVocê pode guardar este link em seus favoritos e usar sempre que desejar.\nObs: Esta funcionalidade esta em fase de teste, qualquer duvida sobre os pagamentos, favor entrar em contato com a tesouraria.`)
        return `${p.contato}; ${msgWhats}`;
    }

    logout() {
        localStorage.removeItem('auth_token');
        location.href = '/';
    }

    gerarTextoCodificadoWhatsApp(telefone: string, mensagemOriginal: string): string {
        if (!mensagemOriginal) {
            return '';
        }

        // 1. Substitui todas as quebras de linha (\n) pelo código de URL do WhatsApp (%0A).
        // O uso de /\n/g garante que TODAS as ocorrências sejam substituídas (flag 'g' = global).
        // const textoComQuebraDeLinha = mensagemOriginal.replace(/\n/g, '%0A');

        // 2. Codifica a string para URL.
        // encodeURIComponent é a função padrão do JavaScript/TypeScript para codificar partes de URLs.
        const textoCodificado = encodeURIComponent(mensagemOriginal).replace(/%0A/g, '\n').replace(/\n/g, '%0A');

        telefone = telefone.replace(/\D/g, '');

        return `https://wa.me/${telefone}?text=${textoCodificado}`;
    }
}
