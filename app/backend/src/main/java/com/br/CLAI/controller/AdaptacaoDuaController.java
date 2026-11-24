package com.br.CLAI.controller;

import com.br.CLAI.dto.request.AdaptacaoDuaRequestDTO;
import com.br.CLAI.dto.response.AdaptacaoDuaResponseDTO;
import com.br.CLAI.service.AdaptacaoDuaService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** API de adaptação DUA de provas via IA (US 07 / Issue #108). */
@RestController
@RequestMapping("/api/dua")
public class AdaptacaoDuaController {

    private final AdaptacaoDuaService service;

    public AdaptacaoDuaController(AdaptacaoDuaService service) {
        this.service = service;
    }

    /** Retorna o preview da prova adaptada; o professor decide aceitar, editar ou rejeitar (TA7.3). */
    @PostMapping("/adaptar")
    @PreAuthorize("hasAnyRole('PROFESSOR', 'COORDENADOR', 'CLAI_PSICOPEDAGOGO', 'ADMIN')")
    public ResponseEntity<AdaptacaoDuaResponseDTO> adaptar(@Valid @RequestBody AdaptacaoDuaRequestDTO dto) {
        return ResponseEntity.ok(service.adaptarProva(dto));
    }
}
