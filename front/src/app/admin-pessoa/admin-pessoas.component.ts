import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {HttpClient} from '@angular/common/http';
import {ButtonModule} from 'primeng/button';
import {TableModule} from 'primeng/table';
import {ToastModule} from 'primeng/toast';
import {InputTextModule} from 'primeng/inputtext';
import {MessageService} from 'primeng/api';
import {PessoaMagicDto} from "../class/pessoa-magic.dto";
import {AdminService} from "../services/admin.service";
import {FormsModule} from '@angular/forms';

@Component({
    selector: 'app-admin-pessoas',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, TableModule, ToastModule, InputTextModule],
    providers: [MessageService],
    templateUrl: './admin-pessoas.component.html',
    styleUrls: ['./admin-pessoas.component.scss']
})
export class AdminPessoasComponent implements OnInit {

    pessoas: PessoaMagicDto[] = [];
    loading = false;
    saving = false;
    file: File | null = null;
    uploading = false;

    private originalMap = new Map<string, { f1: string | null, f2: string | null, f3: string | null }>();

    constructor(private http: HttpClient,
                private msg: MessageService,
                private adminService: AdminService) {
    }

    ngOnInit(): void {
        this.fetch();
    }

    get altered(): PessoaMagicDto[] {
        return this.pessoas.filter(p => this.hasTelefoneChanged(p));
    }

    get alteredCount(): number { return this.altered.length; }

    fetch(): void {
        this.loading = true;
        this.adminService.getPessoaNumeroMagico().subscribe({
            next: (res) => {
                this.pessoas = res;
                this.originalMap.clear();
                for (const p of res) {
                    this.originalMap.set(p.contato, { f1: p.fone1 ?? null, f2: p.fone2 ?? null, f3: p.fone3 ?? null });
                }
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
        // const url = `${origin}/extrato/${p.slug}`;
        const msg = this.novaMensagem(p)
        navigator.clipboard.writeText(msg).then(() => {
            this.msg.add({severity: 'success', summary: 'Copiado', detail: 'Link copiado para a área de transferência'});
        }).catch(() => {
            this.msg.add({severity: 'warn', summary: 'Atenção', detail: 'Não foi possível copiar automaticamente'});
        });
    }

    openLink(p: PessoaMagicDto) {
        const url = `/extrato/${p.slug}`;
        window.open(url, '_blank');
    }

    exportLinks() {

        const blocks: string[] = [];
        for (const p of this.pessoas) {
            if(p.fone1!=null && !!p.fone1) {
                blocks.push(this.novaMensagem(p, p.fone1));
            }
            if(p.fone2!=null && !!p.fone2) {
                blocks.push(this.novaMensagem(p, p.fone2));
            }
            if(p.fone3!=null && !!p.fone3) {
                blocks.push(this.novaMensagem(p, p.fone3));
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

    salvar(): void {
        const alterados = this.altered.map(p => ({...p}));
        if (alterados.length === 0) return;
        this.saving = true;
        this.adminService.salvarTelefones(alterados).subscribe({
            next: (res) => {
                // atualizar snapshot
                for (const p of alterados) {
                    this.originalMap.set(p.contato, { f1: p.fone1 ?? null, f2: p.fone2 ?? null, f3: p.fone3 ?? null });
                }
                this.saving = false;
                this.msg.add({severity: 'success', summary: 'Salvo', detail: `${res.atualizados} registro(s) atualizados`});
            },
            error: () => {
                this.saving = false;
                this.msg.add({severity: 'error', summary: 'Erro', detail: 'Falha ao salvar alterações'});
            }
        });
    }

    hasTelefoneChanged(p: PessoaMagicDto): boolean {
        const orig = this.originalMap.get(p.contato);
        if (!orig) return false;
        const f1 = p.fone1 ?? null; const f2 = p.fone2 ?? null; const f3 = p.fone3 ?? null;
        return orig.f1 !== f1 || orig.f2 !== f2 || orig.f3 !== f3;
    }

    private novaMensagem(p: PessoaMagicDto, fone?: string): string {
        // -- const origin = window.location.origin;
        const origin = 'https://mensageiros.udi.br';

        const link = `${origin}/extrato/${p.slug}`;
        let msgWhats = `${link} \n\n*Tesouraria Clube Mensageiros*\nEntre neste link sempre que quiser saber sobre pagamentos.\nVocê pode guardar este link em seus favoritos e usar sempre que desejar.\nObs: Esta funcionalidade esta em fase de teste, qualquer duvida sobre os pagamentos, favor entrar em contato com a tesouraria.`;

        if(fone!=null) {
            msgWhats = this.gerarTextoCodificadoWhatsApp(fone, msgWhats)
            msgWhats = `${p.contato}; ${msgWhats}`;
        }

        return msgWhats;
    }

    logout() {
        localStorage.removeItem('auth_token');
        location.href = '/';
    }

    gerarTextoCodificadoWhatsApp(telefone: string, mensagemOriginal: string): string {
        if (!mensagemOriginal) {
            return '';
        }
        const textoCodificado = encodeURIComponent(mensagemOriginal).replace(/%0A/g, '\n').replace(/\n/g, '%0A');
        telefone = telefone.replace(/\D/g, '');
        return `https://wa.me/${telefone}?text=${textoCodificado}`;
    }
}
