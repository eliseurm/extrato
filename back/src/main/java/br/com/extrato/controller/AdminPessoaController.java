package br.com.extrato.controller;

import br.com.extrato.dto.PessoaMagicDto;
import br.com.extrato.repository.PessoaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin/pessoas")
@RequiredArgsConstructor
public class AdminPessoaController {

    private final PessoaRepository pessoaRepository;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<PessoaMagicDto>> listar() {
        var list = pessoaRepository.findAll().stream().map(PessoaMagicDto::from).toList();
        return ResponseEntity.ok(list);
    }
}
