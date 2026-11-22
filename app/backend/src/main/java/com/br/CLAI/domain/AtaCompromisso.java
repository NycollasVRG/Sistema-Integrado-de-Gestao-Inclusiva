package com.br.CLAI.domain;

import com.br.CLAI.domain.enums.StatusCompromisso;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Compromisso e prazo acordados em ata de reunião, com responsável designado para
 * disparo automático de lembretes (TA8.3).
 */
@Entity
@Table(name = "ata_compromisso", schema = "sigi")
public class AtaCompromisso extends BaseEntity {

    @ManyToOne(optional = false)
    @JoinColumn(name = "ata_id", nullable = false)
    private AtaReuniao ata;

    @Column(name = "descricao", nullable = false, columnDefinition = "TEXT")
    private String descricao;

    @ManyToOne(optional = false)
    @JoinColumn(name = "responsavel_id", nullable = false)
    private Usuario responsavel;

    @Column(name = "prazo", nullable = false)
    private LocalDate prazo;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private StatusCompromisso status = StatusCompromisso.PENDENTE;

    @Column(name = "lembrete_enviado_em")
    private LocalDateTime lembreteEnviadoEm;

    public AtaCompromisso() {
    }

    public AtaCompromisso(AtaReuniao ata,
                          String descricao,
                          Usuario responsavel,
                          LocalDate prazo) {
        this.ata = ata;
        this.descricao = descricao;
        this.responsavel = responsavel;
        this.prazo = prazo;
        this.status = StatusCompromisso.PENDENTE;
    }

    public AtaReuniao getAta() {
        return ata;
    }

    public void setAta(AtaReuniao ata) {
        this.ata = ata;
    }

    public String getDescricao() {
        return descricao;
    }

    public void setDescricao(String descricao) {
        this.descricao = descricao;
    }

    public Usuario getResponsavel() {
        return responsavel;
    }

    public void setResponsavel(Usuario responsavel) {
        this.responsavel = responsavel;
    }

    public LocalDate getPrazo() {
        return prazo;
    }

    public void setPrazo(LocalDate prazo) {
        this.prazo = prazo;
    }

    public StatusCompromisso getStatus() {
        return status;
    }

    public void setStatus(StatusCompromisso status) {
        this.status = status;
    }

    public LocalDateTime getLembreteEnviadoEm() {
        return lembreteEnviadoEm;
    }

    public void setLembreteEnviadoEm(LocalDateTime lembreteEnviadoEm) {
        this.lembreteEnviadoEm = lembreteEnviadoEm;
    }
}
