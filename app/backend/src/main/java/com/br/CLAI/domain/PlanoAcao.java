package com.br.CLAI.domain;

import jakarta.persistence.*;

@Entity
@Table(name = "plano_acao", schema = "sigi")
public class PlanoAcao extends BaseEntity {

    @ManyToOne
    @JoinColumn(name = "acompanhamento_id", nullable = false)
    private Acompanhamento acompanhamento;

    @Column(name = "demandas_identificadas", columnDefinition = "TEXT")
    private String demandasIdentificadas;

    @Column(name = "propostas_intervencao", columnDefinition = "TEXT")
    private String propostasIntervencao;

    public PlanoAcao() {
    }

    public PlanoAcao(Acompanhamento acompanhamento, String demandasIdentificadas, String propostasIntervencao) {
        this.acompanhamento = acompanhamento;
        this.demandasIdentificadas = demandasIdentificadas;
        this.propostasIntervencao = propostasIntervencao;
    }

    public Acompanhamento getAcompanhamento() {
        return acompanhamento;
    }

    public void setAcompanhamento(Acompanhamento acompanhamento) {
        this.acompanhamento = acompanhamento;
    }

    public String getDemandasIdentificadas() {
        return demandasIdentificadas;
    }

    public void setDemandasIdentificadas(String demandasIdentificadas) {
        this.demandasIdentificadas = demandasIdentificadas;
    }

    public String getPropostasIntervencao() {
        return propostasIntervencao;
    }

    public void setPropostasIntervencao(String propostasIntervencao) {
        this.propostasIntervencao = propostasIntervencao;
    }
}
