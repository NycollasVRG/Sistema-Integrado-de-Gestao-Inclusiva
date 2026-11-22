package com.br.CLAI.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

/**
 * Registro auditável de assinatura digital coletada de um participante presente na reunião (TA8.1).
 */
@Entity
@Table(name = "ata_assinatura", schema = "sigi")
public class AtaAssinatura extends BaseEntity {

    @ManyToOne(optional = false)
    @JoinColumn(name = "ata_id", nullable = false)
    private AtaReuniao ata;

    @Column(name = "nome_participante", nullable = false, length = 255)
    private String nomeParticipante;

    @Column(name = "papel_participante", nullable = false, length = 100)
    private String papelParticipante;

    @ManyToOne
    @JoinColumn(name = "usuario_id")
    private Usuario usuario;

    @Column(name = "assinado_em", nullable = false)
    private LocalDateTime assinadoEm;

    @Column(name = "ip_origem", length = 64)
    private String ipOrigem;

    @Column(name = "hash_conteudo", nullable = false, length = 64)
    private String hashConteudo;

    public AtaAssinatura() {
    }

    public AtaAssinatura(AtaReuniao ata,
                         String nomeParticipante,
                         String papelParticipante,
                         Usuario usuario,
                         LocalDateTime assinadoEm,
                         String ipOrigem,
                         String hashConteudo) {
        this.ata = ata;
        this.nomeParticipante = nomeParticipante;
        this.papelParticipante = papelParticipante;
        this.usuario = usuario;
        this.assinadoEm = assinadoEm;
        this.ipOrigem = ipOrigem;
        this.hashConteudo = hashConteudo;
    }

    public AtaReuniao getAta() {
        return ata;
    }

    public void setAta(AtaReuniao ata) {
        this.ata = ata;
    }

    public String getNomeParticipante() {
        return nomeParticipante;
    }

    public void setNomeParticipante(String nomeParticipante) {
        this.nomeParticipante = nomeParticipante;
    }

    public String getPapelParticipante() {
        return papelParticipante;
    }

    public void setPapelParticipante(String papelParticipante) {
        this.papelParticipante = papelParticipante;
    }

    public Usuario getUsuario() {
        return usuario;
    }

    public void setUsuario(Usuario usuario) {
        this.usuario = usuario;
    }

    public LocalDateTime getAssinadoEm() {
        return assinadoEm;
    }

    public void setAssinadoEm(LocalDateTime assinadoEm) {
        this.assinadoEm = assinadoEm;
    }

    public String getIpOrigem() {
        return ipOrigem;
    }

    public void setIpOrigem(String ipOrigem) {
        this.ipOrigem = ipOrigem;
    }

    public String getHashConteudo() {
        return hashConteudo;
    }

    public void setHashConteudo(String hashConteudo) {
        this.hashConteudo = hashConteudo;
    }
}
