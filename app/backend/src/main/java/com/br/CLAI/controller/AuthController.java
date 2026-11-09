package com.br.CLAI.controller;

import com.br.CLAI.dto.request.LoginRequestDTO;
import com.br.CLAI.dto.response.LoginResponseDTO;
import com.br.CLAI.dto.response.UsuarioSessaoDTO;
import com.br.CLAI.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponseDTO> login(@Valid @RequestBody LoginRequestDTO request) {
        return ResponseEntity.ok(authService.autenticar(request));
    }

    @GetMapping("/me")
    public ResponseEntity<UsuarioSessaoDTO> obterSessao(@AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(authService.obterSessaoAtual(jwt));
    }
}
