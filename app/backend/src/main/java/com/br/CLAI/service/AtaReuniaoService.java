package com.br.CLAI.service;

import com.br.CLAI.domain.Aluno;
import com.br.CLAI.domain.AtaAssinatura;
import com.br.CLAI.domain.AtaCompromisso;
import com.br.CLAI.domain.AtaReuniao;
import com.br.CLAI.domain.AtaTermoAditivo;
import com.br.CLAI.domain.Usuario;
import com.br.CLAI.domain.enums.StatusAta;
import com.br.CLAI.domain.enums.StatusCompromisso;
import com.br.CLAI.dto.request.AtaAssinaturaRequestDTO;
import com.br.CLAI.dto.request.AtaAssinaturasRequestDTO;
import com.br.CLAI.dto.request.AtaCompromissoRequestDTO;
import com.br.CLAI.dto.request.AtaReuniaoRequestDTO;
import com.br.CLAI.dto.request.AtaReuniaoUpdateDTO;
import com.br.CLAI.dto.request.TermoAditivoRequestDTO;
import com.br.CLAI.dto.response.AtaCompromissoResponseDTO;
import com.br.CLAI.dto.response.AtaReuniaoResponseDTO;
import com.br.CLAI.dto.response.TermoAditivoResponseDTO;
import com.br.CLAI.exception.AtaFinalizadaException;
import com.br.CLAI.exception.NaoEncontradoException;
import com.br.CLAI.exception.RegraDeNegocioException;
import com.br.CLAI.repository.AlunoRepository;
import com.br.CLAI.repository.AtaReuniaoRepository;
import com.br.CLAI.repository.UsuarioRepository;
import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Clock;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.HexFormat;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

@Service
public class AtaReuniaoService {

    public record DocumentoDownloadPayload(
            String nomeOriginal,
            String contentType,
            byte[] conteudo
    ) {
    }

    private static final Set<String> CONTENT_TYPES_PERMITIDOS = Set.of(
            "application/pdf",
            "image/png",
            "image/jpeg",
            "image/jpg"
    );

    private static final String MSG_ATA_NAO_ENCONTRADA = "Ata de reunião não encontrada com o ID fornecido.";

    private final AtaReuniaoRepository ataReuniaoRepository;
    private final AlunoRepository alunoRepository;
    private final UsuarioRepository usuarioRepository;
    private final CryptoStorageService cryptoStorageService;
    private final Clock clock;

    public AtaReuniaoService(
            AtaReuniaoRepository ataReuniaoRepository,
            AlunoRepository alunoRepository,
            UsuarioRepository usuarioRepository,
            CryptoStorageService cryptoStorageService,
            Clock clock) {
        this.ataReuniaoRepository = ataReuniaoRepository;
        this.alunoRepository = alunoRepository;
        this.usuarioRepository = usuarioRepository;
        this.cryptoStorageService = cryptoStorageService;
        this.clock = clock;
    }

    @Transactional
    public AtaReuniaoResponseDTO criar(AtaReuniaoRequestDTO dto, UUID usuarioId) {
        validarUsuarioAutenticado(usuarioId);

        Aluno aluno = alunoRepository.findById(dto.alunoId())
                .orElseThrow(() -> new NaoEncontradoException("Estudante não encontrado."));

        AtaReuniao ata = new AtaReuniao(
                aluno,
                dto.tipoReuniao(),
                dto.dataReuniao(),
                normalizarOpcional(dto.localReuniao()),
                dto.pauta().trim(),
                normalizarOpcional(dto.deliberacoes())
        );
        ata.setStatus(StatusAta.RASCUNHO);
        ata.setCriadoPor(usuarioId);
        ata.setAtualizadoPor(usuarioId);

        adicionarCompromissos(ata, dto.compromissos(), usuarioId);

        AtaReuniao salva = ataReuniaoRepository.save(ata);
        return AtaReuniaoResponseDTO.fromEntity(salva);
    }

    @Transactional(readOnly = true)
    public AtaReuniaoResponseDTO buscarPorId(UUID id) {
        AtaReuniao ata = buscarEntidadePorId(id);
        return AtaReuniaoResponseDTO.fromEntity(ata);
    }

