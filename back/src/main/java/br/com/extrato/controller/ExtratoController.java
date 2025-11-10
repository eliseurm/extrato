package br.com.extrato.controller;

import br.com.extrato.model.Pessoa;
import br.com.extrato.dto.ExtratoResponse;
import br.com.extrato.dto.LancamentoDto;
import br.com.extrato.repository.LancamentoRepository;
import br.com.extrato.repository.PessoaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/extrato")
@RequiredArgsConstructor
public class ExtratoController {

    private final PessoaRepository pessoaRepository;
    private final LancamentoRepository lancamentoRepository;

    @GetMapping("/{slug}")
    public ResponseEntity<ExtratoResponse> obterExtrato(@PathVariable("slug") String slug, @RequestParam(value = "year", required = false) Integer year) {
        // slug format: primeiroNome_numeroMagico
        int idx = slug.lastIndexOf('_');
        if (idx <= 0 || idx >= slug.length() - 1) {
            return ResponseEntity.notFound().build();
        }
        String primeiroNome = slug.substring(0, idx);
        String numeroMagico = slug.substring(idx + 1);
        // Validate numeroMagico: must be exactly 8 Base62 chars
        if (numeroMagico.length() != 8 || !numeroMagico.matches("[0-9A-Za-z]{8}")) {
            return ResponseEntity.notFound().build();
        }

        Optional<Pessoa> pessoaOpt = pessoaRepository.findByPrimeiroNomeAndNumeroMagico(primeiroNome, numeroMagico);
        if (pessoaOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        Pessoa pessoa = pessoaOpt.get();

        // Quando nao tem ano informado, busca o ano atual.
        if(year == null) {
            year = LocalDate.now().getYear();
        }
        java.time.LocalDate start = java.time.LocalDate.of(year, 1, 1);
        java.time.LocalDate end = java.time.LocalDate.of(year, 12, 31);
        List<br.com.extrato.model.Lancamento> lancs = lancamentoRepository.findByPessoaAndDataPrevistaBetweenOrderByDataAsc(pessoa, start, end);

        List<LancamentoDto> dtoList = lancs.stream().map(l -> {

            // trata mensagem
            StringBuilder sb = new StringBuilder();
            if(l.getDescricao()!=null) {
                sb.append(l.getDescricao().indexOf("pix")==-1 ? l.getDescricao() : "pix, ****");
            }
            if (l.getTags() != null) {
                if (sb.length() > 0) {
                    sb.append(", ");
                }
                sb.append(l.getTags());
            }

            return LancamentoDto.builder()
                    .nome(pessoa.getContato())
                    .dataPrevista(l.getDataPrevista())
                    .dataEfetiva(l.getDataEfetiva())
                    .descricao(sb.toString())
                    .valorEfetivo(l.getValorEfetivo())
                    .valorPrevisto(l.getValorPrevisto())
                    .tipo(l.getTipo())
                    .status(l.getStatus())
                    .projeto(l.getProjeto())
                    .categoria(l.getCategoria())
                    .build();
        }).collect(Collectors.toList());

        java.time.LocalDate maxCriacao = lancamentoRepository.findMaxDataCriacao();
        String ultimaAtualizacao = maxCriacao != null ? maxCriacao.toString() : null;

        // anos distintos disponíveis para a pessoa (derivados de dataPrevista)
        List<Integer> anosDisponiveis = lancamentoRepository.findDistinctYearsByPessoa(pessoa);

        ExtratoResponse resp = ExtratoResponse.builder()
                .pessoaNome(pessoa.getContato())
                .lancamentos(dtoList)
                .ultimaAtualizacao(ultimaAtualizacao)
                .anosDisponiveis(anosDisponiveis)
                .anoSelecionado(year)
                .build();
        return ResponseEntity.ok(resp);
    }
}
