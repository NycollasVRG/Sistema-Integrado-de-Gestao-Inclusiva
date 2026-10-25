package com.br.CLAI.controller;

import com.br.CLAI.domain.enums.TipoClassificacaoAnexo;
import com.br.CLAI.dto.response.AnexoEstudanteResponseDTO;
import com.br.CLAI.service.AnexoEstudanteService;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

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
}
