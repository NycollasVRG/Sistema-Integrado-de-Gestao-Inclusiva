package com.br.CLAI.security;

import com.br.CLAI.domain.Usuario;
import com.br.CLAI.repository.UsuarioRepository;
import com.nimbusds.jose.jwk.source.ImmutableSecret;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidatorResult;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtValidationException;
import org.springframework.security.oauth2.jwt.JwtValidators;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
public class SecurityConfig {

    private final String jwtSecret;
    private final List<String> allowedOrigins;

    @Autowired
    public SecurityConfig(
            @Value("${sigi.security.jwt-secret}") String jwtSecret,
            @Value("${sigi.cors.allowed-origins:http://localhost:5173}") List<String> allowedOrigins
    ) {
        if (jwtSecret == null || jwtSecret.isBlank()) {
            throw new IllegalArgumentException("O segredo JWT (JWT_SECRET) não pode ser nulo ou vazio.");
        }
        this.jwtSecret = jwtSecret;
        this.allowedOrigins = (allowedOrigins == null || allowedOrigins.isEmpty())
                ? List.of("http://localhost:5173")
                : allowedOrigins.stream()
                        .map(String::trim)
                        .filter(origin -> !origin.isEmpty())
                        .toList();
    }

    public SecurityConfig(String jwtSecret) {
        this(jwtSecret, List.of("http://localhost:5173"));
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http, JwtDecoder jwtDecoder) throws Exception {
        http
                .cors(Customizer.withDefaults())
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint(authenticationEntryPoint())
                        .accessDeniedHandler(accessDeniedHandler())
                )
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(
                                "/api/auth/login",
                                "/actuator/**",
                                "/v3/api-docs/**",
                                "/swagger-ui/**",
                                "/swagger-ui.html"
                        ).permitAll()
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")
                        .anyRequest().authenticated()
                )
                .oauth2ResourceServer(oauth2 -> oauth2
                        .jwt(jwt -> jwt
                                .decoder(jwtDecoder)
                                .jwtAuthenticationConverter(jwtAuthenticationConverter())
                        )
                        .authenticationEntryPoint(authenticationEntryPoint())
                        .accessDeniedHandler(accessDeniedHandler())
                );

        return http.build();
    }

    @Bean
    public JwtDecoder jwtDecoder(@Autowired(required = false) UsuarioRepository usuarioRepository) {
        SecretKeySpec secretKey = getSecretKeySpec();
        NimbusJwtDecoder decoder = NimbusJwtDecoder.withSecretKey(secretKey)
                .macAlgorithm(MacAlgorithm.HS256)
                .build();

        OAuth2TokenValidator<Jwt> defaultValidator = JwtValidators.createDefault();
        OAuth2TokenValidator<Jwt> sessionValidator = jwt -> {
            if (usuarioRepository == null) {
                return OAuth2TokenValidatorResult.success();
            }

            String email = jwt.getSubject();
            if (email == null || email.isBlank()) {
                return OAuth2TokenValidatorResult.failure(
                        new OAuth2Error("invalid_token", "Token JWT inválido ou expirado.", null)
                );
            }

            Optional<Usuario> usuarioOpt = usuarioRepository.findByEmail(email);
            if (usuarioOpt.isEmpty()) {
                return OAuth2TokenValidatorResult.failure(
                        new OAuth2Error("invalid_token", "Usuário associado ao token não encontrado.", null)
                );
            }

            Usuario usuario = usuarioOpt.get();
            if (!Boolean.TRUE.equals(usuario.getAcessoAtivo())) {
                return OAuth2TokenValidatorResult.failure(
                        new OAuth2Error("invalid_token", "Acesso revogado: o vínculo do usuário está desativado.", null)
                );
            }

            Number tokenVersionClaim = jwt.getClaim("tokenVersion");
            Integer versaoToken = tokenVersionClaim != null ? tokenVersionClaim.intValue() : null;
            if (versaoToken == null || !versaoToken.equals(usuario.getTokenVersion())) {
                return OAuth2TokenValidatorResult.failure(
                        new OAuth2Error("invalid_token", "Sessão revogada ou versão do token inválida.", null)
                );
            }

            return OAuth2TokenValidatorResult.success();
        };

        decoder.setJwtValidator(new DelegatingOAuth2TokenValidator<>(defaultValidator, sessionValidator));
        return decoder;
    }

    @Bean
    public JwtEncoder jwtEncoder() {
        SecretKeySpec secretKey = getSecretKeySpec();
        return new NimbusJwtEncoder(new ImmutableSecret<>(secretKey));
    }

    @Bean
    public JwtGrantedAuthoritiesConverter jwtGrantedAuthoritiesConverter() {
        JwtGrantedAuthoritiesConverter converter = new JwtGrantedAuthoritiesConverter();
        converter.setAuthoritiesClaimName("role");
        converter.setAuthorityPrefix("ROLE_");
        return converter;
    }

    @Bean
    public JwtAuthenticationConverter jwtAuthenticationConverter() {
        JwtGrantedAuthoritiesConverter roleAuthoritiesConverter = jwtGrantedAuthoritiesConverter();
        JwtAuthenticationConverter authenticationConverter = new JwtAuthenticationConverter();

        authenticationConverter.setJwtGrantedAuthoritiesConverter(jwt -> {
            Collection<GrantedAuthority> roleAuthorities = roleAuthoritiesConverter.convert(jwt);
            List<GrantedAuthority> authorities = new ArrayList<>();
            if (roleAuthorities != null) {
                authorities.addAll(roleAuthorities);
            }

            String nivelRestricao = jwt.getClaimAsString("nivelRestricao");
            if (nivelRestricao != null && !nivelRestricao.isBlank()) {
                authorities.add(new SimpleGrantedAuthority("REST_" + nivelRestricao));
            }

            if (Boolean.TRUE.equals(jwt.getClaimAsBoolean("autorizacaoSaude"))) {
                authorities.add(new SimpleGrantedAuthority("AUTH_SAUDE"));
            }

            return authorities;
        });

        return authenticationConverter;
    }

    public AuthenticationEntryPoint authenticationEntryPoint() {
        return (request, response, authException) -> {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setCharacterEncoding(StandardCharsets.UTF_8.name());
            response.setContentType(MediaType.APPLICATION_PROBLEM_JSON_VALUE);

            String detail = resolverDetalheErroAutenticacao(authException);
            String json = String.format(
                    "{\"type\":\"https://api.sigi.com/errors/nao-autorizado\",\"title\":\"Não Autorizado\",\"status\":401,\"detail\":\"%s\",\"timestamp\":\"%s\"}",
                    detail,
                    Instant.now().toString()
            );
            response.getWriter().write(json);
        };
    }

    public AccessDeniedHandler accessDeniedHandler() {
        return (request, response, accessDeniedException) -> {
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            response.setCharacterEncoding(StandardCharsets.UTF_8.name());
            response.setContentType(MediaType.APPLICATION_PROBLEM_JSON_VALUE);
            String json = String.format(
                    "{\"type\":\"https://api.sigi.com/errors/acesso-negado\",\"title\":\"Acesso Negado\",\"status\":403,\"detail\":\"Seu perfil não possui permissão para acessar este recurso.\",\"timestamp\":\"%s\"}",
                    Instant.now().toString()
            );
            response.getWriter().write(json);
        };
    }

    private String resolverDetalheErroAutenticacao(Exception authException) {
        if (authException != null && authException.getCause() instanceof JwtValidationException validationEx) {
            for (OAuth2Error error : validationEx.getErrors()) {
                String desc = error.getDescription();
                if (desc != null && (desc.startsWith("Acesso revogado")
                        || desc.startsWith("Sessão revogada")
                        || desc.startsWith("Usuário associado"))) {
                    return desc;
                }
            }
            return "Token JWT inválido ou expirado.";
        }
        if (authException instanceof OAuth2AuthenticationException oauth2Ex) {
            String desc = oauth2Ex.getError() != null ? oauth2Ex.getError().getDescription() : null;
            if (desc != null && (desc.startsWith("Acesso revogado")
                    || desc.startsWith("Sessão revogada")
                    || desc.startsWith("Usuário associado"))) {
                return desc;
            }
            return "Token JWT inválido ou expirado.";
        }
        return "Autenticação obrigatória para acessar este recurso.";
    }

    private SecretKeySpec getSecretKeySpec() {
        byte[] keyBytes = jwtSecret.getBytes(StandardCharsets.UTF_8);
        return new SecretKeySpec(keyBytes, "HmacSHA256");
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authenticationConfiguration) throws Exception {
        return authenticationConfiguration.getAuthenticationManager();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();

        config.setAllowedOrigins(allowedOrigins);
        config.setAllowedMethods(
                List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
        );
        config.setAllowedHeaders(
                List.of("Authorization", "Content-Type", "Accept")
        );

        UrlBasedCorsConfigurationSource source =
                new UrlBasedCorsConfigurationSource();

        source.registerCorsConfiguration("/api/**", config);

        return source;
    }
}
