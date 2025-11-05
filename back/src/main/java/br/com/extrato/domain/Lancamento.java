package br.com.extrato.domain;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "lancamento", schema = "extrato_sh",
        indexes = {@Index(name = "idx_lancamento_pessoa_data", columnList = "pessoa_id, data_efetiva, data_prevista")})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Lancamento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 50)
    private String tipo; // Receita / Despesa

    @Column(nullable = false, length = 50)
    private String status; // Confirmado / Agendado ...

    @Column(name = "data_prevista", nullable = false)
    private LocalDate dataPrevista;

    @Column(name = "data_efetiva")
    private LocalDate dataEfetiva;

    @Column(name = "venc_fatura")
    private LocalDate vencFatura;

    @Column(name = "valor_previsto", nullable = false, precision = 10, scale = 2)
    private BigDecimal valorPrevisto;

    @Column(name = "valor_efetivo", precision = 10, scale = 2)
    private BigDecimal valorEfetivo;

    @Column(length = 500)
    private String descricao;

    @Column(length = 255)
    private String categoria;

    @Column(length = 255)
    private String subcategoria;

    @Column(nullable = false, length = 255)
    private String conta;

    @Column(name = "conta_transferencia", length = 255)
    private String contaTransferencia;

    @Column(length = 255)
    private String centro;

    @Column(nullable = false, length = 255)
    private String contato;

    @Column(nullable = false, length = 255)
    private String forma;

    @Column(nullable = false, length = 255)
    private String projeto;

    @Column(name = "n_documento", length = 255)
    private String nDocumento;

    @Column(length = 500)
    private String observacoes;

    @Column(name = "data_competencia")
    private LocalDate dataCompetencia;

    @Column(name = "id_unico", nullable = false, length = 255)
    private String idUnico;

    @Column(length = 255)
    private String tags;

    @Column(length = 255)
    private String cartao;

    @Column(length = 50, nullable = false)
    private String repeticao;

    @Column(name = "meta_economia", precision = 10, scale = 2)
    private BigDecimal metaEconomia;

    @Column(name = "data_criacao", nullable = false)
    private LocalDate dataCriacao;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pessoa_id")
    private Pessoa pessoa;
}
