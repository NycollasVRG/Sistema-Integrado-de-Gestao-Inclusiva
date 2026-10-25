package com.br.CLAI.service;

import com.br.CLAI.domain.Aluno;
import com.br.CLAI.domain.AnexoEstudante;
import com.br.CLAI.domain.enums.TipoClassificacaoAnexo;
import com.br.CLAI.dto.response.AnexoEstudanteResponseDTO;
import com.br.CLAI.exception.NaoEncontradoException;
import com.br.CLAI.exception.RegraDeNegocioException;
import com.br.CLAI.repository.AlunoRepository;
import com.br.CLAI.repository.AnexoEstudanteRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

@Service
public class AnexoEstudanteService {

    private final AnexoEstudanteRepository anexoEstudanteRepository;
    private final AlunoRepository alunoRepository;
    private final CryptoStorageService cryptoStorageService;

    public AnexoEstudanteService(
            AnexoEstudanteRepository anexoEstudanteRepository,
            AlunoRepository alunoRepository,
            CryptoStorageService cryptoStorageService
    ) {
        this.anexoEstudanteRepository = anexoEstudanteRepository;
        this.alunoRepository = alunoRepository;
        this.cryptoStorageService = cryptoStorageService;
    }

    /**
     * Realiza o upload de um anexo do estudante aplicando criptografia AES-256-GCM em repouso
     * obrigatoriamente para documentos médicos sensíveis (TA11.1 - LGPD).
     */
    @Transactional
    public AnexoEstudanteResponseDTO uploadAnexo(
            UUID estudanteId,
            MultipartFile arquivo,
            TipoClassificacaoAnexo classificacao
    ) {
        if (arquivo == null || arquivo.isEmpty()) {
            throw new RegraDeNegocioException("O arquivo enviado não pode ser nulo ou vazio.");
        }
        if (classificacao == null) {
            throw new RegraDeNegocioException("A classificação do anexo (LAUDO_MEDICO, DIAGNOSTICO_NEUROPSICOLOGICO ou DOCUMENTO_PEDAGOGICO) é obrigatória.");
        }

        Aluno aluno = alunoRepository.findById(estudanteId)
                .orElseThrow(() -> new NaoEncontradoException("Estudante não encontrado com o ID: " + estudanteId));

        byte[] bytesOriginais;
        try {
            bytesOriginais = arquivo.getBytes();
        } catch (IOException ex) {
            throw new RegraDeNegocioException("Falha ao ler os bytes do arquivo enviado.");
        }

        String nomeOriginal = sanitizarNomeArquivo(arquivo.getOriginalFilename());
        String contentType = (arquivo.getContentType() != null && !arquivo.getContentType().isBlank())
                ? arquivo.getContentType()
                : "application/octet-stream";

        boolean deveCriptografar = classificacao.isSensivel();
        String sufixoExtensao = deveCriptografar ? ".enc" : "";
        String caminhoRelativo = aluno.getId() + "/" + UUID.randomUUID() + "_" + nomeOriginal + sufixoExtensao;

        String caminhoSalvo;
        String ivBase64 = null;

        if (deveCriptografar) {
            CryptoStorageService.EncryptedPayload payloadCifrado = cryptoStorageService.encrypt(bytesOriginais);
            caminhoSalvo = cryptoStorageService.salvarNoVolume(caminhoRelativo, payloadCifrado.ciphertext());
            ivBase64 = payloadCifrado.ivBase64();
        } else {
            caminhoSalvo = cryptoStorageService.salvarNoVolume(caminhoRelativo, bytesOriginais);
        }

        AnexoEstudante anexo = new AnexoEstudante(
                aluno,
                nomeOriginal,
                contentType,
                arquivo.getSize(),
                classificacao,
                deveCriptografar,
                caminhoSalvo,
                ivBase64
        );

        AnexoEstudante salvo = anexoEstudanteRepository.save(anexo);
        return AnexoEstudanteResponseDTO.fromEntity(salvo);
    }

    @Transactional(readOnly = true)
    public List<AnexoEstudanteResponseDTO> listarAnexosPorEstudante(UUID estudanteId) {
        if (!alunoRepository.existsById(estudanteId)) {
            throw new NaoEncontradoException("Estudante não encontrado com o ID: " + estudanteId);
        }
        return anexoEstudanteRepository.findByAlunoIdOrderByCriadoEmDesc(estudanteId)
                .stream()
                .map(AnexoEstudanteResponseDTO::fromEntity)
                .toList();
    }

    private String sanitizarNomeArquivo(String nomeBruto) {
        if (nomeBruto == null || nomeBruto.isBlank()) {
            return "documento.pdf";
        }
        String apenasNome = nomeBruto.replace('\\', '/');
        int ultimaBarra = apenasNome.lastIndexOf('/');
        if (ultimaBarra >= 0) {
            apenasNome = apenasNome.substring(ultimaBarra + 1);
        }
        String limpo = apenasNome.replaceAll("[^a-zA-Z0-9._-]", "_");
        return limpo.isBlank() ? "documento.pdf" : limpo;
    }
}
