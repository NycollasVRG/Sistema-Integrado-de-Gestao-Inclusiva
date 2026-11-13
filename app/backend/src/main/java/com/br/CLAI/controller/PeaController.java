package com.br.CLAI.controller;

import com.br.CLAI.dto.request.PeaRequestDTO;
import com.br.CLAI.dto.request.PeaUpdateDTO;
import com.br.CLAI.dto.response.PeaResponseDTO;
import com.br.CLAI.security.RbacGuard;
import com.br.CLAI.service.PeaService;
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
@RequestMapping("/api/peas")
public class PeaController {

    private final PeaService service;
    private final RbacGuard rbacGuard;

    @Autowired
    public PeaController(PeaService service, RbacGuard rbacGuard) {
        this.service = service;
        this.rbacGuard = rbacGuard;
    }

    public PeaController(PeaService service) {
        this(service, new RbacGuard());
    }

    @GetMapping
    public ResponseEntity<List<PeaResponseDTO>> listarTodos() {

        return ResponseEntity.ok(
                service.listarTodos()
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<PeaResponseDTO> buscarPorId(
            @PathVariable UUID id) {

        return ResponseEntity.ok(
                service.buscarPorId(id)
        );
    }

    @GetMapping("/acompanhamento/{acompanhamentoId}")
    public ResponseEntity<List<PeaResponseDTO>> listarPorAcompanhamento(
            @PathVariable UUID acompanhamentoId) {

        return ResponseEntity.ok(
                service.listarPorAcompanhamento(acompanhamentoId)
        );
    }

    @GetMapping("/aluno/{alunoId}")
    public ResponseEntity<List<PeaResponseDTO>> listarPorAluno(
            @PathVariable UUID alunoId) {

        return ResponseEntity.ok(
                service.listarPorAluno(alunoId)
        );
    }

    @GetMapping("/pei/{peiId}")
    public ResponseEntity<List<PeaResponseDTO>> listarPorPei(
            @PathVariable UUID peiId) {

        return ResponseEntity.ok(
                service.listarPorPei(peiId)
        );
    }


    @PostMapping
    public ResponseEntity<PeaResponseDTO> criar(
            @Valid @RequestBody PeaRequestDTO dto,
            @AuthenticationPrincipal Jwt jwtAutenticado) {

        UUID usuarioId = rbacGuard.exigirUsuarioAutenticadoId(jwtAutenticado);
        PeaResponseDTO response = service.criar(dto, usuarioId);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<PeaResponseDTO> atualizar(
            @PathVariable UUID id,
            @Valid @RequestBody PeaUpdateDTO dto,
            @AuthenticationPrincipal Jwt jwtAutenticado) {

        UUID usuarioId = rbacGuard.exigirUsuarioAutenticadoId(jwtAutenticado);
        return ResponseEntity.ok(
                service.atualizar(id, dto, usuarioId)
        );
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