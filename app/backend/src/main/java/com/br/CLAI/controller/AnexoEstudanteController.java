package com.br.CLAI.controller;

import com.br.CLAI.domain.enums.TipoClassificacaoAnexo;
import com.br.CLAI.dto.request.AtualizarPermissoesLaudoRequestDTO;
import com.br.CLAI.dto.response.AnexoEstudanteResponseDTO;
import com.br.CLAI.service.AnexoEstudanteService;
import jakarta.validation.Valid;
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
@RequestMapping("/api")
public class AnexoEstudanteController {

    private final AnexoEstudanteService anexoEstudanteService;

    public AnexoEstudanteController(AnexoEstudanteService anexoEstudanteService) {
        this.anexoEstudanteService = anexoEstudanteService;
    }

    @PostMapping(value = "/alunos/{id}/anexos", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<AnexoEstudanteResponseDTO> uploadAnexo(
            @PathVariable("id") UUID id,
            @RequestParam(value = "arquivo", required = false) MultipartFile arquivo,
            @RequestParam(value = "file", required = false) MultipartFile file,
            @RequestParam("classificacao") TipoClassificacaoAnexo classificacao
    ) {
        MultipartFile arquivoRecebido = (arquivo != null) ? arquivo : file;
        AnexoEstudanteResponseDTO response = anexoEstudanteService.uploadAnexo(id, arquivoRecebido, classificacao);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/alunos/{id}/anexos")
    public ResponseEntity<List<AnexoEstudanteResponseDTO>> listarAnexosPorEstudante(
            @PathVariable("id") UUID id,
            @RequestParam(value = "classificacao", required = false) TipoClassificacaoAnexo classificacao,
            @AuthenticationPrincipal Jwt jwtAutenticado
    ) {
        if (classificacao == TipoClassificacaoAnexo.LAUDO_MEDICO) {
            return ResponseEntity.ok(anexoEstudanteService.listarLaudosMedicosPorEstudante(id, jwtAutenticado));
        }
        return ResponseEntity.ok(anexoEstudanteService.listarAnexosPorEstudante(id, jwtAutenticado));
    }

    /**
     * Lista os anexos classificados como LAUDO_MEDICO do estudante filtrados pelo cargo do usuário autenticado.
     * Utilizado pela seção de Laudos Médicos do Estudo de Caso.
     */
    @GetMapping("/alunos/{id}/laudos-medicos")
    public ResponseEntity<List<AnexoEstudanteResponseDTO>> listarLaudosMedicosPorEstudante(
            @PathVariable("id") UUID id,
            @AuthenticationPrincipal Jwt jwtAutenticado
    ) {
        return ResponseEntity.ok(anexoEstudanteService.listarLaudosMedicosPorEstudante(id, jwtAutenticado));
    }

    /**
     * Libera ou revoga dinamicamente os cargos autorizados a visualizar/baixar um LAUDO_MEDICO.
     * Restrito exclusivamente à Coordenação da CLAI (Role.COORDENADOR).
     */
    @PutMapping("/anexos/{anexoId}/permissoes-acesso")
    @PreAuthorize("@rbacGuard.isCoordenador()")
    public ResponseEntity<AnexoEstudanteResponseDTO> atualizarPermissoesLaudo(
            @PathVariable("anexoId") UUID anexoId,
            @Valid @RequestBody AtualizarPermissoesLaudoRequestDTO dto,
            @AuthenticationPrincipal Jwt jwtAutenticado
    ) {
        return ResponseEntity.ok(
                anexoEstudanteService.atualizarPermissoesLaudo(anexoId, dto.rolesPermitidas(), jwtAutenticado)
        );
    }

    @GetMapping("/anexos/{anexoId}/download")
    public ResponseEntity<byte[]> downloadAnexo(
            @PathVariable("anexoId") UUID anexoId,
            @AuthenticationPrincipal Jwt jwtAutenticado
    ) {
        AnexoEstudanteService.AnexoDownloadPayload payload =
                anexoEstudanteService.downloadAnexo(anexoId, jwtAutenticado);

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
}

