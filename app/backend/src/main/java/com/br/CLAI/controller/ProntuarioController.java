package com.br.CLAI.controller;

import com.br.CLAI.dto.response.HistoricoSocioemocionalResponseDTO;
import com.br.CLAI.dto.response.ProntuarioResponseDTO;
import com.br.CLAI.service.ProntuarioService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
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
@RequestMapping("/api/v1/alunos")
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

    /**
     * Endpoint exclusivo de consulta aos detalhes socioemocionais e histórico familiar (CA 1.2 / CA 2).
     * Exige Restrição Moderada ou superior (@PreAuthorize("@rbacGuard.temRestricaoModeradaOuSuperior()")).
     * Tentativas de acesso direto por PROFESSOR resultam em HTTP 403 Forbidden.
     */
    @GetMapping("/{estudanteId}/historico-socioemocional")
    @PreAuthorize("@rbacGuard.temRestricaoModeradaOuSuperior()")
    public ResponseEntity<HistoricoSocioemocionalResponseDTO> buscarHistoricoSocioemocional(@PathVariable UUID estudanteId) {
        return ResponseEntity.ok(prontuarioService.buscarHistoricoSocioemocional(estudanteId));
    }
}
