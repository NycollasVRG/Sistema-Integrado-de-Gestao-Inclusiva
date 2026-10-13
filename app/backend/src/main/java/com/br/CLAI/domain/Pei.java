package com.br.CLAI.domain;

import jakarta.persistence.*;

@Entity
@Table(name = "pei", schema = "sigi")
public class Pei extends BaseEntity {

    @ManyToOne
    @JoinColumn(name = "acompanhamento_id", nullable = false)
    private Acompanhamento acompanhamento;

    @Column(name = "habilidades_interesses", columnDefinition = "TEXT")
    private String habilidadesInteresses;

    @Column(name = "propostas_adaptacoes", columnDefinition = "TEXT")
    private String propostasAdaptacoes;

    public Pei() {
    }

    public Pei(Acompanhamento acompanhamento, String habilidadesInteresses, String propostasAdaptacoes) {
        this.acompanhamento = acompanhamento;
        this.habilidadesInteresses = habilidadesInteresses;
        this.propostasAdaptacoes = propostasAdaptacoes;
    }

    public Acompanhamento getAcompanhamento() {
        return acompanhamento;
    }

    public void setAcompanhamento(Acompanhamento acompanhamento) {
        this.acompanhamento = acompanhamento;
    }

    public String getHabilidadesInteresses() {
        return habilidadesInteresses;
    }

    public void setHabilidadesInteresses(String habilidadesInteresses) {
        this.habilidadesInteresses = habilidadesInteresses;
    }

    public String getPropostasAdaptacoes() {
        return propostasAdaptacoes;
    }

    public void setPropostasAdaptacoes(String propostasAdaptacoes) {
        this.propostasAdaptacoes = propostasAdaptacoes;
    }
}
