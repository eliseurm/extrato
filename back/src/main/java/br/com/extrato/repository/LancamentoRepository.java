package br.com.extrato.repository;

import br.com.extrato.model.Lancamento;
import br.com.extrato.model.Pessoa;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface LancamentoRepository extends JpaRepository<Lancamento, Long> {

    @Query("select l from Lancamento l where l.pessoa = :pessoa order by case when l.dataEfetiva is null then l.dataPrevista else l.dataEfetiva end asc")
    List<Lancamento> findByPessoaOrderByDataAsc(@Param("pessoa") Pessoa pessoa);

    @Query("""
        select l from Lancamento l 
        where 1=1 
        and l.pessoa = :pessoa 
        and coalesce(l.dataEfetiva, l.dataPrevista) between :start and :end 
        order by coalesce(l.dataEfetiva, l.dataPrevista) asc
        """)
    List<Lancamento> findByPessoaAndDataPrevistaBetweenOrderByDataAsc(@Param("pessoa") Pessoa pessoa,
                                                                      @Param("start") java.time.LocalDate start,
                                                                      @Param("end") java.time.LocalDate end);

    @Query("select max(l.dataCriacao) from Lancamento l")
    java.time.LocalDate findMaxDataCriacao();

    @Query("select distinct year(l.dataPrevista) from Lancamento l where l.pessoa = :pessoa order by year(l.dataPrevista) desc")
    List<Integer> findDistinctYearsByPessoa(@Param("pessoa") Pessoa pessoa);
}
