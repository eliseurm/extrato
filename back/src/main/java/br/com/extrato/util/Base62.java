package br.com.extrato.util;

import java.security.SecureRandom;

public final class Base62 {
    private static final char[] ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz".toCharArray();
    private static final SecureRandom RAND = new SecureRandom();

    private Base62() {}

    public static String randomBase62(int length) {
        if (length <= 0) throw new IllegalArgumentException("length must be > 0");
        byte[] bytes = new byte[length];
        RAND.nextBytes(bytes);
        StringBuilder sb = new StringBuilder(length);
        for (byte b : bytes) {
            int idx = (b & 0xFF) % ALPHABET.length;
            sb.append(ALPHABET[idx]);
        }
        return sb.toString();
    }
}
