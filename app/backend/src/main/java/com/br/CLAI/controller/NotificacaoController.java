package com.br.CLAI.controller;

import com.br.CLAI.domain.Usuario;
import com.br.CLAI.dto.request.NotificacaoRequestDTO;
import com.br.CLAI.dto.response.NotificacaoResponseDTO;
import com.br.CLAI.security.RbacGuard;
import com.br.CLAI.service.NotificacaoService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/notificacoes")
public class NotificacaoController {

    private final NotificacaoService notificacaoService;
    private final RbacGuard rbacGuard;

    @Autowired
    public NotificacaoController(NotificacaoService notificacaoService, RbacGuard rbacGuard) {
        this.notificacaoService = notificacaoService;
        this.rbacGuard = rbacGuard;
    }

    public NotificacaoController(NotificacaoService notificacaoService) {
        this(notificacaoService, new RbacGuard());
    }

    /** Cria uma notificação genérica, reutilizável pelas US 01, US 08 e US 10. */
    @PostMapping
    public ResponseEntity<NotificacaoResponseDTO> criar(
            @Valid @RequestBody NotificacaoRequestDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(notificacaoService.criarNotificacao(dto));
    }

    @GetMapping
    public ResponseEntity<List<NotificacaoResponseDTO>> buscarNotificacoes(
            @RequestParam(name = "perfil", defaultValue = "COORDENADOR") String perfil,
            @RequestParam(name = "apenasNaoLidas", defaultValue = "false") Boolean apenasNaoLidas) {
        return ResponseEntity.ok(notificacaoService.buscarPorPerfil(perfil, apenasNaoLidas));
    }

    /**
     * Lista as notificações individuais direcionadas ao usuário autenticado (ex.: lembretes de compromissos de ata - TA8.3).
     */
    @GetMapping("/minhas")
    public ResponseEntity<List<NotificacaoResponseDTO>> buscarMinhasNotificacoes(
            @RequestParam(name = "apenasNaoLidas", defaultValue = "false") Boolean apenasNaoLidas,
            @AuthenticationPrincipal Jwt jwtAutenticado) {
        UUID usuarioId = rbacGuard.exigirUsuarioAutenticadoId(jwtAutenticado);
        return ResponseEntity.ok(notificacaoService.buscarPorUsuario(usuarioId, apenasNaoLidas));
    }

    @PatchMapping("/{id}/ler")
    public ResponseEntity<NotificacaoResponseDTO> marcarComoLida(
            @PathVariable UUID id,
            @AuthenticationPrincipal Jwt jwtAutenticado) {
        UUID usuarioId = resolverUsuarioOpcionalId(jwtAutenticado);
        return ResponseEntity.ok(notificacaoService.marcarComoLida(id, usuarioId));
    }

    private UUID resolverUsuarioOpcionalId(Jwt jwtAutenticado) {
        if (jwtAutenticado != null) {
            Usuario usuario = rbacGuard.converterJwtParaUsuario(jwtAutenticado);
            return usuario != null ? usuario.getId() : null;
        }
        return rbacGuard.getUsuarioAutenticado()
                .map(Usuario::getId)
                .orElse(null);
    }
}
