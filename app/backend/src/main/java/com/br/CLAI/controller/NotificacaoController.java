package com.br.CLAI.controller;

import com.br.CLAI.dto.request.NotificacaoRequestDTO;
import com.br.CLAI.dto.response.NotificacaoResponseDTO;
import com.br.CLAI.service.NotificacaoService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
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

    public NotificacaoController(NotificacaoService notificacaoService) {
        this.notificacaoService = notificacaoService;
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

    @PatchMapping("/{id}/ler")
    public ResponseEntity<NotificacaoResponseDTO> marcarComoLida(@PathVariable UUID id) {
        return ResponseEntity.ok(notificacaoService.marcarComoLida(id));
    }
}
