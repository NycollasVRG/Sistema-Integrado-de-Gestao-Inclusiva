package com.br.CLAI.controller;

import com.br.CLAI.domain.Usuario;
import com.br.CLAI.domain.enums.StatusAluno;
import com.br.CLAI.dto.request.AlunoRequestDTO;
import com.br.CLAI.dto.response.AlunoResponseDTO;
import com.br.CLAI.security.RbacGuard;
import com.br.CLAI.service.AlunoService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/** US 12 - Gestão cadastral de alunos e tags de dificuldade. */
@RestController
@RequestMapping("/api/v1/alunos")
@CrossOrigin(origins = "*")
public class AlunoController {

    private final AlunoService service;
    private final RbacGuard rbacGuard;

    @Autowired
    public AlunoController(AlunoService service, RbacGuard rbacGuard) {
        this.service = service;
        this.rbacGuard = rbacGuard;
    }

    @PostMapping
    public ResponseEntity<AlunoResponseDTO> criar(
            @Valid @RequestBody AlunoRequestDTO dto,
            @AuthenticationPrincipal Usuario usuarioAutenticado) {

        UUID usuarioId = rbacGuard.exigirUsuarioAutenticadoId(usuarioAutenticado);
        return ResponseEntity.status(HttpStatus.CREATED).body(service.criar(dto, usuarioId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<AlunoResponseDTO> buscarPorId(@PathVariable UUID id) {
        return ResponseEntity.ok(service.buscarPorId(id));
    }

    @GetMapping
    public ResponseEntity<Page<AlunoResponseDTO>> listar(
            @RequestParam(required = false) String termo,
            @RequestParam(required = false) String curso,
            @RequestParam(required = false) String turma,
            @RequestParam(required = false) String tag,
            @RequestParam(required = false) String tagAcessibilidade,
            @RequestParam(defaultValue = "true") Boolean ativo,
            @PageableDefault(size = 10, sort = "nomeCompleto") Pageable pageable) {

        // "tag" (critério de aceite) e "tagAcessibilidade" (descrição da task) são equivalentes.
        String tagFiltro = (tag != null && !tag.isBlank()) ? tag : tagAcessibilidade;
        return ResponseEntity.ok(service.listar(termo, curso, turma, tagFiltro, ativo, pageable));
    }

    @PutMapping("/{id}")
    public ResponseEntity<AlunoResponseDTO> atualizar(
            @PathVariable UUID id,
            @Valid @RequestBody AlunoRequestDTO dto,
            @AuthenticationPrincipal Usuario usuarioAutenticado) {

        UUID usuarioId = rbacGuard.exigirUsuarioAutenticadoId(usuarioAutenticado);
        return ResponseEntity.ok(service.atualizar(id, dto, usuarioId));
    }

    /** Soft delete. Opcionalmente ?status=EVADIDO (padrão: INATIVO). */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> inativar(
            @PathVariable UUID id,
            @RequestParam(required = false) StatusAluno status,
            @AuthenticationPrincipal Usuario usuarioAutenticado) {

        UUID usuarioId = rbacGuard.exigirUsuarioAutenticadoId(usuarioAutenticado);
        service.inativar(id, status, usuarioId);
        return ResponseEntity.noContent().build();
    }
}
