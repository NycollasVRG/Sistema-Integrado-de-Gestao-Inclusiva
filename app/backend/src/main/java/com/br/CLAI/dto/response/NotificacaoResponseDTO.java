package com.br.CLAI.dto.response;

import java.time.LocalDateTime;
import java.util.UUID;

public class NotificacaoResponseDTO {
    private UUID id;
    private String perfilDestinatario;
    private String titulo;
    private String mensagem;
    private String linkReferencia;
    private Boolean lida;
    private LocalDateTime criadoEm;

    public NotificacaoResponseDTO() {
    }

    public NotificacaoResponseDTO(UUID id, String perfilDestinatario, String titulo, String mensagem, String linkReferencia, Boolean lida, LocalDateTime criadoEm) {
        this.id = id;
        this.perfilDestinatario = perfilDestinatario;
        this.titulo = titulo;
        this.mensagem = mensagem;
        this.linkReferencia = linkReferencia;
        this.lida = lida;
        this.criadoEm = criadoEm;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getPerfilDestinatario() {
        return perfilDestinatario;
    }

    public void setPerfilDestinatario(String perfilDestinatario) {
        this.perfilDestinatario = perfilDestinatario;
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
        this.lida = lida;
    }

    public LocalDateTime getCriadoEm() {
        return criadoEm;
    }

    public void setCriadoEm(LocalDateTime criadoEm) {
        this.criadoEm = criadoEm;
    }
}