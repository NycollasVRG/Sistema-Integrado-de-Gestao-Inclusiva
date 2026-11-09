package com.br.CLAI.service;

import com.br.CLAI.domain.Usuario;
import com.br.CLAI.dto.request.LoginRequestDTO;
import com.br.CLAI.dto.response.LoginResponseDTO;
import com.br.CLAI.dto.response.UsuarioSessaoDTO;
import com.br.CLAI.security.JwtService;
import com.br.CLAI.security.RbacGuard;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final RbacGuard rbacGuard;

    @Autowired
    public AuthService(AuthenticationManager authenticationManager, JwtService jwtService, RbacGuard rbacGuard) {
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        this.rbacGuard = rbacGuard;
    }

    public AuthService(AuthenticationManager authenticationManager, JwtService jwtService) {
        this(authenticationManager, jwtService, new RbacGuard());
    }

    public LoginResponseDTO autenticar(LoginRequestDTO request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.email(), request.senha())
        );

        Usuario usuario = (Usuario) authentication.getPrincipal();
        String token = jwtService.gerarToken(usuario);

        return new LoginResponseDTO(
                token,
                "Bearer",
                usuario.getId(),
                usuario.getNome(),
                usuario.getEmail(),
                usuario.getRole(),
                usuario.getNivelRestricao(),
                usuario.getAutorizacaoSaude(),
                usuario.getTokenVersion()
        );
    }

    public UsuarioSessaoDTO obterSessaoAtual(Jwt jwt) {
        Usuario usuario = rbacGuard.exigirUsuarioAutenticado(jwt);
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        List<String> authorities;
        if (auth != null && auth.getAuthorities() != null && !auth.getAuthorities().isEmpty()) {
            authorities = auth.getAuthorities().stream()
                    .map(GrantedAuthority::getAuthority)
                    .filter(authority -> !authority.startsWith("FACTOR_"))
                    .toList();
        } else {
            authorities = usuario.getAuthorities().stream()
                    .map(GrantedAuthority::getAuthority)
                    .toList();
        }

        return new UsuarioSessaoDTO(
                usuario.getId(),
                usuario.getNome(),
                usuario.getEmail(),
                usuario.getRole(),
                usuario.getNivelRestricao(),
                usuario.getAutorizacaoSaude(),
                usuario.getAcessoAtivo(),
                usuario.getTokenVersion(),
                authorities
        );
    }

    public UsuarioSessaoDTO obterSessaoAtual(Usuario usuario) {
        List<String> authorities = usuario.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .toList();

        return new UsuarioSessaoDTO(
                usuario.getId(),
                usuario.getNome(),
                usuario.getEmail(),
                usuario.getRole(),
                usuario.getNivelRestricao(),
                usuario.getAutorizacaoSaude(),
                usuario.getAcessoAtivo(),
                usuario.getTokenVersion(),
                authorities
        );
    }
}
