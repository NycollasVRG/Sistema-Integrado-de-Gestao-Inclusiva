package com.br.CLAI.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Notificação destinada a um perfil do sistema. Infraestrutura compartilhada
 * pelas US 01, US 03 (TA3.3), US 08 e US 10.
 */
@Entity
@Table(name = "notificacao", schema = "sigi")
public class Notificacao extends BaseEntity {

    @Column(name = "perfil_destinatario", nullable = false, length = 50)
    private String perfilDestinatario;

    @Column(name = "usuario_destinatario_id")
    private UUID usuarioDestinatarioId;

    @Column(nullable = false, length = 255)
    private String titulo;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String mensagem;

    @Column(name = "link_referencia", length = 255)
    private String linkReferencia;

    @Column(nullable = false)
    private Boolean lida = false;

    public Notificacao() {
    }

    public Notificacao(String perfilDestinatario, String titulo, String mensagem, String linkReferencia) {
        this(perfilDestinatario, null, titulo, mensagem, linkReferencia);
    }

    public Notificacao(String perfilDestinatario, UUID usuarioDestinatarioId, String titulo,
                       String mensagem, String linkReferencia) {
        this.perfilDestinatario = perfilDestinatario;
        this.usuarioDestinatarioId = usuarioDestinatarioId;
        this.titulo = titulo;
        this.mensagem = mensagem;
        this.linkReferencia = linkReferencia;
        this.lida = false;
    }

    /**
     * Construtor de compatibilidade com os primeiros chamadores do módulo de notificações.
     */
    public Notificacao(UUID id, String perfilDestinatario, String titulo, String mensagem,
                       String linkReferencia, Boolean lida, LocalDateTime criadoEm) {
        this(perfilDestinatario, null, titulo, mensagem, linkReferencia);
        setId(id);
        setLida(lida != null ? lida : false);
        setCriadoEm(criadoEm);
    }

    public String getPerfilDestinatario() {
        return perfilDestinatario;
    }

    public void setPerfilDestinatario(String perfilDestinatario) {
        this.perfilDestinatario = perfilDestinatario;
    }

    public UUID getUsuarioDestinatarioId() {
        return usuarioDestinatarioId;
    }

    public void setUsuarioDestinatarioId(UUID usuarioDestinatarioId) {
        this.usuarioDestinatarioId = usuarioDestinatarioId;
    }

    public String getTitulo() {
        return titulo;
    }

    public void setTitulo(String titulo) {
        this.titulo = titulo;
    }

    public String getMensagem() {
        return mensagem;
    }

    public void setMensagem(String mensagem) {
        this.mensagem = mensagem;
    }

    public String getLinkReferencia() {
        return linkReferencia;
    }

    public void setLinkReferencia(String linkReferencia) {
        this.linkReferencia = linkReferencia;
    }

    public Boolean getLida() {
        return lida;
    }

    public void setLida(Boolean lida) {
        this.lida = lida != null ? lida : false;
    }
}
