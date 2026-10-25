package com.br.CLAI.controller;

import com.br.CLAI.domain.Usuario;
import com.br.CLAI.domain.enums.TipoClassificacaoAnexo;
import com.br.CLAI.dto.response.AnexoEstudanteResponseDTO;
import com.br.CLAI.service.AnexoEstudanteService;
import org.springframework.http.CacheControl;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
public class AnexoEstudanteController {

    private final AnexoEstudanteService anexoEstudanteService;

    public AnexoEstudanteController(AnexoEstudanteService anexoEstudanteService) {
        this.anexoEstudanteService = anexoEstudanteService;
    }

    @PostMapping(value = "/estudantes/{id}/anexos", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
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

    @GetMapping("/estudantes/{id}/anexos")
    public ResponseEntity<List<AnexoEstudanteResponseDTO>> listarAnexosPorEstudante(
            @PathVariable("id") UUID id
    ) {
        return ResponseEntity.ok(anexoEstudanteService.listarAnexosPorEstudante(id));
    }

    @GetMapping("/anexos/{anexoId}/download")
    public ResponseEntity<byte[]> downloadAnexo(
            @PathVariable("anexoId") UUID anexoId,
            @AuthenticationPrincipal Usuario usuarioAutenticado
    ) {
        AnexoEstudanteService.AnexoDownloadPayload payload =
                anexoEstudanteService.downloadAnexo(anexoId, usuarioAutenticado);

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

