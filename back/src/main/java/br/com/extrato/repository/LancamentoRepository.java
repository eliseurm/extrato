package br.com.extrato.repository;

import br.com.extrato.domain.Lancamento;
import br.com.extrato.domain.Pessoa;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface LancamentoRepository extends JpaRepository<Lancamento, Long> {

    @Query("select l from Lancamento l where l.pessoa = :pessoa order by case when l.dataEfetiva is null then l.dataPrevista else l.dataEfetiva end asc")
    List<Lancamento> findByPessoaOrderByDataAsc(@Param("pessoa") Pessoa pessoa);
}