    @Transactional(readOnly = true)
    public List<AtaReuniaoResponseDTO> listarPorAluno(UUID alunoId) {
        return OrdenacaoAuditoria.ordenarPorCriacaoDesc(ataReuniaoRepository.findByAlunoId(alunoId))
                .stream()
                .map(AtaReuniaoResponseDTO::fromEntity)
                .toList();
    }

    /**
     * Atualiza uma ata em RASCUNHO. Caso a ata já esteja FINALIZADA, lança {@link AtaFinalizadaException}
     * (HTTP 409 RFC 9457), exigindo emissão de Termo Aditivo (TA8.4).
     */
    @Transactional
    public AtaReuniaoResponseDTO atualizar(UUID id, AtaReuniaoUpdateDTO dto, UUID usuarioId) {
        validarUsuarioAutenticado(usuarioId);

        AtaReuniao ata = buscarEntidadePorId(id);
        exigirAtaEmRascunho(ata);

        ata.setTipoReuniao(dto.tipoReuniao());
        ata.setDataReuniao(dto.dataReuniao());
        ata.setLocalReuniao(normalizarOpcional(dto.localReuniao()));
        ata.setPauta(dto.pauta().trim());
        ata.setDeliberacoes(normalizarOpcional(dto.deliberacoes()));
        ata.setAtualizadoPor(usuarioId);

        ata.getCompromissos().clear();
        adicionarCompromissos(ata, dto.compromissos(), usuarioId);

        AtaReuniao salva = ataReuniaoRepository.save(ata);
        return AtaReuniaoResponseDTO.fromEntity(salva);
    }

    /**
     * Realiza o upload do documento assinado da ata, cifrando-o obrigatoriamente com AES-256-GCM
     * em repouso via {@link CryptoStorageService} (TA8.1).
     */
    @Transactional
    public AtaReuniaoResponseDTO anexarDocumentoAssinado(UUID id, MultipartFile arquivo, UUID usuarioId) {
        validarUsuarioAutenticado(usuarioId);

        if (arquivo == null || arquivo.isEmpty()) {
            throw new RegraDeNegocioException("O arquivo do documento assinado não pode ser nulo ou vazio.");
        }

        AtaReuniao ata = buscarEntidadePorId(id);
        exigirAtaEmRascunho(ata);

        String contentType = resolverEValidarContentType(arquivo);
        byte[] bytesOriginais;
        try {
            bytesOriginais = arquivo.getBytes();
        } catch (IOException ex) {
            throw new RegraDeNegocioException("Falha ao ler os bytes do documento assinado enviado.");
        }

        String nomeOriginal = sanitizarNomeArquivo(arquivo.getOriginalFilename());
        String caminhoRelativo = "atas/" + ata.getAluno().getId() + "/" + UUID.randomUUID() + "_" + nomeOriginal + ".enc";

        CryptoStorageService.EncryptedPayload payloadCifrado = cryptoStorageService.encrypt(bytesOriginais);
        String caminhoSalvo = cryptoStorageService.salvarNoVolume(caminhoRelativo, payloadCifrado.ciphertext());

        ata.setDocumentoNomeOriginal(nomeOriginal);
        ata.setDocumentoContentType(contentType);
        ata.setDocumentoTamanhoBytes(arquivo.getSize());
        ata.setDocumentoCaminho(caminhoSalvo);
        ata.setDocumentoIv(payloadCifrado.ivBase64());
        ata.setAtualizadoPor(usuarioId);

        AtaReuniao salva = ataReuniaoRepository.save(ata);
        return AtaReuniaoResponseDTO.fromEntity(salva);
    }

    @Transactional(readOnly = true)
    public DocumentoDownloadPayload baixarDocumentoAssinado(UUID id) {
        AtaReuniao ata = buscarEntidadePorId(id);
        if (!ata.possuiDocumentoAssinado()) {
            throw new NaoEncontradoException("Nenhum documento assinado foi anexado a esta ata.");
        }

        byte[] bytesCifrados = cryptoStorageService.lerDoVolume(ata.getDocumentoCaminho());
        byte[] bytesDecifrados = cryptoStorageService.decrypt(bytesCifrados, ata.getDocumentoIv());

        return new DocumentoDownloadPayload(
                ata.getDocumentoNomeOriginal(),
                ata.getDocumentoContentType(),
                bytesDecifrados
        );
    }

