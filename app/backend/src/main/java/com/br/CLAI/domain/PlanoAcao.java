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

    @Column(name = "componente_curricular", length = 200)
    private String componenteCurricular;

    @Column(name = "semestre_ano", length = 30)
    private String semestreAno;

    @Column(name = "docente", length = 255)
    private String docente;

    @Column(name = "objetivo_geral", columnDefinition = "TEXT")
    private String objetivoGeral;

    @Column(name = "objetivos_especificos", columnDefinition = "TEXT")
    private String objetivosEspecificos;

    @Column(name = "conteudos_programaticos", columnDefinition = "TEXT")
    private String conteudosProgramaticos;

    @Column(name = "metodologia", columnDefinition = "TEXT")
    private String metodologia;

    @Column(name = "avaliacao", columnDefinition = "TEXT")
    private String avaliacao;

    @Column(name = "bibliografia_basica", columnDefinition = "TEXT")
    private String bibliografiaBasica;

    @Column(name = "bibliografia_complementar", columnDefinition = "TEXT")
    private String bibliografiaComplementar;

    public PlanoAcao() {
    }

    public PlanoAcao(Acompanhamento acompanhamento, String demandasIdentificadas, String propostasIntervencao) {
        this.acompanhamento = acompanhamento;
        this.demandasIdentificadas = demandasIdentificadas;
        this.propostasIntervencao = propostasIntervencao;
    }

    public PlanoAcao(
            Acompanhamento acompanhamento,
            String demandasIdentificadas,
            String propostasIntervencao,
            String componenteCurricular,
            String semestreAno,
            String docente,
            String objetivoGeral,
            String objetivosEspecificos,
            String conteudosProgramaticos,
            String metodologia,
            String avaliacao,
            String bibliografiaBasica,
            String bibliografiaComplementar) {
        this.acompanhamento = acompanhamento;
        this.demandasIdentificadas = demandasIdentificadas;
        this.propostasIntervencao = propostasIntervencao;
        this.componenteCurricular = componenteCurricular;
        this.semestreAno = semestreAno;
        this.docente = docente;
        this.objetivoGeral = objetivoGeral;
        this.objetivosEspecificos = objetivosEspecificos;
        this.conteudosProgramaticos = conteudosProgramaticos;
        this.metodologia = metodologia;
        this.avaliacao = avaliacao;
        this.bibliografiaBasica = bibliografiaBasica;
        this.bibliografiaComplementar = bibliografiaComplementar;
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

    public String getComponenteCurricular() {
        return componenteCurricular;
    }

    public void setComponenteCurricular(String componenteCurricular) {
        this.componenteCurricular = componenteCurricular;
    }

    public String getSemestreAno() {
        return semestreAno;
    }

    public void setSemestreAno(String semestreAno) {
        this.semestreAno = semestreAno;
    }

    public String getDocente() {
        return docente;
    }

    public void setDocente(String docente) {
        this.docente = docente;
    }

    public String getObjetivoGeral() {
        return objetivoGeral;
    }

    public void setObjetivoGeral(String objetivoGeral) {
        this.objetivoGeral = objetivoGeral;
    }

    public String getObjetivosEspecificos() {
        return objetivosEspecificos;
    }

    public void setObjetivosEspecificos(String objetivosEspecificos) {
        this.objetivosEspecificos = objetivosEspecificos;
    }

    public String getConteudosProgramaticos() {
        return conteudosProgramaticos;
    }

    public void setConteudosProgramaticos(String conteudosProgramaticos) {
        this.conteudosProgramaticos = conteudosProgramaticos;
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

    public String getBibliografiaBasica() {
        return bibliografiaBasica;
    }

    public void setBibliografiaBasica(String bibliografiaBasica) {
        this.bibliografiaBasica = bibliografiaBasica;
    }

    public String getBibliografiaComplementar() {
        return bibliografiaComplementar;
    }

    public void setBibliografiaComplementar(String bibliografiaComplementar) {
        this.bibliografiaComplementar = bibliografiaComplementar;
    }
}
