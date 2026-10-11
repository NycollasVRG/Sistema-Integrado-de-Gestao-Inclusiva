package com.br.CLAI.controller;

import com.br.CLAI.dto.request.EstudoDeCasoRequestDTO;
import com.br.CLAI.dto.response.EstudoDeCasoResponseDTO;
import com.br.CLAI.service.EstudoDeCasoService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/estudos-de-caso")
public class EstudoDeCasoController {

    private final EstudoDeCasoService service;

    public EstudoDeCasoController(EstudoDeCasoService service) {
        this.service = service;
    }

    @GetMapping("/{id}")
    public ResponseEntity<EstudoDeCasoResponseDTO> buscarPorId(@PathVariable UUID id) {
        EstudoDeCasoResponseDTO response = service.buscarPorId(id);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/aluno/{alunoId}")
    public ResponseEntity<java.util.List<EstudoDeCasoResponseDTO>> listarPorAluno(@PathVariable UUID alunoId) {
        java.util.List<EstudoDeCasoResponseDTO> response = service.listarPorAluno(alunoId);
        return ResponseEntity.ok(response);
    }

    @PostMapping
    public ResponseEntity<EstudoDeCasoResponseDTO> criarEstudoDeCaso(
            @Valid @RequestBody EstudoDeCasoRequestDTO dto,
            @RequestHeader(value = "X-User-Id", required = false) UUID usuarioId) {

        if (usuarioId == null) {
            usuarioId = UUID.randomUUID();
        }

        EstudoDeCasoResponseDTO response = service.criar(dto, usuarioId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}
