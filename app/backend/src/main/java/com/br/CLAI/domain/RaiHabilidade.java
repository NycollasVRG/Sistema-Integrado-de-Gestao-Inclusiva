package com.br.CLAI.domain;

import com.br.CLAI.domain.enums.NivelAprendizado;
import jakarta.persistence.*;

@Entity
@Table(name = "rai_habilidade", schema = "sigi")
public class RaiHabilidade extends BaseEntity {

    @ManyToOne(optional = false)
    @JoinColumn(name = "rai_id", nullable = false)
    private Rai rai;

    @Column(name = "ordem", nullable = false)
    private Integer ordem = 0;

    @Column(name = "habilidade_desenvolvida", nullable = false, columnDefinition = "TEXT")
    private String habilidadeDesenvolvida;

    @Enumerated(EnumType.STRING)
    @Column(name = "nivel_aprendizado", nullable = false, length = 20)
    private NivelAprendizado nivelAprendizado = NivelAprendizado.SATISFATORIO;

    @Column(name = "observacoes", columnDefinition = "TEXT")
    private String observacoes;

    public RaiHabilidade() {
    }

    public RaiHabilidade(Rai rai, Integer ordem, String habilidadeDesenvolvida,
                         NivelAprendizado nivelAprendizado, String observacoes) {
        this.rai = rai;
        this.ordem = ordem != null ? ordem : 0;
        this.habilidadeDesenvolvida = habilidadeDesenvolvida;
        this.nivelAprendizado = nivelAprendizado != null ? nivelAprendizado : NivelAprendizado.SATISFATORIO;
        this.observacoes = observacoes;
    }

    public Rai getRai() {
        return rai;
    }

    public void setRai(Rai rai) {
        this.rai = rai;
    }

    public Integer getOrdem() {
        return ordem;
    }

    public void setOrdem(Integer ordem) {
        this.ordem = ordem != null ? ordem : 0;
    }

    public String getHabilidadeDesenvolvida() {
        return habilidadeDesenvolvida;
    }

    public void setHabilidadeDesenvolvida(String habilidadeDesenvolvida) {
        this.habilidadeDesenvolvida = habilidadeDesenvolvida;
    }

    public NivelAprendizado getNivelAprendizado() {
        return nivelAprendizado;
    }

    public void setNivelAprendizado(NivelAprendizado nivelAprendizado) {
        this.nivelAprendizado = nivelAprendizado != null ? nivelAprendizado : NivelAprendizado.SATISFATORIO;
    }

    public String getObservacoes() {
        return observacoes;
    }

    public void setObservacoes(String observacoes) {
        this.observacoes = observacoes;
    }
}
