package com.br.CLAI.security;

import com.br.CLAI.domain.Usuario;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

@Service
public class JwtService {

    @Value("${sigi.security.jwt-secret:sigi-clai-dev-jwt-secret-key-2026-ifpb-change-in-prod}")
    private String jwtSecret;

    @Value("${sigi.security.jwt-expiration-ms:28800000}")
    private long jwtExpirationMs;

    private SecretKey getSigningKey() {
        byte[] keyBytes = jwtSecret.getBytes(StandardCharsets.UTF_8);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    public String gerarToken(Usuario usuario) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("role", usuario.getRole().name());
        claims.put("nivelRestricao", usuario.getNivelRestricao().name());
        claims.put("autorizacaoSaude", Boolean.TRUE.equals(usuario.getAutorizacaoSaude()));
        claims.put("tokenVersion", usuario.getTokenVersion());
        claims.put("nome", usuario.getNome());
        if (usuario.getId() != null) {
            claims.put("userId", usuario.getId().toString());
        }

        Date agora = new Date();
        Date expiracao = new Date(agora.getTime() + jwtExpirationMs);

        return Jwts.builder()
                .claims(claims)
                .subject(usuario.getEmail())
                .issuedAt(agora)
                .expiration(expiracao)
                .signWith(getSigningKey())
                .compact();
    }

    public Claims extrairTodasClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public String extrairEmail(String token) {
        return extrairTodasClaims(token).getSubject();
    }

    public Integer extrairTokenVersion(String token) {
        return extrairTodasClaims(token).get("tokenVersion", Integer.class);
    }

    public String extrairRole(String token) {
        return extrairTodasClaims(token).get("role", String.class);
    }

    public String extrairNivelRestricao(String token) {
        return extrairTodasClaims(token).get("nivelRestricao", String.class);
    }

    public Boolean extrairAutorizacaoSaude(String token) {
        return extrairTodasClaims(token).get("autorizacaoSaude", Boolean.class);
    }

    public boolean isTokenExpirado(String token) {
        Date expiracao = extrairTodasClaims(token).getExpiration();
        return expiracao.before(new Date());
    }

    public boolean isTokenValidoParaSessaoAtiva(String token, Usuario usuario) {
        if (usuario == null || !Boolean.TRUE.equals(usuario.getAcessoAtivo())) {
            return false;
        }
        Claims claims = extrairTodasClaims(token);
        String emailToken = claims.getSubject();
        Integer versaoToken = claims.get("tokenVersion", Integer.class);
        Date expiracao = claims.getExpiration();

        return emailToken != null
                && emailToken.equals(usuario.getEmail())
                && expiracao != null
                && expiracao.after(new Date())
                && versaoToken != null
                && versaoToken.equals(usuario.getTokenVersion());
    }
}
