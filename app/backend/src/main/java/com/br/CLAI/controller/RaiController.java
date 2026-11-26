package com.br.CLAI.controller;

import com.br.CLAI.domain.Usuario;
import com.br.CLAI.dto.request.RaiRequestDTO;
import com.br.CLAI.dto.response.RaiResponseDTO;
import com.br.CLAI.security.RbacGuard;
import com.br.CLAI.service.RaiService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/rais")
public class RaiController {

    private final RaiService raiService;
    private final RbacGuard rbacGuard;

    public RaiController(RaiService raiService) {
        this(raiService, new RbacGuard());
    }

    @Autowired
    public RaiController(RaiService raiService, RbacGuard rbacGuard) {
        this.raiService = raiService;
        this.rbacGuard = rbacGuard;
    }

    @PostMapping
    public ResponseEntity<RaiResponseDTO> emitirRai(@Valid @RequestBody RaiRequestDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(raiService.emitirRai(dto, extrairUsuarioIdAutenticado()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<RaiResponseDTO> atualizarRai(
            @PathVariable UUID id,
            @Valid @RequestBody RaiRequestDTO dto) {
        return ResponseEntity.ok(raiService.atualizarRai(id, dto, extrairUsuarioIdAutenticado()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluirRai(@PathVariable UUID id) {
        raiService.excluirRai(id, extrairUsuarioIdAutenticado());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/aluno/{alunoId}")
    public ResponseEntity<List<RaiResponseDTO>> buscarPorAluno(@PathVariable UUID alunoId) {
        return ResponseEntity.ok(raiService.buscarPorAluno(alunoId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<RaiResponseDTO> buscarPorId(@PathVariable UUID id) {
        return ResponseEntity.ok(raiService.buscarPorId(id));
    }

    private UUID extrairUsuarioIdAutenticado() {
        Optional<Usuario> usuario = rbacGuard.getUsuarioAutenticado();
        return usuario.map(Usuario::getId).orElse(null);
    }
}
