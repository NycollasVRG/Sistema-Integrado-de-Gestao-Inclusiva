package com.br.CLAI.service;

import com.br.CLAI.domain.Usuario;
import com.br.CLAI.dto.request.LoginRequestDTO;
import com.br.CLAI.dto.response.LoginResponseDTO;
import com.br.CLAI.dto.response.UsuarioSessaoDTO;
import com.br.CLAI.security.JwtService;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    public AuthService(AuthenticationManager authenticationManager, JwtService jwtService) {
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
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
