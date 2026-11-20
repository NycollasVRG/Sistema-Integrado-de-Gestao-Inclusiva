package com.br.CLAI.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class NotificacaoRequestDTO {

    @NotBlank(message = "O perfil destinatário é obrigatório.")
    @Size(max = 50, message = "O perfil destinatário não pode exceder 50 caracteres.")
    private String perfilDestinatario;

    @NotBlank(message = "O título da notificação é obrigatório.")
    @Size(max = 255, message = "O título não pode exceder 255 caracteres.")
    private String titulo;

    @NotBlank(message = "A mensagem da notificação é obrigatória.")
    private String mensagem;

    @Size(max = 255, message = "O link de referência não pode exceder 255 caracteres.")
    private String linkReferencia;

    public NotificacaoRequestDTO() {
    }

    public NotificacaoRequestDTO(String perfilDestinatario, String titulo, String mensagem, String linkReferencia) {
        this.perfilDestinatario = perfilDestinatario;
        this.titulo = titulo;
        this.mensagem = mensagem;
        this.linkReferencia = linkReferencia;
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
}
