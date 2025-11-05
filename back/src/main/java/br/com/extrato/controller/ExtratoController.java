package br.com.extrato.controller;

import br.com.extrato.domain.Pessoa;
import br.com.extrato.dto.ExtratoResponse;
import br.com.extrato.dto.LancamentoDto;
import br.com.extrato.repository.LancamentoRepository;
import br.com.extrato.repository.PessoaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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
    public ResponseEntity<ExtratoResponse> obterExtrato(@PathVariable("slug") String slug) {
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
        var lancs = lancamentoRepository.findByPessoaOrderByDataAsc(pessoa);
        List<LancamentoDto> dtoList = lancs.stream().map(l -> LancamentoDto.builder()
                .nome(pessoa.getContato())
                .dataPrevista(l.getDataPrevista())
                .dataEfetiva(l.getDataEfetiva())
                .descricao(l.getDescricao())
                .valorEfetivo(l.getValorEfetivo())
                .valorPrevisto(l.getValorPrevisto())
                .tipo(l.getTipo())
                .status(l.getStatus())
                .projeto(l.getProjeto())
                .categoria(l.getCategoria())
                .build()).collect(Collectors.toList());

        ExtratoResponse resp = ExtratoResponse.builder()
                .pessoaNome(pessoa.getContato())
                .lancamentos(dtoList)
                .build();
        return ResponseEntity.ok(resp);
    }
}
