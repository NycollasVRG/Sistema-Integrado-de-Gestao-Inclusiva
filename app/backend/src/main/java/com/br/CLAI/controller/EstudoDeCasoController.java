package com.br.CLAI.controller;

import com.br.CLAI.domain.Usuario;
import com.br.CLAI.dto.request.EstudoDeCasoRequestDTO;
import com.br.CLAI.dto.request.EstudoDeCasoUpdateDTO;
import com.br.CLAI.dto.response.EstudoDeCasoResponseDTO;
import com.br.CLAI.security.RbacGuard;
import com.br.CLAI.service.EstudoDeCasoService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/estudos-de-caso")
@CrossOrigin(origins = "*")
public class EstudoDeCasoController {

    private final EstudoDeCasoService service;
    private final RbacGuard rbacGuard;

    @Autowired
    public EstudoDeCasoController(EstudoDeCasoService service, RbacGuard rbacGuard) {
        this.service = service;
        this.rbacGuard = rbacGuard;
    }

    public EstudoDeCasoController(EstudoDeCasoService service) {
        this(service, new RbacGuard());
    }

    @GetMapping("/{id}")
    public ResponseEntity<EstudoDeCasoResponseDTO> buscarPorId(@PathVariable UUID id) {
        EstudoDeCasoResponseDTO response = service.buscarPorId(id);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/aluno/{alunoId}")
    public ResponseEntity<List<EstudoDeCasoResponseDTO>> listarPorAluno(@PathVariable UUID alunoId) {
        List<EstudoDeCasoResponseDTO> response = service.listarPorAluno(alunoId);
        return ResponseEntity.ok(response);
    }

    @PostMapping
    public ResponseEntity<EstudoDeCasoResponseDTO> criarEstudoDeCaso(
            @Valid @RequestBody EstudoDeCasoRequestDTO dto,
            @AuthenticationPrincipal Usuario usuarioAutenticado) {

        UUID usuarioId = rbacGuard.exigirUsuarioAutenticadoId(usuarioAutenticado);
        EstudoDeCasoResponseDTO response = service.criar(dto, usuarioId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<EstudoDeCasoResponseDTO> atualizarEstudoDeCaso(
            @PathVariable UUID id,
            @Valid @RequestBody EstudoDeCasoUpdateDTO dto,
            @AuthenticationPrincipal Usuario usuarioAutenticado) {

        UUID usuarioId = rbacGuard.exigirUsuarioAutenticadoId(usuarioAutenticado);
        EstudoDeCasoResponseDTO response = service.atualizar(id, dto, usuarioId);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluirEstudoDeCaso(
            @PathVariable UUID id,
            @AuthenticationPrincipal Usuario usuarioAutenticado) {

        UUID usuarioId = rbacGuard.exigirUsuarioAutenticadoId(usuarioAutenticado);
        service.excluir(id, usuarioId);
        return ResponseEntity.noContent().build();
    }
}

