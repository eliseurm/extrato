package br.com.extrato.controller;

import br.com.extrato.service.ImportacaoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/importacao")
@RequiredArgsConstructor
public class AdminImportController {

    private final ImportacaoService importacaoService;

    @PostMapping(value = "/csv", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> importar(@RequestPart("file") MultipartFile file) throws IOException {
        var resumo = importacaoService.importarCSV(file.getInputStream());
        return ResponseEntity.ok(Map.of(
                "pessoasNovas", resumo.pessoasNovas,
                "lancamentosImportados", resumo.lancamentosImportados
        ));
    }
}
