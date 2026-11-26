package com.br.CLAI.service;

import com.br.CLAI.domain.Aluno;
import com.br.CLAI.domain.AnexoEstudante;
import com.br.CLAI.domain.Usuario;
import com.br.CLAI.domain.enums.Role;
import com.br.CLAI.domain.enums.TipoClassificacaoAnexo;
import com.br.CLAI.dto.response.AnexoEstudanteResponseDTO;
import com.br.CLAI.exception.AcessoNegadoException;
import com.br.CLAI.exception.NaoEncontradoException;
import com.br.CLAI.exception.RegraDeNegocioException;
import com.br.CLAI.repository.AlunoRepository;
import com.br.CLAI.repository.AnexoEstudanteRepository;
import com.br.CLAI.security.RbacGuard;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
public class AnexoEstudanteService {

    public record AnexoDownloadPayload(
            String nomeOriginal,
            String contentType,
            byte[] conteudo
    ) {
    }

    private final AnexoEstudanteRepository anexoEstudanteRepository;
    private final AlunoRepository alunoRepository;
    private final CryptoStorageService cryptoStorageService;
    private final RbacGuard rbacGuard;

    public AnexoEstudanteService(
            AnexoEstudanteRepository anexoEstudanteRepository,
            AlunoRepository alunoRepository,
            CryptoStorageService cryptoStorageService
    ) {
        this(anexoEstudanteRepository, alunoRepository, cryptoStorageService, new RbacGuard());
    }

    @Autowired
    public AnexoEstudanteService(
            AnexoEstudanteRepository anexoEstudanteRepository,
            AlunoRepository alunoRepository,
            CryptoStorageService cryptoStorageService,
            RbacGuard rbacGuard
    ) {
        this.anexoEstudanteRepository = anexoEstudanteRepository;
        this.alunoRepository = alunoRepository;
        this.cryptoStorageService = cryptoStorageService;
        this.rbacGuard = rbacGuard != null ? rbacGuard : new RbacGuard();
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

        Usuario usuarioAtual = resolverUsuarioAutenticado(null);
        if (usuarioAtual != null && usuarioAtual.getId() != null) {
            anexo.setCriadoPor(usuarioAtual.getId());
            anexo.setAtualizadoPor(usuarioAtual.getId());
        }

        AnexoEstudante salvo = anexoEstudanteRepository.save(anexo);
        boolean incluirRoles = ehCoordenadorAtivo(usuarioAtual)
                && classificacao == TipoClassificacaoAnexo.LAUDO_MEDICO;
        return AnexoEstudanteResponseDTO.fromEntity(salvo, incluirRoles);
    }

    /**
     * Realiza o download de um anexo validando rigorosamente as regras RBAC/LGPD
     * e executando a descriptografia exclusivamente em memória (RAM):
     * - LAUDO_MEDICO: apenas COORDENADOR (padrão) ou cargos explicitamente liberados no laudo.
     * - DIAGNOSTICO_NEUROPSICOLOGICO: apenas SUPER_RESTRICAO + autorizacaoSaude = true (TA11.2).
     * - DOCUMENTO_PEDAGOGICO: qualquer usuário autenticado ativo.
     */
    @Transactional(readOnly = true)
    public AnexoDownloadPayload downloadAnexo(UUID anexoId, Jwt jwtAutenticado) {
        Usuario usuario = jwtAutenticado != null ? rbacGuard.converterJwtParaUsuario(jwtAutenticado) : null;
        return downloadAnexo(anexoId, usuario);
    }

    @Transactional(readOnly = true)
    public AnexoDownloadPayload downloadAnexo(UUID anexoId, Usuario usuarioAutenticado) {
        AnexoEstudante anexo = anexoEstudanteRepository.findById(anexoId)
                .orElseThrow(() -> new NaoEncontradoException("Anexo não encontrado com o ID: " + anexoId));

        Usuario usuario = resolverUsuarioAutenticado(usuarioAutenticado);

        if (anexo.getClassificacao() == TipoClassificacaoAnexo.LAUDO_MEDICO) {
            validarAcessoLaudoMedico(anexo, usuario);
        } else if (anexo.getClassificacao() != null && anexo.getClassificacao().isSensivel()) {
            validarAcessoEstritoSaude(usuario);
        } else if (usuario == null || !Boolean.TRUE.equals(usuario.getAcessoAtivo())) {
            throw new AcessoNegadoException("Autenticação obrigatória para acessar documentos do estudante.");
        }

        byte[] bytesArmazenados = cryptoStorageService.lerDoVolume(anexo.getCaminhoArmazenamento());

        byte[] bytesFinaisEmMemoria;
        if (anexo.isCriptografado()) {
            bytesFinaisEmMemoria = cryptoStorageService.decrypt(bytesArmazenados, anexo.getIv());
        } else {
            bytesFinaisEmMemoria = bytesArmazenados;
        }

        return new AnexoDownloadPayload(
                anexo.getNomeOriginal(),
                anexo.getContentType(),
                bytesFinaisEmMemoria
        );
    }

    @Transactional(readOnly = true)
    public List<AnexoEstudanteResponseDTO> listarAnexosPorEstudante(UUID estudanteId) {
        return listarAnexosPorEstudante(estudanteId, null);
    }

