package br.com.extrato.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Base64;
import java.util.Date;

@Component
public class JwtUtil {

    private final SecretKey key;
    private final long expirationMs;

    public JwtUtil(@Value("${app.security.jwt-secret}") String secret,
                   @Value("${app.security.jwt-expiration-minutes}") long expirationMinutes) {
        // Support base64: prefix and validate length >= 32 bytes as required by HS256
        byte[] keyBytes;
        if (secret != null && secret.startsWith("base64:")) {
            keyBytes = Base64.getDecoder().decode(secret.substring("base64:".length()));
        } else {
            keyBytes = (secret != null ? secret : "").getBytes();
        }
        if (keyBytes.length < 32) {
            throw new IllegalArgumentException("JWT secret must be at least 32 bytes. Provide a longer secret or use base64:<encoded> format.");
        }
        this.key = Keys.hmacShaKeyFor(keyBytes);
        this.expirationMs = expirationMinutes * 60_000;
    }

    public String generateToken(String username) {
        Date now = new Date();
        Date exp = new Date(now.getTime() + expirationMs);
        return Jwts.builder()
                .setSubject(username)
                .setIssuedAt(now)
                .setExpiration(exp)
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    public Jws<Claims> parse(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token);
    }
}
