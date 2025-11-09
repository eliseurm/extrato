package br.com.extrato.controller;

import br.com.extrato.dto.PessoaMagicDto;
import br.com.extrato.model.Pessoa;
import br.com.extrato.repository.PessoaRepository;
import br.com.extrato.service.ImportacaoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final PessoaRepository pessoaRepository;
    private final ImportacaoService importacaoService;


    @GetMapping(value = "/pessoas")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<PessoaMagicDto>> listar() {
//        var list = pessoaRepository.findAll().stream().map(PessoaMagicDto::from).toList();
        var list = pessoaRepository.findAllByAtivoTrue().stream().map(PessoaMagicDto::from).toList();
        return ResponseEntity.ok(list);
    }


    @PostMapping(value = "/importacao-csv", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> importar(@RequestPart("file") MultipartFile file) throws IOException {
        var resumo = importacaoService.importarCSV(file.getInputStream());
        return ResponseEntity.ok(Map.of(
                "pessoasNovas", resumo.pessoasNovas,
                "lancamentosImportados", resumo.lancamentosImportados
        ));
    }

    @PostMapping("/pessoas/telefones")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> atualizarTelefones(@RequestBody List<PessoaMagicDto> dtos) {
        int updated = 0;
        for (PessoaMagicDto dto : dtos) {
            if (dto.getContato() == null || dto.getContato().isBlank()) continue;
            Pessoa p = pessoaRepository.findByContato(dto.getContato()).orElse(null);
            if (p == null) continue;
            boolean changed = false;
            if (!Objects.equals(p.getFone1(), dto.getFone1())) { p.setFone1(dto.getFone1()); changed = true; }
            if (!Objects.equals(p.getFone2(), dto.getFone2())) { p.setFone2(dto.getFone2()); changed = true; }
            if (!Objects.equals(p.getFone3(), dto.getFone3())) { p.setFone3(dto.getFone3()); changed = true; }
            if (changed) {
                pessoaRepository.save(p);
                updated++;
            }
        }
        return ResponseEntity.ok(Map.of("atualizados", updated));
    }
}
