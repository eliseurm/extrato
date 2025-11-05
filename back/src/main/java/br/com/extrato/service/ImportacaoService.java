package br.com.extrato.service;

import br.com.extrato.domain.Lancamento;
import br.com.extrato.domain.Pessoa;
import br.com.extrato.repository.LancamentoRepository;
import br.com.extrato.repository.PessoaRepository;
import br.com.extrato.util.Base62;
import br.com.extrato.util.NameNormalizer;
import lombok.RequiredArgsConstructor;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ImportacaoService {

    private final PessoaRepository pessoaRepository;
    private final LancamentoRepository lancamentoRepository;

    @PersistenceContext
    private EntityManager entityManager;

    public static class ImportResumo {
        public int pessoasNovas;
        public int lancamentosImportados;
    }

    private static final DateTimeFormatter[] DATE_FORMATS = new DateTimeFormatter[]{
            DateTimeFormatter.ofPattern("yyyy-MM-dd"),
            DateTimeFormatter.ofPattern("dd/MM/yyyy")
    };

    @Transactional
    public ImportResumo importarCSV(InputStream csvInputStream) throws IOException {
        List<CSVRecord> records = parse(csvInputStream);
        // 1) Pessoas
        processarPessoas(records);
        // 2) Lançamentos (destrutivo e atômico)
        int count = importarLancamentos(records);
        ImportResumo resumo = new ImportResumo();
        resumo.pessoasNovas = 0; // calculado em processarPessoas? Podemos derivar via comparação (simplificado)
        resumo.lancamentosImportados = count;
        return resumo;
    }

    private List<CSVRecord> parse(InputStream in) throws IOException {
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(in, StandardCharsets.UTF_8))) {
            CSVParser parser = CSVFormat.DEFAULT
                    .withFirstRecordAsHeader()
                    .withIgnoreHeaderCase()
                    .withTrim()
                    .parse(reader);
            return parser.getRecords();
        }
    }

    @Transactional
    protected void processarPessoas(List<CSVRecord> records) {
        Set<String> contatos = records.stream()
                .map(r -> r.get("Contato").trim())
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toCollection(LinkedHashSet::new));

        // Buscar já existentes
        Map<String, Pessoa> existentes = pessoaRepository.findAll().stream()
                .collect(Collectors.toMap(Pessoa::getContato, p -> p));

        List<Pessoa> novos = new ArrayList<>();
        for (String contato : contatos) {
            if (!existentes.containsKey(contato)) {
                String primeiroNome = NameNormalizer.primeiroNomeParaSlug(contato);
                String numeroMagico = Base62.randomBase62(8);
                Pessoa p = Pessoa.builder()
                        .contato(contato)
                        .primeiroNome(primeiroNome)
                        .numeroMagico(numeroMagico)
                        .build();
                novos.add(p);
            }
        }
        if (!novos.isEmpty()) {
            pessoaRepository.saveAll(novos);
        }
    }

    @Transactional
    protected int importarLancamentos(List<CSVRecord> records) {
        // Trunca tabela lancamento
        entityManager.createNativeQuery("TRUNCATE TABLE extrato_sh.lancamento RESTART IDENTITY CASCADE").executeUpdate();

        // Cache pessoa por contato
        Map<String, Pessoa> pessoaPorContato = pessoaRepository.findAll().stream()
                .collect(Collectors.toMap(Pessoa::getContato, p -> p));

        List<Lancamento> batch = new ArrayList<>();
        int lineNo = 1; // after header
        for (CSVRecord r : records) {
            lineNo++;
            Lancamento l = mapRecord(r, pessoaPorContato);
            batch.add(l);
        }
        lancamentoRepository.saveAll(batch);
        return batch.size();
    }

    private Lancamento mapRecord(CSVRecord r, Map<String, Pessoa> pessoaPorContato) {
        // Required fields validation based on spec
        String tipo = required(r, "Tipo");
        String status = required(r, "Status");
        LocalDate dataPrevista = parseDate(required(r, "Data prevista"));
        LocalDate dataEfetiva = parseDateOrNull(r.get("Data efetiva"));
        LocalDate vencFatura = parseDateOrNull(r.get("Venc. Fatura"));
        BigDecimal valorPrevisto = parseBigDecimal(required(r, "Valor previsto"));
        BigDecimal valorEfetivo = parseBigDecimalOrNull(getOrNull(r, "Valor efetivo"));
        String descricao = getOrNull(r, "Descrição");
        String categoria = getOrNull(r, "Categoria");
        String subcategoria = getOrNull(r, "Subcategoria");
        String conta = required(r, "Conta");
        String contaTransferencia = getOrNull(r, "Conta transferência");
        String centro = getOrNull(r, "Centro");
        String contato = required(r, "Contato");
        String forma = required(r, "Forma");
        String projeto = required(r, "Projeto");
        String nDocumento = getOrNull(r, "N. Documento");
        String observacoes = getOrNull(r, "Observações");
        LocalDate dataCompetencia = parseDateOrNull(getOrNull(r, "Data competência"));
        String idUnico = required(r, "ID Único");
        String tags = getOrNull(r, "Tags");
        String cartao = getOrNull(r, "Cartão");
        String repeticao = required(r, "Repetição");
        BigDecimal metaEconomia = parseBigDecimalOrNull(getOrNull(r, "Meta de Economia"));
        LocalDate dataCriacao = parseDate(required(r, "Data de criação"));

        Pessoa pessoa = pessoaPorContato.get(contato);

        return Lancamento.builder()
                .tipo(tipo)
                .status(status)
                .dataPrevista(dataPrevista)
                .dataEfetiva(dataEfetiva)
                .vencFatura(vencFatura)
                .valorPrevisto(valorPrevisto)
                .valorEfetivo(valorEfetivo)
                .descricao(descricao)
                .categoria(categoria)
                .subcategoria(subcategoria)
                .conta(conta)
                .contaTransferencia(contaTransferencia)
                .centro(centro)
                .contato(contato)
                .forma(forma)
                .projeto(projeto)
                .nDocumento(nDocumento)
                .observacoes(observacoes)
                .dataCompetencia(dataCompetencia)
                .idUnico(idUnico)
                .tags(tags)
                .cartao(cartao)
                .repeticao(repeticao)
                .metaEconomia(metaEconomia)
                .dataCriacao(dataCriacao)
                .pessoa(pessoa)
                .build();
    }

    private String required(CSVRecord r, String header) {
        String v = getOrNull(r, header);
        if (v == null || v.isBlank()) {
            throw new IllegalArgumentException("Campo obrigatório vazio: " + header);
        }
        return v;
    }

    private String getOrNull(CSVRecord r, String header) {
        try { return Optional.ofNullable(r.get(header)).map(String::trim).orElse(null); } catch (IllegalArgumentException e) { return null; }
    }

    private LocalDate parseDate(String s) {
        for (DateTimeFormatter f : DATE_FORMATS) {
            try { return LocalDate.parse(s, f); } catch (DateTimeParseException ignored) {}
        }
        throw new IllegalArgumentException("Data inválida: " + s);
    }
    private LocalDate parseDateOrNull(String s) {
        if (s == null || s.isBlank()) return null;
        for (DateTimeFormatter f : DATE_FORMATS) {
            try { return LocalDate.parse(s, f); } catch (DateTimeParseException ignored) {}
        }
        throw new IllegalArgumentException("Data inválida: " + s);
    }
    private BigDecimal parseBigDecimal(String s) {
        try { return new BigDecimal(s.replace(".", "").replace(",", ".")); } catch (Exception e) { throw new IllegalArgumentException("Número inválido: " + s); }
    }
    private BigDecimal parseBigDecimalOrNull(String s) {
        if (s == null || s.isBlank()) return null;
        return parseBigDecimal(s);
    }
}
