package br.com.extrato.domain;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "pessoa", schema = "extrato_sh",
        indexes = {@Index(name = "idx_pessoa_primeiro_nome_numero_magico", columnList = "primeiro_nome, numero_magico")})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Pessoa {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String contato;

    @Column(name = "primeiro_nome", nullable = false, length = 100)
    private String primeiroNome;

    @Column(name = "numero_magico", nullable = false, unique = true, length = 16)
    private String numeroMagico;
}