    /**
     * Registra assinaturas digitais auditáveis dos participantes presentes na reunião (TA8.1).
     */
    @Transactional
    public AtaReuniaoResponseDTO registrarAssinaturas(
            UUID id,
            AtaAssinaturasRequestDTO dto,
            UUID usuarioId,
            String ipOrigem) {
        validarUsuarioAutenticado(usuarioId);

        if (dto == null || dto.assinaturas() == null || dto.assinaturas().isEmpty()) {
            throw new RegraDeNegocioException("Informe ao menos uma assinatura digital de participante.");
        }

        AtaReuniao ata = buscarEntidadePorId(id);
        exigirAtaEmRascunho(ata);

        String hashAtual = calcularHashConteudo(ata);
        LocalDateTime agora = LocalDateTime.now(clock);
        String ipSanitizado = sanitizarIp(ipOrigem);

        for (AtaAssinaturaRequestDTO item : dto.assinaturas()) {
            Usuario usuarioParticipante = null;
            if (item.usuarioId() != null) {
                usuarioParticipante = usuarioRepository.findById(item.usuarioId())
                        .orElseThrow(() -> new RegraDeNegocioException(
                                "Usuário participante não encontrado com o ID: " + item.usuarioId()));
                if (!Boolean.TRUE.equals(usuarioParticipante.getAcessoAtivo())) {
                    throw new RegraDeNegocioException(
                            "O usuário participante '" + usuarioParticipante.getNome() + "' encontra-se desativado.");
                }
            }

            AtaAssinatura assinatura = new AtaAssinatura(
                    ata,
                    item.nomeParticipante().trim(),
                    item.papelParticipante().trim(),
                    usuarioParticipante,
                    agora,
                    ipSanitizado,
                    hashAtual
            );
            assinatura.setCriadoPor(usuarioId);
            assinatura.setAtualizadoPor(usuarioId);
            ata.adicionarAssinatura(assinatura);
        }

        ata.setAtualizadoPor(usuarioId);
        AtaReuniao salva = ataReuniaoRepository.save(ata);
        return AtaReuniaoResponseDTO.fromEntity(salva);
    }

    /**
     * Finaliza a ata, tornando-a imutável (TA8.1 / TA8.4).
     * Exige ao menos um documento assinado anexado ou ao menos uma assinatura digital consistente
     * com o conteúdo atual da ata.
     */
    @Transactional
    public AtaReuniaoResponseDTO finalizar(UUID id, UUID usuarioId) {
        validarUsuarioAutenticado(usuarioId);

        AtaReuniao ata = buscarEntidadePorId(id);
        if (ata.isFinalizada()) {
            throw new AtaFinalizadaException(ata.getId(), "Esta ata já se encontra finalizada.");
        }

        boolean possuiDocumento = ata.possuiDocumentoAssinado();
        boolean possuiAssinaturas = ata.getAssinaturas() != null && !ata.getAssinaturas().isEmpty();

        if (!possuiDocumento && !possuiAssinaturas) {
            throw new RegraDeNegocioException(
                    "Para finalizar a ata é necessário anexar o documento assinado ou registrar ao menos uma assinatura digital."
            );
        }

        if (possuiAssinaturas) {
            String hashAtual = calcularHashConteudo(ata);
            boolean algumaDivergente = ata.getAssinaturas().stream()
                    .anyMatch(a -> !hashAtual.equals(a.getHashConteudo()));
            if (algumaDivergente) {
                throw new RegraDeNegocioException(
                        "O conteúdo da ata foi alterado após a coleta das assinaturas digitais. "
                                + "Colete novas assinaturas para o conteúdo atual antes de finalizar."
                );
            }
        }

        ata.setStatus(StatusAta.FINALIZADA);
        ata.setFinalizadaEm(LocalDateTime.now(clock));
        ata.setFinalizadaPor(usuarioId);
        ata.setAtualizadoPor(usuarioId);

        AtaReuniao salva = ataReuniaoRepository.save(ata);
        return AtaReuniaoResponseDTO.fromEntity(salva);
    }

