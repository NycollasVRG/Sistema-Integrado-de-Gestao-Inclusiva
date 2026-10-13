package com.br.CLAI.domain;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "acompanhamento", schema = "sigi")
public class Acompanhamento extends BaseEntity {

    @ManyToOne
    @JoinColumn(name = "aluno_id", nullable = false)
    private Aluno aluno;

    @Column(name = "data_inicio", nullable = false)
    private LocalDate dataInicio = LocalDate.now();

    public Acompanhamento() {
    }

    public Acompanhamento(Aluno aluno, LocalDate dataInicio) {
        this.aluno = aluno;
        this.dataInicio = dataInicio;
    }

    public Aluno getAluno() {
        return aluno;
    }

    public void setAluno(Aluno aluno) {
        this.aluno = aluno;
    }

    public LocalDate getDataInicio() {
        return dataInicio;
    }

    public void setDataInicio(LocalDate dataInicio) {
        this.dataInicio = dataInicio;
    }
}
