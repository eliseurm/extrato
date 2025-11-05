package br.com.extrato.repository;

import br.com.extrato.domain.Pessoa;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PessoaRepository extends JpaRepository<Pessoa, Long> {
    Optional<Pessoa> findByContato(String contato);
    Optional<Pessoa> findByPrimeiroNomeAndNumeroMagico(String primeiroNome, String numeroMagico);
}
