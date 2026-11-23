package com.br.CLAI.controller;

import com.br.CLAI.domain.AuditLog;
import com.br.CLAI.dto.response.AuditLogResponseDTO;
import com.br.CLAI.dto.response.AuditoriaListaResponseDTO;
import com.br.CLAI.repository.AuditLogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

/**
 * Consulta somente-leitura da trilha de auditoria para o painel administrativo (US 06).
 * <p>
 * Expõe exclusivamente {@code GET /api/admin/auditoria}. Não existe rota de alteração
 * ({@code POST}/{@code PUT}/{@code PATCH}/{@code DELETE}) para {@code sigi.audit_log} (TA6.3).
 */
@RestController
@RequestMapping("/api/admin/auditoria")
@PreAuthorize("hasRole('ADMIN')")
public class AuditoriaController {

    private static final int TAMANHO_PADRAO = 50;
    private static final int TAMANHO_MAXIMO = 200;

    private final AuditLogRepository auditLogRepository;

    @Autowired
    public AuditoriaController(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    /** Lista os registros mais recentes, com filtros opcionais e paginação simples. */
    @GetMapping
    public ResponseEntity<AuditoriaListaResponseDTO> listar(
            @RequestParam(name = "pagina", defaultValue = "0") int pagina,
            @RequestParam(name = "tamanho", defaultValue = "50") int tamanho,
            @RequestParam(name = "acao", required = false) String acao,
            @RequestParam(name = "entidade", required = false) String entidade,
            @RequestParam(name = "usuarioId", required = false) UUID usuarioId
    ) {
        int paginaSegura = Math.max(pagina, 0);
        int tamanhoSeguro = Math.min(Math.max(tamanho, 1), TAMANHO_MAXIMO);
        String acaoFiltro = acao == null ? null : acao.trim().toLowerCase();
        String entidadeFiltro = entidade == null ? null : entidade.trim().toLowerCase();

        List<AuditLog> filtrados = auditLogRepository.findAllByOrderByTimestampDesc().stream()
                .filter(log -> acaoFiltro == null || acaoFiltro.isEmpty()
                        || (log.getAcao() != null && log.getAcao().toLowerCase().contains(acaoFiltro)))
                .filter(log -> entidadeFiltro == null || entidadeFiltro.isEmpty()
                        || (log.getEntidade() != null && log.getEntidade().toLowerCase().contains(entidadeFiltro)))
                .filter(log -> usuarioId == null || usuarioId.equals(log.getUsuarioId()))
                .toList();

        long totalElementos = filtrados.size();
        int inicio = Math.min(paginaSegura * tamanhoSeguro, filtrados.size());
        int fim = Math.min(inicio + tamanhoSeguro, filtrados.size());
        int totalPaginas = totalElementos == 0
                ? 0
                : (int) Math.ceil((double) totalElementos / tamanhoSeguro);

        List<AuditLogResponseDTO> logs = filtrados.subList(inicio, fim).stream()
                .map(AuditLogResponseDTO::fromEntity)
                .toList();

        return ResponseEntity.ok(new AuditoriaListaResponseDTO(
                logs, paginaSegura, tamanhoSeguro, totalElementos, totalPaginas
        ));
    }
}
