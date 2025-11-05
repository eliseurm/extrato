package br.com.extrato.util;

import java.text.Normalizer;

public final class NameNormalizer {
    private NameNormalizer() {}

    public static String primeiroNomeParaSlug(String contato) {
        if (contato == null || contato.isBlank()) return "";
        String first = contato.trim().split("\\s+")[0];
        String noAccents = Normalizer.normalize(first, Normalizer.Form.NFD)
                .replaceAll("\\p{InCombiningDiacriticalMarks}+", "");
        String lower = noAccents.toLowerCase();
        String slug = lower.replaceAll("[^a-z0-9]+", "-")
                .replaceAll("-+", "-")
                .replaceAll("(^-|-$)", "");
        return slug;
    }
}
