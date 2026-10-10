package com.br.CLAI.domain;

import com.br.CLAI.domain.enums.StatusEstudoCaso;
import jakarta.persistence.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "estudo_de_caso", schema = "sigi")
public class EstudoDeCaso extends BaseEntity {

    @ManyToOne
    @JoinColumn(name = "aluno_id", nullable = false)
    private Aluno aluno;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private StatusEstudoCaso status = StatusEstudoCaso.ATIVO;

    @Column(name = "diagnostico_inicial", columnDefinition = "TEXT")
    private String diagnosticoInicial;

    @ManyToMany
    @JoinTable(
            name = "estudo_caso_indicador",
            schema = "sigi",
            joinColumns = @JoinColumn(name = "estudo_de_caso_id"),
            inverseJoinColumns = @JoinColumn(name = "indicador_id")
    )
    private List<IndicadorReutilizavel> indicadores = new ArrayList<>();

    public EstudoDeCaso() {
    }

    public EstudoDeCaso(Aluno aluno, StatusEstudoCaso status, String diagnosticoInicial) {
        this.aluno = aluno;
        this.status = status;
        this.diagnosticoInicial = diagnosticoInicial;
    }

    public Aluno getAluno() {
        return aluno;
    }

    public void setAluno(Aluno aluno) {
        this.aluno = aluno;
    }

    public StatusEstudoCaso getStatus() {
        return status;
    }

    public void setStatus(StatusEstudoCaso status) {
        this.status = status;
    }

    public String getDiagnosticoInicial() {
        return diagnosticoInicial;
    }

    public void setDiagnosticoInicial(String diagnosticoInicial) {
        this.diagnosticoInicial = diagnosticoInicial;
    }

    public List<IndicadorReutilizavel> getIndicadores() {
        return indicadores;
    }

    public void setIndicadores(List<IndicadorReutilizavel> indicadores) {
        this.indicadores = indicadores;
    }
}
