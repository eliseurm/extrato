package br.com.extrato.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExtratoResponse {
    private String pessoaNome;
    private List<LancamentoDto> lancamentos;
    private String ultimaAtualizacao; // ISO yyyy-MM-dd
    private List<Integer> anosDisponiveis; // anos distintos de dataPrevista para a pessoa
}