    /**
     * Emite um Termo Aditivo explicativo vinculado a uma ata FINALIZADA (TA8.4).
     */
    @Transactional
    public TermoAditivoResponseDTO adicionarTermoAditivo(UUID id, TermoAditivoRequestDTO dto, UUID usuarioId) {
        validarUsuarioAutenticado(usuarioId);

        if (dto == null || dto.texto() == null || dto.texto().isBlank()) {
            throw new RegraDeNegocioException("O texto explicativo do termo aditivo é obrigatório.");
        }

        AtaReuniao ata = buscarEntidadePorId(id);
        if (!ata.isFinalizada()) {
            throw new RegraDeNegocioException(
                    "Termos aditivos só podem ser emitidos para atas FINALIZADAS. "
                            + "Para atas em rascunho, utilize a edição direta (PUT /api/atas/" + id + ")."
            );
        }

        AtaTermoAditivo termo = new AtaTermoAditivo(ata, dto.texto().trim());
        termo.setCriadoPor(usuarioId);
        termo.setAtualizadoPor(usuarioId);
        ata.adicionarTermoAditivo(termo);
        ata.setAtualizadoPor(usuarioId);

        AtaReuniao salva = ataReuniaoRepository.save(ata);
        AtaTermoAditivo salvo = salva.getTermosAditivos().getLast();
        return TermoAditivoResponseDTO.fromEntity(salvo);
    }

    @Transactional(readOnly = true)
    public List<TermoAditivoResponseDTO> listarTermosAditivos(UUID id) {
        AtaReuniao ata = buscarEntidadePorId(id);
        return ata.getTermosAditivos().stream()
                .sorted(Comparator.comparing(
                        AtaTermoAditivo::getCriadoEm,
                        Comparator.nullsLast(Comparator.naturalOrder())))
                .map(TermoAditivoResponseDTO::fromEntity)
                .toList();
    }

    /**
     * Marca um compromisso acordado em ata como CONCLUIDO (permitido inclusive em atas FINALIZADAS,
     * pois representa o acompanhamento da execução sem alterar o conteúdo da ata).
     */
    @Transactional
    public AtaCompromissoResponseDTO concluirCompromisso(UUID ataId, UUID compromissoId, UUID usuarioId) {
        validarUsuarioAutenticado(usuarioId);

        AtaReuniao ata = buscarEntidadePorId(ataId);
        AtaCompromisso compromisso = ata.getCompromissos().stream()
                .filter(c -> compromissoId.equals(c.getId()))
                .findFirst()
                .orElseThrow(() -> new NaoEncontradoException(
                        "Compromisso não encontrado na ata informada com o ID: " + compromissoId));

        compromisso.setStatus(StatusCompromisso.CONCLUIDO);
        compromisso.setAtualizadoPor(usuarioId);

        ataReuniaoRepository.save(ata);
        return AtaCompromissoResponseDTO.fromEntity(compromisso);
    }

    /**
     * Calcula hash SHA-256 determinístico do conteúdo normativo da ata (pauta, deliberações,
     * tipo, data, local e compromissos) para garantir integridade das assinaturas digitais.
     */
    public String calcularHashConteudo(AtaReuniao ata) {
        StringBuilder sb = new StringBuilder();
        sb.append("tipo=").append(ata.getTipoReuniao() != null ? ata.getTipoReuniao().name() : "").append('\n');
        sb.append("data=").append(ata.getDataReuniao() != null ? ata.getDataReuniao() : "").append('\n');
        sb.append("local=").append(ata.getLocalReuniao() != null ? ata.getLocalReuniao() : "").append('\n');
        sb.append("pauta=").append(ata.getPauta() != null ? ata.getPauta() : "").append('\n');
        sb.append("deliberacoes=").append(ata.getDeliberacoes() != null ? ata.getDeliberacoes() : "").append('\n');

        if (ata.getCompromissos() != null) {
            ata.getCompromissos().stream()
                    .sorted(Comparator
                            .comparing((AtaCompromisso c) -> c.getPrazo(), Comparator.nullsLast(Comparator.naturalOrder()))
                            .thenComparing(c -> c.getResponsavel() != null && c.getResponsavel().getId() != null
                                    ? c.getResponsavel().getId().toString() : "")
                            .thenComparing(c -> c.getDescricao() != null ? c.getDescricao() : ""))
                    .forEach(c -> sb.append("compromisso=")
                            .append(c.getPrazo()).append('|')
                            .append(c.getResponsavel() != null ? c.getResponsavel().getId() : "").append('|')
                            .append(c.getDescricao() != null ? c.getDescricao() : "").append('\n'));
        }

        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(sb.toString().getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("Algoritmo SHA-256 indisponível na JVM.", ex);
        }
    }

