package com.br.CLAI.security;

import com.br.CLAI.domain.Usuario;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;

import java.time.Instant;

@Service
public class JwtService {

    private final JwtEncoder jwtEncoder;
    private final long jwtExpirationMs;

    @Autowired
    public JwtService(
            JwtEncoder jwtEncoder,
            @Value("${sigi.security.jwt-expiration-ms:28800000}") long jwtExpirationMs
    ) {
        this.jwtEncoder = jwtEncoder;
        this.jwtExpirationMs = jwtExpirationMs;
    }

    public String gerarToken(Usuario usuario) {
        Instant agora = Instant.now();
        Instant expiracao = agora.plusMillis(jwtExpirationMs);

        JwtClaimsSet.Builder claimsBuilder = JwtClaimsSet.builder()
                .subject(usuario.getEmail())
                .issuedAt(agora)
                .expiresAt(expiracao)
                .claim("role", usuario.getRole().name())
                .claim("nivelRestricao", usuario.getNivelRestricao().name())
                .claim("autorizacaoSaude", Boolean.TRUE.equals(usuario.getAutorizacaoSaude()))
                .claim("tokenVersion", usuario.getTokenVersion() != null ? usuario.getTokenVersion() : 1)
                .claim("nome", usuario.getNome());

        if (usuario.getId() != null) {
            claimsBuilder.claim("userId", usuario.getId().toString());
        }

        JwsHeader jwsHeader = JwsHeader.with(MacAlgorithm.HS256).build();
        return jwtEncoder.encode(JwtEncoderParameters.from(jwsHeader, claimsBuilder.build())).getTokenValue();
    }
}
