package br.com.extrato.repository;

import br.com.extrato.model.Pessoa;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PessoaRepository extends JpaRepository<Pessoa, Long> {

    List<Pessoa> findAllByAtivoTrue();

    Optional<Pessoa> findByContato(String contato);

    Optional<Pessoa> findByPrimeiroNomeAndNumeroMagico(String primeiroNome, String numeroMagico);
}
