package com.br.CLAI.controller;

import com.br.CLAI.dto.response.ProntuarioResponseDTO;
import com.br.CLAI.service.ProntuarioService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

/**
 * Controller do Prontuário Unificado do Estudante (US 09 / TA11.3).
 */
@RestController
@RequestMapping("/api/v1/estudantes")
@CrossOrigin(origins = "*")
public class ProntuarioController {

    private final ProntuarioService prontuarioService;

    public ProntuarioController(ProntuarioService prontuarioService) {
        this.prontuarioService = prontuarioService;
    }

    /**
     * Consulta consolidada do Prontuário Unificado do Estudante.
     * Retorna HTTP 200 para usuários autenticados.
     * Omissão de campos sensíveis (histórico familiar e socioemocional) é aplicada
     * para perfis de ACESSO_FUNCIONAL (PROFESSOR) em conformidade com o TA11.3.
     */
    @GetMapping("/{estudanteId}/prontuario")
    public ResponseEntity<ProntuarioResponseDTO> buscarProntuario(@PathVariable UUID estudanteId) {
        return ResponseEntity.ok(prontuarioService.buscarProntuarioPorEstudante(estudanteId));
    }
}
