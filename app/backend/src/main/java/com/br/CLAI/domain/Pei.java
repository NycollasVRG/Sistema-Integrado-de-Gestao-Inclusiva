package com.br.CLAI.domain;

import jakarta.persistence.*;

@Entity
@Table(name = "pei", schema = "sigi")
public class Pei extends BaseEntity {

    @ManyToOne
    @JoinColumn(name = "acompanhamento_id", nullable = false)
    private Acompanhamento acompanhamento;

    @Column(name = "semestre_ano", length = 30)
    private String semestreAno;

    @Column(name = "historico_estudante", columnDefinition = "TEXT")
    private String historicoEstudante;

    @Column(name = "necessidades_especificas", columnDefinition = "TEXT")
    private String necessidadesEspecificas;

    @Column(name = "habilidades_interesses", columnDefinition = "TEXT")
    private String habilidadesInteresses;

    @Column(name = "dificuldades_apresentadas", columnDefinition = "TEXT")
    private String dificuldadesApresentadas;

    @Column(name = "propostas_adaptacoes", columnDefinition = "TEXT")
    private String propostasAdaptacoes;

    @Column(name = "assinatura_clai", length = 255)
    private String assinaturaClai;

    @Column(name = "assinatura_setor_pedagogico", length = 255)
    private String assinaturaSetorPedagogico;

    @Column(name = "assinatura_coordenador_curso", length = 255)
    private String assinaturaCoordenadorCurso;

    @Column(name = "assinatura_estudante_responsavel", length = 255)
    private String assinaturaEstudanteResponsavel;

    @Column(name = "assinaturas_docentes", columnDefinition = "TEXT")
    private String assinaturasDocentes;

    public Pei() {
    }

    public Pei(Acompanhamento acompanhamento, String habilidadesInteresses, String propostasAdaptacoes) {
        this.acompanhamento = acompanhamento;
        this.habilidadesInteresses = habilidadesInteresses;
        this.propostasAdaptacoes = propostasAdaptacoes;
    }

    public Pei(
            Acompanhamento acompanhamento,
            String semestreAno,
            String historicoEstudante,
            String necessidadesEspecificas,
            String habilidadesInteresses,
            String dificuldadesApresentadas,
            String propostasAdaptacoes) {
        this.acompanhamento = acompanhamento;
        this.semestreAno = semestreAno;
        this.historicoEstudante = historicoEstudante;
        this.necessidadesEspecificas = necessidadesEspecificas;
        this.habilidadesInteresses = habilidadesInteresses;
        this.dificuldadesApresentadas = dificuldadesApresentadas;
        this.propostasAdaptacoes = propostasAdaptacoes;
    }

    public Acompanhamento getAcompanhamento() {
        return acompanhamento;
    }

    public void setAcompanhamento(Acompanhamento acompanhamento) {
        this.acompanhamento = acompanhamento;
    }

    public String getSemestreAno() {
        return semestreAno;
    }

    public void setSemestreAno(String semestreAno) {
        this.semestreAno = semestreAno;
    }

    public String getHistoricoEstudante() {
        return historicoEstudante;
    }

    public void setHistoricoEstudante(String historicoEstudante) {
        this.historicoEstudante = historicoEstudante;
    }

    public String getNecessidadesEspecificas() {
        return necessidadesEspecificas;
    }

    public void setNecessidadesEspecificas(String necessidadesEspecificas) {
        this.necessidadesEspecificas = necessidadesEspecificas;
    }

    public String getHabilidadesInteresses() {
        return habilidadesInteresses;
    }

    public void setHabilidadesInteresses(String habilidadesInteresses) {
        this.habilidadesInteresses = habilidadesInteresses;
    }

    public String getDificuldadesApresentadas() {
        return dificuldadesApresentadas;
    }

    public void setDificuldadesApresentadas(String dificuldadesApresentadas) {
        this.dificuldadesApresentadas = dificuldadesApresentadas;
    }

    public String getPropostasAdaptacoes() {
        return propostasAdaptacoes;
    }

    public void setPropostasAdaptacoes(String propostasAdaptacoes) {
        this.propostasAdaptacoes = propostasAdaptacoes;
    }

    public String getAssinaturaClai() {
        return assinaturaClai;
    }

    public void setAssinaturaClai(String assinaturaClai) {
        this.assinaturaClai = assinaturaClai;
    }

    public String getAssinaturaSetorPedagogico() {
        return assinaturaSetorPedagogico;
    }

    public void setAssinaturaSetorPedagogico(String assinaturaSetorPedagogico) {
        this.assinaturaSetorPedagogico = assinaturaSetorPedagogico;
    }

    public String getAssinaturaCoordenadorCurso() {
        return assinaturaCoordenadorCurso;
    }

    public void setAssinaturaCoordenadorCurso(String assinaturaCoordenadorCurso) {
        this.assinaturaCoordenadorCurso = assinaturaCoordenadorCurso;
    }

    public String getAssinaturaEstudanteResponsavel() {
        return assinaturaEstudanteResponsavel;
    }

    public void setAssinaturaEstudanteResponsavel(String assinaturaEstudanteResponsavel) {
        this.assinaturaEstudanteResponsavel = assinaturaEstudanteResponsavel;
    }

    public String getAssinaturasDocentes() {
        return assinaturasDocentes;
    }

    public void setAssinaturasDocentes(String assinaturasDocentes) {
        this.assinaturasDocentes = assinaturasDocentes;
    }
}
