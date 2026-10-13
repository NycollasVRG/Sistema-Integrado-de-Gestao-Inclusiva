package com.br.CLAI.controller;

import com.br.CLAI.dto.request.PeaRequestDTO;
import com.br.CLAI.dto.request.PeaUpdateDTO;
import com.br.CLAI.dto.response.PeaResponseDTO;
import com.br.CLAI.service.PeaService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/peas")
public class PeaController {

    private final PeaService service;

    public PeaController(PeaService service) {
        this.service = service;
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

    @PostMapping
    public ResponseEntity<PeaResponseDTO> criar(
            @Valid @RequestBody PeaRequestDTO dto,
            @RequestHeader("X-User-Id") UUID usuarioId) {

        PeaResponseDTO response =
                service.criar(dto, usuarioId);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<PeaResponseDTO> atualizar(
            @PathVariable UUID id,
            @Valid @RequestBody PeaUpdateDTO dto,
            @RequestHeader("X-User-Id") UUID usuarioId) {

        return ResponseEntity.ok(
                service.atualizar(id, dto, usuarioId)
        );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(
            @PathVariable UUID id,
            @RequestHeader("X-User-Id") UUID usuarioId) {

        service.excluir(id, usuarioId);

        return ResponseEntity.noContent().build();
    }
}