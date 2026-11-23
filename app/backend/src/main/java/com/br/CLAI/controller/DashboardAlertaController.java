package com.br.CLAI.controller;

import com.br.CLAI.domain.enums.SeveridadeAlerta;
import com.br.CLAI.dto.request.SuapBoletimDTO;
import com.br.CLAI.dto.response.AlertaPedagogicoResponseDTO;
import com.br.CLAI.security.RbacGuard;
import com.br.CLAI.service.AlertaPedagogicoService;
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

/**
 * API do Dashboard de Alertas Pedagógicos e Indicadores da CLAI (US 05 / Issue #106).
 * <p>
 * Restrita à gestão da CLAI, coordenação de curso e administração
 * ({@code @rbacGuard.temRestricaoModeradaOuSuperior()}).
 */
@RestController
@RequestMapping("/api/dashboard/alertas")
public class DashboardAlertaController {

    private final AlertaPedagogicoService alertaService;
    private final RbacGuard rbacGuard;

    @Autowired
    public DashboardAlertaController(AlertaPedagogicoService alertaService, RbacGuard rbacGuard) {
        this.alertaService = alertaService;
        this.rbacGuard = rbacGuard != null ? rbacGuard : new RbacGuard();
    }

    public DashboardAlertaController(AlertaPedagogicoService alertaService) {
        this(alertaService, new RbacGuard());
    }

    /**
     * Lista alertas do Dashboard com filtros combinados por Unidade, Curso, Turma e Tratado (TA5.3 e TA5.4).
     * Quando {@code tratado} não é informado, retorna apenas os alertas ativos ({@code tratado=false}).
     * Para consultar o log de histórico, informe {@code tratado=true}.
     */
    @GetMapping
    @PreAuthorize("@rbacGuard.temRestricaoModeradaOuSuperior()")
    public ResponseEntity<List<AlertaPedagogicoResponseDTO>> listarAlertas(
            @RequestParam(name = "unidade", required = false) String unidade,
            @RequestParam(name = "curso", required = false) String curso,
            @RequestParam(name = "turma", required = false) String turma,
            @RequestParam(name = "tratado", required = false, defaultValue = "false") Boolean tratado,
            @RequestParam(name = "severidade", required = false) SeveridadeAlerta severidade,
            @RequestParam(name = "alunoId", required = false) UUID alunoId
    ) {
        return ResponseEntity.ok(
                alertaService.listarAlertas(unidade, curso, turma, tratado, severidade, alunoId)
        );
    }

    @GetMapping("/{id}")
    @PreAuthorize("@rbacGuard.temRestricaoModeradaOuSuperior()")
    public ResponseEntity<AlertaPedagogicoResponseDTO> buscarPorId(@PathVariable UUID id) {
        return ResponseEntity.ok(alertaService.buscarPorId(id));
    }

    /**
     * Marca um alerta como "Ciente/Tratado", registrando autor e timestamp e movendo-o
     * do painel ativo para o log de histórico (TA5.4).
     */
    @PatchMapping("/{id}/tratar")
    @PreAuthorize("@rbacGuard.temRestricaoModeradaOuSuperior()")
    public ResponseEntity<AlertaPedagogicoResponseDTO> tratarAlerta(
            @PathVariable UUID id,
            @AuthenticationPrincipal Jwt jwtAutenticado
    ) {
        UUID usuarioId = rbacGuard.exigirUsuarioAutenticadoId(jwtAutenticado);
        return ResponseEntity.ok(alertaService.marcarComoTratado(id, usuarioId));
    }

    /**
     * Executa o motor de análise pedagógica (TA5.1 e TA5.2) a partir de um payload de boletim SUAP.
     */
    @PostMapping("/analisar")
    @PreAuthorize("@rbacGuard.temRestricaoModeradaOuSuperior()")
    public ResponseEntity<List<AlertaPedagogicoResponseDTO>> analisarBoletimSuap(
            @RequestBody SuapBoletimDTO boletim,
            @AuthenticationPrincipal Jwt jwtAutenticado
    ) {
        UUID usuarioId = rbacGuard.exigirUsuarioAutenticadoId(jwtAutenticado);
        List<AlertaPedagogicoResponseDTO> gerados = alertaService.analisarBoletim(boletim, usuarioId);
        return ResponseEntity.status(gerados.isEmpty() ? HttpStatus.OK : HttpStatus.CREATED).body(gerados);
    }

    /**
     * Executa o motor de análise consultando o boletim do estudante no cliente SUAP configurado.
     */
    @PostMapping("/analisar/{alunoId}")
    @PreAuthorize("@rbacGuard.temRestricaoModeradaOuSuperior()")
    public ResponseEntity<List<AlertaPedagogicoResponseDTO>> analisarAlunoViaSuap(
            @PathVariable UUID alunoId,
            @AuthenticationPrincipal Jwt jwtAutenticado
    ) {
        UUID usuarioId = rbacGuard.exigirUsuarioAutenticadoId(jwtAutenticado);
        List<AlertaPedagogicoResponseDTO> gerados = alertaService.analisarAlunoViaSuap(alunoId, usuarioId);
        return ResponseEntity.status(gerados.isEmpty() ? HttpStatus.OK : HttpStatus.CREATED).body(gerados);
    }
}
