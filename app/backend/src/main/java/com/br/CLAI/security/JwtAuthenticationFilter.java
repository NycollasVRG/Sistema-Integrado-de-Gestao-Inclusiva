package com.br.CLAI.security;

import com.br.CLAI.domain.Usuario;
import com.br.CLAI.repository.UsuarioRepository;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Optional;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UsuarioRepository usuarioRepository;

    public JwtAuthenticationFilter(JwtService jwtService, UsuarioRepository usuarioRepository) {
        this.jwtService = jwtService;
        this.usuarioRepository = usuarioRepository;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        final String authHeader = request.getHeader("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        final String jwt = authHeader.substring(7).trim();
        if (jwt.isEmpty()) {
            escreverErroNaoAutorizado(response, "Token JWT ausente no cabeçalho Authorization.");
            return;
        }

        try {
            final String email = jwtService.extrairEmail(jwt);

            if (email != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                Optional<Usuario> usuarioOpt = usuarioRepository.findByEmail(email);

                if (usuarioOpt.isEmpty()) {
                    SecurityContextHolder.clearContext();
                    escreverErroNaoAutorizado(response, "Usuário associado ao token não encontrado.");
                    return;
                }

                Usuario usuario = usuarioOpt.get();

                if (!Boolean.TRUE.equals(usuario.getAcessoAtivo())) {
                    SecurityContextHolder.clearContext();
                    escreverErroNaoAutorizado(response, "Acesso revogado: o vínculo do usuário está desativado.");
                    return;
                }

                if (!jwtService.isTokenValidoParaSessaoAtiva(jwt, usuario)) {
                    SecurityContextHolder.clearContext();
                    escreverErroNaoAutorizado(response, "Sessão revogada ou versão do token inválida.");
                    return;
                }

                UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                        usuario,
                        null,
                        usuario.getAuthorities()
                );
                authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authToken);
            }

            filterChain.doFilter(request, response);

        } catch (JwtException | IllegalArgumentException ex) {
            SecurityContextHolder.clearContext();
            escreverErroNaoAutorizado(response, "Token JWT inválido ou expirado.");
        }
    }

    private void escreverErroNaoAutorizado(HttpServletResponse response, String detalhe) throws IOException {
        response.setStatus(HttpStatus.UNAUTHORIZED.value());
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        response.setContentType(MediaType.APPLICATION_PROBLEM_JSON_VALUE);
        String json = String.format(
                "{\"type\":\"https://api.sigi.com/errors/nao-autorizado\",\"title\":\"Não Autorizado\",\"status\":401,\"detail\":\"%s\",\"timestamp\":\"%s\"}",
                detalhe,
                Instant.now().toString()
        );
        response.getWriter().write(json);
    }
}
