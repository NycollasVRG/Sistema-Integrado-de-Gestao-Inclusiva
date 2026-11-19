package com.br.CLAI.service;

import com.br.CLAI.domain.Notificacao;
import com.br.CLAI.dto.request.NotificacaoRequestDTO;
import com.br.CLAI.dto.response.NotificacaoResponseDTO;
import com.br.CLAI.exception.NaoEncontradoException;
import com.br.CLAI.exception.RegraDeNegocioException;
import com.br.CLAI.repository.NotificacaoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;
import java.util.UUID;

/**
 * Infraestrutura de notificações reutilizável pelas US 01, US 03, US 08 e US 10.
 * O destinatário é identificado pelo perfil (role), permitindo que qualquer
 * módulo registre avisos sem conhecer a lista de usuários.
 */
@Service
public class NotificacaoService {

    private final NotificacaoRepository notificacaoRepository;

    public NotificacaoService(NotificacaoRepository notificacaoRepository) {
        this.notificacaoRepository = notificacaoRepository;
    }

    @Transactional
    public NotificacaoResponseDTO criarNotificacao(NotificacaoRequestDTO requestDTO) {
        if (requestDTO == null) {
            throw new RegraDeNegocioException("Os dados da notificação são obrigatórios.");
        }
        return criarNotificacao(
                requestDTO.getPerfilDestinatario(),
                requestDTO.getTitulo(),
                requestDTO.getMensagem(),
                requestDTO.getLinkReferencia()
        );
    }

    @Transactional
    public NotificacaoResponseDTO criarNotificacao(String perfilDestinatario, String titulo,
                                                   String mensagem, String linkReferencia) {
        String perfil = validarPerfil(perfilDestinatario);
        String tituloValidado = validarTextoObrigatorio(titulo, "O título da notificação é obrigatório.");
        String mensagemValidada = validarTextoObrigatorio(mensagem, "A mensagem da notificação é obrigatória.");

        if (tituloValidado.length() > 255) {
            throw new RegraDeNegocioException("O título da notificação não pode exceder 255 caracteres.");
        }
        if (linkReferencia != null && linkReferencia.length() > 255) {
            throw new RegraDeNegocioException("O link de referência não pode exceder 255 caracteres.");
        }

        Notificacao notificacao = new Notificacao(perfil, tituloValidado, mensagemValidada, linkReferencia);
        return convertToResponseDTO(notificacaoRepository.save(notificacao));
    }

    @Transactional(readOnly = true)
    public List<NotificacaoResponseDTO> buscarPorPerfil(String perfil, Boolean apenasNaoLidas) {
        String perfilNormalizado = validarPerfil(perfil);
        List<Notificacao> notificacoes = Boolean.TRUE.equals(apenasNaoLidas)
                ? notificacaoRepository.findByPerfilDestinatarioAndLidaFalseOrderByCriadoEmDesc(perfilNormalizado)
                : notificacaoRepository.findByPerfilDestinatarioOrderByCriadoEmDesc(perfilNormalizado);

        return notificacoes.stream().map(this::convertToResponseDTO).toList();
    }

    @Transactional(readOnly = true)
    public long contarPendentesPorPerfil(String perfil) {
        return notificacaoRepository.countByPerfilDestinatarioAndLidaFalse(validarPerfil(perfil));
    }

    @Transactional
    public NotificacaoResponseDTO marcarComoLida(UUID id) {
        Notificacao notificacao = notificacaoRepository.findById(id)
                .orElseThrow(() -> new NaoEncontradoException("Notificação não encontrada com o ID: " + id));
        notificacao.setLida(true);
        return convertToResponseDTO(notificacaoRepository.save(notificacao));
    }

    private String validarPerfil(String perfil) {
        if (perfil == null || perfil.isBlank()) {
            throw new RegraDeNegocioException("O perfil destinatário é obrigatório.");
        }
        String normalizado = perfil.trim().toUpperCase(Locale.ROOT);
        if (normalizado.length() > 50) {
            throw new RegraDeNegocioException("O perfil destinatário não pode exceder 50 caracteres.");
        }
        return normalizado;
    }

    private String validarTextoObrigatorio(String valor, String mensagemErro) {
        if (valor == null || valor.isBlank()) {
            throw new RegraDeNegocioException(mensagemErro);
        }
        return valor.trim();
    }

    private NotificacaoResponseDTO convertToResponseDTO(Notificacao entity) {
        return new NotificacaoResponseDTO(
                entity.getId(),
                entity.getPerfilDestinatario(),
                entity.getTitulo(),
                entity.getMensagem(),
                entity.getLinkReferencia(),
                entity.getLida(),
                entity.getCriadoEm()
        );
    }
}
