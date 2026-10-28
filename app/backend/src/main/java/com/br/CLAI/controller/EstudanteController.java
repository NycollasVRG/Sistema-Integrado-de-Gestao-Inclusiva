package com.br.CLAI.controller;

import com.br.CLAI.domain.enums.StatusEstudante;
import com.br.CLAI.dto.request.EstudanteRequestDTO;
import com.br.CLAI.dto.response.EstudanteResponseDTO;
import com.br.CLAI.dto.response.PaginaResponseDTO;
import com.br.CLAI.service.EstudanteService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/estudantes")
@CrossOrigin(origins = "*")
public class EstudanteController {

    private final EstudanteService service;

    public EstudanteController(EstudanteService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<EstudanteResponseDTO> criar(
            @Valid @RequestBody EstudanteRequestDTO dto,
            @RequestHeader(value = "X-User-Id", required = false) UUID usuarioId) {

        EstudanteResponseDTO response = service.criar(dto, usuarioOuAnonimo(usuarioId));
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /** Fonte dos dados do cabeçalho do Prontuário Unificado (US 09). */
    @GetMapping("/{id}")
    public ResponseEntity<EstudanteResponseDTO> buscarPorId(@PathVariable("id") UUID id) {
        return ResponseEntity.ok(service.buscarPorId(id));
    }

    @GetMapping
    public ResponseEntity<PaginaResponseDTO<EstudanteResponseDTO>> listar(
            @RequestParam(name = "termo", required = false) String termo,
            @RequestParam(name = "curso", required = false) String curso,
            @RequestParam(name = "turma", required = false) String turma,
            @RequestParam(name = "tag", required = false) String tag,
            @RequestParam(name = "tagAcessibilidade", required = false) String tagAcessibilidade,
            @RequestParam(name = "ativo", required = false, defaultValue = "true") Boolean ativo,
            @PageableDefault(size = 10, sort = "nomeCompleto") Pageable pageable) {

        // "tag" (usado nos critérios de aceite) e "tagAcessibilidade" (nome na descrição) são equivalentes.
        String tagFiltro = (tag != null && !tag.isBlank()) ? tag : tagAcessibilidade;
        return ResponseEntity.ok(service.listar(termo, curso, turma, tagFiltro, ativo, pageable));
    }

    @PutMapping("/{id}")
    public ResponseEntity<EstudanteResponseDTO> atualizar(
            @PathVariable("id") UUID id,
            @Valid @RequestBody EstudanteRequestDTO dto,
            @RequestHeader(value = "X-User-Id", required = false) UUID usuarioId) {

        return ResponseEntity.ok(service.atualizar(id, dto, usuarioOuAnonimo(usuarioId)));
    }

    /** Soft delete. Opcionalmente ?status=EVADIDO (padrão: INATIVO). */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> inativar(
            @PathVariable("id") UUID id,
            @RequestParam(name = "status", required = false) StatusEstudante status,
            @RequestHeader(value = "X-User-Id", required = false) UUID usuarioId) {

        service.inativar(id, status, usuarioOuAnonimo(usuarioId));
        return ResponseEntity.noContent().build();
    }

    // Mesmo comportamento dos demais controllers enquanto não há autenticação real.
    private UUID usuarioOuAnonimo(UUID usuarioId) {
        return usuarioId != null ? usuarioId : UUID.randomUUID();
    }
}
