package com.br.CLAI.controller;

import com.br.CLAI.dto.request.PeiRequestDTO;
import com.br.CLAI.dto.request.PeiUpdateDTO;
import com.br.CLAI.dto.response.PeaResponseDTO;
import com.br.CLAI.dto.response.PeiResponseDTO;
import com.br.CLAI.service.PeiService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/peis")
public class PeiController {

    private final PeiService service;

    public PeiController(PeiService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<List<PeiResponseDTO>> listarTodos() {
        return ResponseEntity.ok(service.listarTodos());
    }

    @GetMapping("/{id}")
    public ResponseEntity<PeiResponseDTO> buscarPorId(@PathVariable UUID id) {
        return ResponseEntity.ok(service.buscarPorId(id));
    }

    @GetMapping("/acompanhamento/{acompanhamentoId}")
    public ResponseEntity<List<PeiResponseDTO>> listarPorAcompanhamento(
            @PathVariable UUID acompanhamentoId) {

        return ResponseEntity.ok(service.listarPorAcompanhamento(acompanhamentoId));
    }

    @GetMapping("/aluno/{alunoId}")
    public ResponseEntity<List<PeiResponseDTO>> listarPorAluno(
            @PathVariable UUID alunoId) {

        return ResponseEntity.ok(service.listarPorAluno(alunoId));
    }

    // TA3.2 e TA11.3 - Anexos sensíveis do PEI restritos a RESTRICAO_MODERADA ou superior (equipe CLAI)
    @GetMapping("/{id}/anexos-sensiveis")
    @PreAuthorize("@rbacGuard.temRestricaoModeradaOuSuperior()")
    public ResponseEntity<List<PeaResponseDTO>> listarAnexosSensiveis(
            @PathVariable UUID id,
            @RequestHeader(value = "X-User-Perfil", required = false) String perfil) {

        return ResponseEntity.ok(service.listarAnexosSensiveis(id, perfil));
    }

    @PostMapping
    public ResponseEntity<PeiResponseDTO> criar(
            @Valid @RequestBody PeiRequestDTO dto,
            @RequestHeader("X-User-Id") UUID usuarioId) {

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(service.criar(dto, usuarioId));
    }

    @PutMapping("/{id}")
    public ResponseEntity<PeiResponseDTO> atualizar(
            @PathVariable UUID id,
            @Valid @RequestBody PeiUpdateDTO dto,
            @RequestHeader("X-User-Id") UUID usuarioId) {

        return ResponseEntity.ok(service.atualizar(id, dto, usuarioId));
    }

    // TA3.4 - inativação (soft delete): a linha continua no banco.
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> inativar(
            @PathVariable UUID id,
            @RequestHeader("X-User-Id") UUID usuarioId) {

        service.inativar(id, usuarioId);

        return ResponseEntity.noContent().build();
    }
}