    private AtaReuniao buscarEntidadePorId(UUID id) {
        return ataReuniaoRepository.findById(id)
                .orElseThrow(() -> new NaoEncontradoException(MSG_ATA_NAO_ENCONTRADA));
    }

    private void exigirAtaEmRascunho(AtaReuniao ata) {
        if (ata.isFinalizada()) {
            throw new AtaFinalizadaException(ata.getId());
        }
    }

    private void adicionarCompromissos(AtaReuniao ata, List<AtaCompromissoRequestDTO> compromissosDto, UUID usuarioId) {
        if (compromissosDto == null || compromissosDto.isEmpty()) {
            return;
        }
        for (AtaCompromissoRequestDTO item : compromissosDto) {
            Usuario responsavel = usuarioRepository.findById(item.responsavelId())
                    .orElseThrow(() -> new RegraDeNegocioException(
                            "Usuário responsável pelo compromisso não encontrado com o ID: " + item.responsavelId()));
            if (!Boolean.TRUE.equals(responsavel.getAcessoAtivo())) {
                throw new RegraDeNegocioException(
                        "O usuário responsável '" + responsavel.getNome() + "' encontra-se desativado.");
            }
            AtaCompromisso compromisso = new AtaCompromisso(
                    ata,
                    item.descricao().trim(),
                    responsavel,
                    item.prazo()
            );
            compromisso.setCriadoPor(usuarioId);
            compromisso.setAtualizadoPor(usuarioId);
            ata.adicionarCompromisso(compromisso);
        }
    }

    private String resolverEValidarContentType(MultipartFile arquivo) {
        String contentType = arquivo.getContentType();
        if (contentType != null && !contentType.isBlank()) {
            String normalizado = contentType.trim().toLowerCase(Locale.ROOT);
            int pontoVirgula = normalizado.indexOf(';');
            if (pontoVirgula >= 0) {
                normalizado = normalizado.substring(0, pontoVirgula).trim();
            }
            if (CONTENT_TYPES_PERMITIDOS.contains(normalizado)) {
                return "image/jpg".equals(normalizado) ? "image/jpeg" : normalizado;
            }
        }
        throw new RegraDeNegocioException(
                "Tipo de arquivo não permitido para documento assinado da ata. Envie um arquivo PDF, PNG ou JPEG."
        );
    }

    private String sanitizarNomeArquivo(String nomeBruto) {
        if (nomeBruto == null || nomeBruto.isBlank()) {
            return "ata_assinada.pdf";
        }
        String apenasNome = nomeBruto.replace('\\', '/');
        int ultimaBarra = apenasNome.lastIndexOf('/');
        if (ultimaBarra >= 0) {
            apenasNome = apenasNome.substring(ultimaBarra + 1);
        }
        String limpo = apenasNome.replaceAll("[^a-zA-Z0-9._-]", "_");
        return limpo.isBlank() ? "ata_assinada.pdf" : limpo;
    }

    private String sanitizarIp(String ipOrigem) {
        if (ipOrigem == null || ipOrigem.isBlank()) {
            return null;
        }
        String trimmed = ipOrigem.trim();
        return trimmed.length() > 64 ? trimmed.substring(0, 64) : trimmed;
    }

    private String normalizarOpcional(String valor) {
        if (valor == null || valor.isBlank()) {
            return null;
        }
        return valor.trim();
    }

    private void validarUsuarioAutenticado(UUID usuarioId) {
        if (usuarioId == null) {
            throw new AuthenticationCredentialsNotFoundException(
                    "Autenticação obrigatória para acessar este recurso."
            );
        }
    }
}
