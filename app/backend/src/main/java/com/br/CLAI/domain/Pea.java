package com.br.CLAI.domain;

import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "pea", schema = "sigi")
public class Pea extends BaseEntity {

    @ManyToOne
    @JoinColumn(name = "acompanhamento_id", nullable = false)
    private Acompanhamento acompanhamento;

    @Column(name = "disciplina_id")
    private UUID disciplinaId;

    @Column(name = "objetivo_geral", columnDefinition = "TEXT")
    private String objetivoGeral;

    @Column(name = "metodologia", columnDefinition = "TEXT")
    private String metodologia;

    @Column(name = "avaliacao", columnDefinition = "TEXT")
    private String avaliacao;

    public Pea() {
    }

    public Pea(Acompanhamento acompanhamento, UUID disciplinaId, String objetivoGeral, String metodologia, String avaliacao) {
        this.acompanhamento = acompanhamento;
        this.disciplinaId = disciplinaId;
        this.objetivoGeral = objetivoGeral;
        this.metodologia = metodologia;
        this.avaliacao = avaliacao;
    }

    public Acompanhamento getAcompanhamento() {
        return acompanhamento;
    }

    public void setAcompanhamento(Acompanhamento acompanhamento) {
        this.acompanhamento = acompanhamento;
    }

    public UUID getDisciplinaId() {
        return disciplinaId;
    }

    public void setDisciplinaId(UUID disciplinaId) {
        this.disciplinaId = disciplinaId;
    }

    public String getObjetivoGeral() {
        return objetivoGeral;
    }

    public void setObjetivoGeral(String objetivoGeral) {
        this.objetivoGeral = objetivoGeral;
    }

    public String getMetodologia() {
        return metodologia;
    }

    public void setMetodologia(String metodologia) {
        this.metodologia = metodologia;
    }

    public String getAvaliacao() {
        return avaliacao;
    }

    public void setAvaliacao(String avaliacao) {
        this.avaliacao = avaliacao;
    }
}
