package br.com.extrato.security;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class RateLimitFilter extends OncePerRequestFilter {

    private static final int REQUESTS_PER_SECOND = 10;
    private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();

    private Bucket resolveBucket(String key) {
        return buckets.computeIfAbsent(key, k -> Bucket.builder()
                .addLimit(Bandwidth.classic(REQUESTS_PER_SECOND, Refill.intervally(REQUESTS_PER_SECOND, Duration.ofSeconds(1))))
                .build());
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        String path = request.getRequestURI();
        if (path.startsWith("/api/extrato/")) {
            String ip = request.getRemoteAddr();
            Bucket bucket = resolveBucket(ip);
            if (!bucket.tryConsume(1)) {
                response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
                response.getWriter().write("Rate limit exceeded");
                return;
            }
        }
        filterChain.doFilter(request, response);
    }
}

/*
========================
Dropar e criar ba base
========================
* No terminal, dentro do docker do postgres1
$ docker exec -it postgres1 bash
# psql -d postgres -U system -W
password: sicsadm

drop schema if exists uberlandiacm cascade ;
drop database if exists uberlandiacm ;
drop user if exists uberlandiacm ;

create database uberlandiacm ;
create user uberlandiacm with encrypted password 'SICSADM' ;
grant all privileges on database uberlandiacm to uberlandiacm ;
exit

-- para criar o schema voce deve estar conectado na base onde voce quer criar o schema
$ psql -d uberlandiacm -U uberlandiacm -W
drop schema if exists uberlandiacm cascade ; -- dropa schemas
create schema if not exists uberlandiacm authorization uberlandiacm ; -- cria um novo schema
select nspname from pg_catalog.pg_namespace; -- lista schemas

 */