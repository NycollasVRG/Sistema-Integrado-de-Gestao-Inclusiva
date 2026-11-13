package com.br.CLAI.controller;

import com.br.CLAI.dto.request.PlanoAcaoRequestDTO;
import com.br.CLAI.dto.request.PlanoAcaoUpdateDTO;
import com.br.CLAI.dto.response.PlanoAcaoResponseDTO;
import com.br.CLAI.security.RbacGuard;
import com.br.CLAI.service.PlanoAcaoService;
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
@RequestMapping("/api/planos-acao")
public class PlanoAcaoController {

    private final PlanoAcaoService service;
    private final RbacGuard rbacGuard;

    @Autowired
    public PlanoAcaoController(PlanoAcaoService service, RbacGuard rbacGuard) {
        this.service = service;
        this.rbacGuard = rbacGuard;
    }

    public PlanoAcaoController(PlanoAcaoService service) {
        this(service, new RbacGuard());
    }

    @GetMapping
    public ResponseEntity<List<PlanoAcaoResponseDTO>> listarTodos() {
        return ResponseEntity.ok(service.listarTodos());
    }

    @GetMapping("/{id}")
    public ResponseEntity<PlanoAcaoResponseDTO> buscarPorId(@PathVariable UUID id) {
        return ResponseEntity.ok(service.buscarPorId(id));
    }

    @GetMapping("/acompanhamento/{acompanhamentoId}")
    public ResponseEntity<List<PlanoAcaoResponseDTO>> listarPorAcompanhamento(
            @PathVariable UUID acompanhamentoId) {
        return ResponseEntity.ok(service.listarPorAcompanhamento(acompanhamentoId));
    }

    @GetMapping("/aluno/{alunoId}")
    public ResponseEntity<List<PlanoAcaoResponseDTO>> listarPorAluno(@PathVariable UUID alunoId) {
        return ResponseEntity.ok(service.listarPorAluno(alunoId));
    }

    @PostMapping
    public ResponseEntity<PlanoAcaoResponseDTO> criar(
            @Valid @RequestBody PlanoAcaoRequestDTO dto,
            @AuthenticationPrincipal Jwt jwtAutenticado) {

        UUID usuarioId = rbacGuard.exigirUsuarioAutenticadoId(jwtAutenticado);
        PlanoAcaoResponseDTO response = service.criar(dto, usuarioId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<PlanoAcaoResponseDTO> atualizar(
            @PathVariable UUID id,
            @Valid @RequestBody PlanoAcaoUpdateDTO dto,
            @AuthenticationPrincipal Jwt jwtAutenticado) {

        UUID usuarioId = rbacGuard.exigirUsuarioAutenticadoId(jwtAutenticado);
        return ResponseEntity.ok(service.atualizar(id, dto, usuarioId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(
            @PathVariable UUID id,
            @AuthenticationPrincipal Jwt jwtAutenticado) {

        UUID usuarioId = rbacGuard.exigirUsuarioAutenticadoId(jwtAutenticado);
        service.excluir(id, usuarioId);
        return ResponseEntity.noContent().build();
    }
}
