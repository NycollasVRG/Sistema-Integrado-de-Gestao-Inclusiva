package com.br.CLAI.controller;

import com.br.CLAI.dto.request.AtaAssinaturasRequestDTO;
import com.br.CLAI.dto.request.AtaReuniaoRequestDTO;
import com.br.CLAI.dto.request.AtaReuniaoUpdateDTO;
import com.br.CLAI.dto.request.TermoAditivoRequestDTO;
import com.br.CLAI.dto.response.AtaCompromissoResponseDTO;
import com.br.CLAI.dto.response.AtaReuniaoResponseDTO;
import com.br.CLAI.dto.response.TermoAditivoResponseDTO;
import com.br.CLAI.security.RbacGuard;
import com.br.CLAI.service.AtaReuniaoService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.CacheControl;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/atas")
public class AtaReuniaoController {

    private final AtaReuniaoService service;
    private final RbacGuard rbacGuard;

    @Autowired
    public AtaReuniaoController(AtaReuniaoService service, RbacGuard rbacGuard) {
        this.service = service;
        this.rbacGuard = rbacGuard;
    }

    public AtaReuniaoController(AtaReuniaoService service) {
        this(service, new RbacGuard());
    }

    @PostMapping
    @PreAuthorize("@rbacGuard.temRestricaoModeradaOuSuperior()")
    public ResponseEntity<AtaReuniaoResponseDTO> criar(
            @Valid @RequestBody AtaReuniaoRequestDTO dto,
            @AuthenticationPrincipal Jwt jwtAutenticado) {

        UUID usuarioId = rbacGuard.exigirUsuarioAutenticadoId(jwtAutenticado);
        return ResponseEntity.status(HttpStatus.CREATED).body(service.criar(dto, usuarioId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<AtaReuniaoResponseDTO> buscarPorId(@PathVariable UUID id) {
        return ResponseEntity.ok(service.buscarPorId(id));
    }

    @GetMapping("/aluno/{alunoId}")
    public ResponseEntity<List<AtaReuniaoResponseDTO>> listarPorAluno(@PathVariable UUID alunoId) {
        return ResponseEntity.ok(service.listarPorAluno(alunoId));
    }

    /**
     * Atualiza uma ata em RASCUNHO. Bloqueado com HTTP 409 (RFC 9457) quando status == FINALIZADA (TA8.4).
     */
    @PutMapping("/{id}")
    @PreAuthorize("@rbacGuard.temRestricaoModeradaOuSuperior()")
    public ResponseEntity<AtaReuniaoResponseDTO> atualizar(
            @PathVariable UUID id,
            @Valid @RequestBody AtaReuniaoUpdateDTO dto,
            @AuthenticationPrincipal Jwt jwtAutenticado) {

        UUID usuarioId = rbacGuard.exigirUsuarioAutenticadoId(jwtAutenticado);
        return ResponseEntity.ok(service.atualizar(id, dto, usuarioId));
    }

    /**
     * Upload do documento físico assinado da ata, cifrado via CryptoStorageService (TA8.1).
     */
    @PostMapping(value = "/{id}/documento-assinado", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("@rbacGuard.temRestricaoModeradaOuSuperior()")
    public ResponseEntity<AtaReuniaoResponseDTO> uploadDocumentoAssinado(
            @PathVariable UUID id,
            @RequestParam(value = "arquivo", required = false) MultipartFile arquivo,
            @RequestParam(value = "file", required = false) MultipartFile file,
            @AuthenticationPrincipal Jwt jwtAutenticado) {

        UUID usuarioId = rbacGuard.exigirUsuarioAutenticadoId(jwtAutenticado);
        MultipartFile recebido = arquivo != null ? arquivo : file;
        return ResponseEntity.ok(service.anexarDocumentoAssinado(id, recebido, usuarioId));
    }

    /**
     * Download do documento assinado da ata (descriptografado em memória).
     */
    @GetMapping("/{id}/documento-assinado")
    public ResponseEntity<byte[]> downloadDocumentoAssinado(@PathVariable UUID id) {
        AtaReuniaoService.DocumentoDownloadPayload payload = service.baixarDocumentoAssinado(id);

        MediaType mediaType;
        try {
            mediaType = MediaType.parseMediaType(payload.contentType());
        } catch (Exception ex) {
            mediaType = MediaType.APPLICATION_OCTET_STREAM;
        }

        ContentDisposition contentDisposition = ContentDisposition.attachment()
                .filename(payload.nomeOriginal(), StandardCharsets.UTF_8)
                .build();

        return ResponseEntity.ok()
                .contentType(mediaType)
                .contentLength(payload.conteudo().length)
                .cacheControl(CacheControl.noStore().mustRevalidate())
                .header(HttpHeaders.CONTENT_DISPOSITION, contentDisposition.toString())
                .body(payload.conteudo());
    }

    /**
     * Coleta e registra assinaturas digitais auditáveis dos participantes presentes na reunião (TA8.1).
     */
    @PostMapping("/{id}/assinaturas")
    @PreAuthorize("@rbacGuard.temRestricaoModeradaOuSuperior()")
    public ResponseEntity<AtaReuniaoResponseDTO> registrarAssinaturas(
            @PathVariable UUID id,
            @Valid @RequestBody AtaAssinaturasRequestDTO dto,
            @AuthenticationPrincipal Jwt jwtAutenticado,
            HttpServletRequest request) {

        UUID usuarioId = rbacGuard.exigirUsuarioAutenticadoId(jwtAutenticado);
        String ipOrigem = extrairIpOrigem(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(service.registrarAssinaturas(id, dto, usuarioId, ipOrigem));
    }

    /**
     * Finaliza a ata, tornando-a imutável (TA8.1 / TA8.4).
     */
    @PostMapping("/{id}/finalizar")
    @PreAuthorize("@rbacGuard.temRestricaoModeradaOuSuperior()")
    public ResponseEntity<AtaReuniaoResponseDTO> finalizar(
            @PathVariable UUID id,
            @AuthenticationPrincipal Jwt jwtAutenticado) {

        UUID usuarioId = rbacGuard.exigirUsuarioAutenticadoId(jwtAutenticado);
        return ResponseEntity.ok(service.finalizar(id, usuarioId));
    }

    /**
     * Emite um Termo Aditivo explicativo para uma ata FINALIZADA (TA8.4).
     */
    @PostMapping("/{id}/termos-aditivos")
    @PreAuthorize("@rbacGuard.temRestricaoModeradaOuSuperior()")
    public ResponseEntity<TermoAditivoResponseDTO> adicionarTermoAditivo(
            @PathVariable UUID id,
            @Valid @RequestBody TermoAditivoRequestDTO dto,
            @AuthenticationPrincipal Jwt jwtAutenticado) {

        UUID usuarioId = rbacGuard.exigirUsuarioAutenticadoId(jwtAutenticado);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(service.adicionarTermoAditivo(id, dto, usuarioId));
    }

    @GetMapping("/{id}/termos-aditivos")
    public ResponseEntity<List<TermoAditivoResponseDTO>> listarTermosAditivos(@PathVariable UUID id) {
        return ResponseEntity.ok(service.listarTermosAditivos(id));
    }

    /**
     * Marca um compromisso acordado na ata como CONCLUIDO (permitido inclusive em atas FINALIZADAS).
     */
    @PatchMapping("/{id}/compromissos/{compromissoId}/concluir")
    @PreAuthorize("@rbacGuard.temRestricaoModeradaOuSuperior()")
    public ResponseEntity<AtaCompromissoResponseDTO> concluirCompromisso(
            @PathVariable UUID id,
            @PathVariable UUID compromissoId,
            @AuthenticationPrincipal Jwt jwtAutenticado) {

        UUID usuarioId = rbacGuard.exigirUsuarioAutenticadoId(jwtAutenticado);
        return ResponseEntity.ok(service.concluirCompromisso(id, compromissoId, usuarioId));
    }

    private String extrairIpOrigem(HttpServletRequest request) {
        if (request == null) {
            return null;
        }
        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (forwardedFor != null && !forwardedFor.isBlank()) {
            int virgula = forwardedFor.indexOf(',');
            return virgula >= 0 ? forwardedFor.substring(0, virgula).trim() : forwardedFor.trim();
        }
        return request.getRemoteAddr();
    }
}