    @Transactional(readOnly = true)
    public List<AnexoEstudanteResponseDTO> listarAnexosPorEstudante(UUID estudanteId, Jwt jwtAutenticado) {
        if (!alunoRepository.existsById(estudanteId)) {
            throw new NaoEncontradoException("Estudante não encontrado com o ID: " + estudanteId);
        }

        Usuario usuario = resolverUsuarioPorJwtOuContexto(jwtAutenticado);
        boolean ehCoordenador = ehCoordenadorAtivo(usuario);

        return anexoEstudanteRepository.findByAlunoIdOrderByCriadoEmDesc(estudanteId)
                .stream()
                .filter(anexo -> {
                    if (anexo.getClassificacao() == TipoClassificacaoAnexo.LAUDO_MEDICO) {
                        return podeVisualizarLaudoMedico(anexo, usuario);
                    }
                    if (anexo.getClassificacao() != null && anexo.getClassificacao().isSensivel()) {
                        return ehCoordenadorAtivo(usuario);
                    }
                    return true;
                })
                .map(anexo -> AnexoEstudanteResponseDTO.fromEntity(anexo, ehCoordenador))
                .toList();
    }

    /**
     * Lista exclusivamente os anexos classificados como LAUDO_MEDICO visíveis ao cargo do usuário
     * para exibição e gestão no Estudo de Caso.
     */
    @Transactional(readOnly = true)
    public List<AnexoEstudanteResponseDTO> listarLaudosMedicosPorEstudante(UUID estudanteId, Jwt jwtAutenticado) {
        if (!alunoRepository.existsById(estudanteId)) {
            throw new NaoEncontradoException("Estudante não encontrado com o ID: " + estudanteId);
        }

        Usuario usuario = resolverUsuarioPorJwtOuContexto(jwtAutenticado);
        boolean ehCoordenador = ehCoordenadorAtivo(usuario);

        return anexoEstudanteRepository
                .findByAlunoIdAndClassificacaoOrderByCriadoEmDesc(estudanteId, TipoClassificacaoAnexo.LAUDO_MEDICO)
                .stream()
                .filter(anexo -> podeVisualizarLaudoMedico(anexo, usuario))
                .map(anexo -> AnexoEstudanteResponseDTO.fromEntity(anexo, ehCoordenador))
                .toList();
    }

    /**
     * Libera ou revoga dinamicamente os cargos (Roles) autorizados a visualizar/baixar um LAUDO_MEDICO.
     * Operação exclusiva do Coordenador(a) da CLAI.
     */
    @Transactional
    public AnexoEstudanteResponseDTO atualizarPermissoesLaudo(
            UUID anexoId,
            Set<Role> rolesPermitidas,
            Jwt jwtAutenticado
    ) {
        Usuario usuario = resolverUsuarioPorJwtOuContexto(jwtAutenticado);
        if (!ehCoordenadorAtivo(usuario)) {
            throw new AcessoNegadoException(
                    "Acesso negado: apenas a Coordenação da CLAI pode gerenciar permissões de visualização de Laudos Médicos."
            );
        }

        AnexoEstudante anexo = anexoEstudanteRepository.findById(anexoId)
                .orElseThrow(() -> new NaoEncontradoException("Anexo não encontrado com o ID: " + anexoId));

        if (anexo.getClassificacao() != TipoClassificacaoAnexo.LAUDO_MEDICO) {
            throw new RegraDeNegocioException(
                    "O controle de permissões por cargo aplica-se exclusivamente a anexos classificados como LAUDO_MEDICO."
            );
        }

        Set<Role> rolesSanitizadas = new LinkedHashSet<>();
        if (rolesPermitidas != null) {
            for (Role role : rolesPermitidas) {
                if (role != null && role != Role.COORDENADOR) {
                    rolesSanitizadas.add(role);
                }
            }
        }

        anexo.setRolesPermitidas(rolesSanitizadas);
        if (usuario.getId() != null) {
            anexo.setAtualizadoPor(usuario.getId());
        }
        anexo.setAtualizadoEm(LocalDateTime.now());

        AnexoEstudante salvo = anexoEstudanteRepository.save(anexo);
        return AnexoEstudanteResponseDTO.fromEntity(salvo, true);
    }

    private void validarAcessoLaudoMedico(AnexoEstudante anexo, Usuario usuario) {
        if (!podeVisualizarLaudoMedico(anexo, usuario)) {
            throw new AcessoNegadoException(
                    "Acesso negado: a visualização e o download deste Laudo Médico são restritos à Coordenação da CLAI e aos cargos expressamente liberados."
            );
        }
    }

    private boolean podeVisualizarLaudoMedico(AnexoEstudante anexo, Usuario usuario) {
        if (usuario == null || !Boolean.TRUE.equals(usuario.getAcessoAtivo()) || usuario.getRole() == null) {
            return false;
        }
        return anexo.isRolePermitidaParaLaudo(usuario.getRole());
    }

    private boolean ehCoordenadorAtivo(Usuario usuario) {
        return usuario != null
                && Boolean.TRUE.equals(usuario.getAcessoAtivo())
                && usuario.getRole() == Role.COORDENADOR;
    }

    private void validarAcessoEstritoSaude(Usuario usuario) {
        if (!ehCoordenadorAtivo(usuario)) {
            throw new AcessoNegadoException(
                    "Acesso negado: visualização e descriptografia de anexos de dados sensíveis restrita exclusivamente ao(à) Coordenador(a) da CLAI."
            );
        }
    }

    private Usuario resolverUsuarioPorJwtOuContexto(Jwt jwtAutenticado) {
        Usuario viaJwt = jwtAutenticado != null ? rbacGuard.converterJwtParaUsuario(jwtAutenticado) : null;
        return resolverUsuarioAutenticado(viaJwt);
    }

    private Usuario resolverUsuarioAutenticado(Usuario usuarioParametro) {
        if (usuarioParametro != null) {
            return usuarioParametro;
        }
        return rbacGuard.getUsuarioAutenticado().orElse(null);
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
