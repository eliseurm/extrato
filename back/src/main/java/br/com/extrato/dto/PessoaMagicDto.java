package br.com.extrato.dto;

import br.com.extrato.domain.Pessoa;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PessoaMagicDto {
    private String contato;
    private String primeiroNome;
    private String numeroMagico;
    private String slug; // primeiroNome_numeroMagico

    public static PessoaMagicDto from(Pessoa p) {
        String slug = p.getPrimeiroNome() + "_" + p.getNumeroMagico();
        return new PessoaMagicDto(p.getContato(), p.getPrimeiroNome(), p.getNumeroMagico(), slug);
    }
}
