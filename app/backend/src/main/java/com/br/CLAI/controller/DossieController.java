package com.br.CLAI.controller;

import com.br.CLAI.domain.enums.EscopoDossie;
import com.br.CLAI.dto.response.DossieJuridicoResponseDTO;
import com.br.CLAI.exception.RegraDeNegocioException;
import com.br.CLAI.security.RbacGuard;
import com.br.CLAI.service.DossieService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.CacheControl;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.nio.charset.StandardCharsets;
import java.util.Locale;
import java.util.UUID;

/**
 * Controller de exportação de Dossiês Jurídicos de defesa institucional (US 06 - MPF/BDL).
 * <p>
 * Expõe exclusivamente rota de leitura/exportação ({@code GET /api/alunos/{id}/dossie/exportar}),
 * sem nenhuma rota de alteração ({@code PUT}/{@code PATCH}) ou exclusão ({@code DELETE}) de logs
 * de auditoria, em conformidade estrita com o TA6.3.
 */
@RestController
@RequestMapping("/api/alunos")
public class DossieController {

    private final DossieService dossieService;
    private final RbacGuard rbacGuard;

    @Autowired
    public DossieController(DossieService dossieService, RbacGuard rbacGuard) {
        this.dossieService = dossieService;
        this.rbacGuard = rbacGuard != null ? rbacGuard : new RbacGuard();
    }

    public DossieController(DossieService dossieService) {
        this(dossieService, new RbacGuard());
    }

    /**
     * Compila e exporta o Dossiê Jurídico do estudante em arquivo JSON estruturado (TA6.2).
     * Quando {@code escopo=EXTERNO}, omite automaticamente laudos médicos e registros clínicos
     * de nível {@code SUPER_RESTRICAO} (TA6.4).
     */
    @GetMapping("/{id}/dossie/exportar")
    @PreAuthorize("@rbacGuard.temRestricaoModeradaOuSuperior()")
    public ResponseEntity<DossieJuridicoResponseDTO> exportarDossie(
            @PathVariable("id") UUID id,
            @RequestParam(name = "escopo", defaultValue = "INTERNO") String escopoParam,
            @AuthenticationPrincipal Jwt jwtAutenticado
    ) {
        EscopoDossie escopo = resolverEscopo(escopoParam);
        UUID usuarioId = rbacGuard.exigirUsuarioAutenticadoId(jwtAutenticado);

        DossieJuridicoResponseDTO dossie = dossieService.exportarDossie(id, escopo, usuarioId);

        String matriculaLimpa = dossie.matricula() != null
                ? dossie.matricula().replaceAll("[^a-zA-Z0-9_-]", "_")
                : id.toString();
        String nomeArquivo = "dossie_" + matriculaLimpa + "_" + escopo.name().toLowerCase(Locale.ROOT) + ".json";

        ContentDisposition contentDisposition = ContentDisposition.attachment()
                .filename(nomeArquivo, StandardCharsets.UTF_8)
                .build();

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_JSON)
                .cacheControl(CacheControl.noStore().mustRevalidate())
                .header(HttpHeaders.CONTENT_DISPOSITION, contentDisposition.toString())
                .body(dossie);
    }

    private EscopoDossie resolverEscopo(String escopoParam) {
        if (escopoParam == null || escopoParam.isBlank()) {
            return EscopoDossie.INTERNO;
        }
        try {
            return EscopoDossie.valueOf(escopoParam.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException ex) {
            throw new RegraDeNegocioException(
                    "Escopo de exportação inválido: '" + escopoParam + "'. Valores permitidos: INTERNO ou EXTERNO."
            );
        }
    }
}
