package com.br.CLAI.controller;

import com.br.CLAI.dto.request.AtendimentoRequestDTO;
import com.br.CLAI.dto.request.AtendimentoUpdateDTO;
import com.br.CLAI.dto.response.AtendimentoResponseDTO;
import com.br.CLAI.security.RbacGuard;
import com.br.CLAI.service.AtendimentoService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/atendimentos")
public class AtendimentoController {

    private final AtendimentoService service;
    private final RbacGuard rbacGuard;

    @Autowired
    public AtendimentoController(AtendimentoService service, RbacGuard rbacGuard) {
        this.service = service;
        this.rbacGuard = rbacGuard;
    }

    public AtendimentoController(AtendimentoService service) {
        this(service, new RbacGuard());
    }

    @PostMapping
    public ResponseEntity<AtendimentoResponseDTO> criar(
            @Valid @RequestBody AtendimentoRequestDTO dto,
            @AuthenticationPrincipal Jwt jwtAutenticado) {

        UUID usuarioId = rbacGuard.exigirUsuarioAutenticadoId(jwtAutenticado);
        return ResponseEntity.status(HttpStatus.CREATED).body(service.criar(dto, usuarioId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<AtendimentoResponseDTO> buscarPorId(@PathVariable UUID id) {
        return ResponseEntity.ok(service.buscarPorId(id));
    }

    @GetMapping("/aluno/{alunoId}")
    public ResponseEntity<List<AtendimentoResponseDTO>> listarPorAluno(@PathVariable UUID alunoId) {
        return ResponseEntity.ok(service.listarPorAluno(alunoId));
    }

    /**
     * Edita o relatório do atendimento. Somente o autor e apenas nas 24h seguintes à criação;
     * caso contrário responde {@code 403 Forbidden}.
     */
    @PutMapping("/{id}")
    public ResponseEntity<AtendimentoResponseDTO> atualizar(
            @PathVariable UUID id,
            @Valid @RequestBody AtendimentoUpdateDTO dto,
            @AuthenticationPrincipal Jwt jwtAutenticado) {

        UUID usuarioId = rbacGuard.exigirUsuarioAutenticadoId(jwtAutenticado);
        return ResponseEntity.ok(service.atualizar(id, dto, usuarioId));
    }
}
