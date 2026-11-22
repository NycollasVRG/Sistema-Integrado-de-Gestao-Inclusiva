package com.br.CLAI.controller;

import com.br.CLAI.domain.enums.StatusIndicacao;
import com.br.CLAI.dto.request.AprovacaoIndicacaoRequestDTO;
import com.br.CLAI.dto.request.IndicacaoRequestDTO;
import com.br.CLAI.dto.request.RejeicaoIndicacaoRequestDTO;
import com.br.CLAI.dto.response.IndicacaoResponseDTO;
import com.br.CLAI.security.RbacGuard;
import com.br.CLAI.service.IndicacaoService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/indicacoes")
public class IndicacaoController {

    private final IndicacaoService service;
    private final RbacGuard rbacGuard;

    @Autowired
    public IndicacaoController(IndicacaoService service, RbacGuard rbacGuard) {
        this.service = service;
        this.rbacGuard = rbacGuard;
    }

    public IndicacaoController(IndicacaoService service) {
        this(service, new RbacGuard());
    }

    /**
     * Registra uma nova indicação de demanda espontânea (TA10.1 / TA10.2).
     * Exige justificativa pedagógica (@NotBlank) e disciplinas observadas (@NotEmpty),
     * muda o status do estudante para EM_TRIAGEM e notifica a equipe CLAI.
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('PROFESSOR', 'COORDENADOR', 'CLAI_PSICOPEDAGOGO', 'ADMIN')")
    public ResponseEntity<IndicacaoResponseDTO> criar(
            @Valid @RequestBody IndicacaoRequestDTO dto,
            @AuthenticationPrincipal Jwt jwtAutenticado) {

        UUID solicitanteId = rbacGuard.exigirUsuarioAutenticadoId(jwtAutenticado);
        IndicacaoResponseDTO response = service.criar(dto, solicitanteId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Aprova uma indicação pendente (TA10.3), restaurando o estudante para ATIVO
     * e iniciando o fluxo de Estudo de Caso em rascunho.
     * Restrito à equipe CLAI/Coordenação/Admin (@rbacGuard.temRestricaoModeradaOuSuperior()).
     */
    @PatchMapping("/{id}/aprovar")
    @PreAuthorize("@rbacGuard.temRestricaoModeradaOuSuperior()")
    public ResponseEntity<IndicacaoResponseDTO> aprovar(
            @PathVariable UUID id,
            @RequestBody(required = false) AprovacaoIndicacaoRequestDTO dto,
            @AuthenticationPrincipal Jwt jwtAutenticado) {

        UUID decisorId = rbacGuard.exigirUsuarioAutenticadoId(jwtAutenticado);
        return ResponseEntity.ok(service.aprovar(id, dto, decisorId));
    }

    /**
     * Rejeita uma indicação pendente exigindo justificativa documentada (TA10.3).
     * Restrito à equipe CLAI/Coordenação/Admin (@rbacGuard.temRestricaoModeradaOuSuperior()).
     */
    @PatchMapping("/{id}/rejeitar")
    @PreAuthorize("@rbacGuard.temRestricaoModeradaOuSuperior()")
    public ResponseEntity<IndicacaoResponseDTO> rejeitar(
            @PathVariable UUID id,
            @Valid @RequestBody RejeicaoIndicacaoRequestDTO dto,
            @AuthenticationPrincipal Jwt jwtAutenticado) {

        UUID decisorId = rbacGuard.exigirUsuarioAutenticadoId(jwtAutenticado);
        return ResponseEntity.ok(service.rejeitar(id, dto, decisorId));
    }

    /**
     * Lista indicações para o painel da equipe CLAI, com filtro opcional por status.
     */
    @GetMapping
    @PreAuthorize("@rbacGuard.temRestricaoModeradaOuSuperior()")
    public ResponseEntity<List<IndicacaoResponseDTO>> listar(
            @RequestParam(name = "status", required = false) StatusIndicacao status) {
        return ResponseEntity.ok(service.listar(status));
    }

    @GetMapping("/{id}")
    public ResponseEntity<IndicacaoResponseDTO> buscarPorId(@PathVariable UUID id) {
        return ResponseEntity.ok(service.buscarPorId(id));
    }

    @GetMapping("/aluno/{alunoId}")
    public ResponseEntity<List<IndicacaoResponseDTO>> listarPorAluno(@PathVariable UUID alunoId) {
        return ResponseEntity.ok(service.listarPorAluno(alunoId));
    }
}
