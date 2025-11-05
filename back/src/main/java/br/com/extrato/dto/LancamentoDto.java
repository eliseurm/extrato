package br.com.extrato.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LancamentoDto {
    private String nome; // nome completo da pessoa
    private LocalDate dataPrevista;
    private LocalDate dataEfetiva;
    private String descricao;
    private BigDecimal valorEfetivo;
    private BigDecimal valorPrevisto;
    private String tipo;
    private String status;
    private String projeto;
    private String categoria;
}
