package com.br.CLAI.controller;

import com.br.CLAI.dto.response.UsuarioAdminResponseDTO;
import com.br.CLAI.dto.response.UsuarioRevogadoResponseDTO;
import com.br.CLAI.service.UsuarioAdminService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/usuarios")
public class UsuarioAdminController {

    private final UsuarioAdminService usuarioAdminService;

    public UsuarioAdminController(UsuarioAdminService usuarioAdminService) {
        this.usuarioAdminService = usuarioAdminService;
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<UsuarioAdminResponseDTO>> listarTodos() {
        return ResponseEntity.ok(usuarioAdminService.listarTodos());
    }

    @PatchMapping("/{id}/revogar-acesso")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UsuarioRevogadoResponseDTO> revogarAcesso(@PathVariable UUID id) {
        return ResponseEntity.ok(usuarioAdminService.revogarAcesso(id));
    }
}

