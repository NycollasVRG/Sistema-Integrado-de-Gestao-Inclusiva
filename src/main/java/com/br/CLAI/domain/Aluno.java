package com.br.CLAI.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "aluno", schema = "sigi")
public class Aluno extends BaseEntity {

    @Column(name = "nome", nullable = false)
    private String nome;

    @Column(name = "matricula", nullable = false, unique = true, length = 50)
    private String matricula;

    public Aluno() {
    }

    public Aluno(String nome, String matricula) {
        this.nome = nome;
        this.matricula = matricula;
    }

    public String getNome() {
        return nome;
    }

    public void setNome(String nome) {
        this.nome = nome;
    }

    public String getMatricula() {
        return matricula;
    }

    public void setMatricula(String matricula) {
        this.matricula = matricula;
    }
}
