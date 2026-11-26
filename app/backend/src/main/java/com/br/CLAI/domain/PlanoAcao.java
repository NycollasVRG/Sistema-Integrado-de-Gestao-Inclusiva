package com.br.CLAI.domain;

import jakarta.persistence.*;

import java.time.LocalDate;

@Entity
@Table(name = "plano_acao", schema = "sigi")
public class PlanoAcao extends BaseEntity {

    @ManyToOne
    @JoinColumn(name = "acompanhamento_id", nullable = false)
    private Acompanhamento acompanhamento;

    // Cabeçalho do Anexo II — Dados do(a) estudante e período
    @Column(name = "periodo_letivo", length = 30)
    private String periodoLetivo;

    @Column(name = "periodo_ingresso", length = 30)
    private String periodoIngresso;

    @Column(name = "data_nascimento")
    private LocalDate dataNascimento;

    @Column(name = "telefone_estudante", length = 30)
    private String telefoneEstudante;

    @Column(name = "email_estudante", length = 255)
    private String emailEstudante;

    // Dados do responsável
    @Column(name = "nome_responsavel", length = 255)
    private String nomeResponsavel;

    @Column(name = "grau_parentesco_responsavel", length = 100)
    private String grauParentescoResponsavel;

    @Column(name = "telefone_responsavel", length = 30)
    private String telefoneResponsavel;

    @Column(name = "email_responsavel", length = 255)
    private String emailResponsavel;

    // Triagem clínica e rede de apoio (LGPD: restrito a RESTRICAO_MODERADA+ e omitido no Dossiê EXTERNO)
    @Column(name = "possui_comorbidade")
    private Boolean possuiComorbidade;

    @Column(name = "comorbidade_detalhes", columnDefinition = "TEXT")
    private String comorbidadeDetalhes;

    @Column(name = "usa_medicacao_continua")
    private Boolean usaMedicacaoContinua;

    @Column(name = "medicacao_detalhes", columnDefinition = "TEXT")
    private String medicacaoDetalhes;

    @Column(name = "frequenta_servicos_apoio")
    private Boolean frequentaServicosApoio;

    @Column(name = "servicos_apoio_detalhes", columnDefinition = "TEXT")
    private String servicosApoioDetalhes;

    @Column(name = "apresentou_documentos_comprobatorios")
    private Boolean apresentouDocumentosComprobatorios;

    @Column(name = "documentos_comprobatorios_detalhes", columnDefinition = "TEXT")
    private String documentosComprobatoriosDetalhes;

    // 4 blocos descritivos do Anexo II
    @Column(name = "identificacao_necessidades_especificas", columnDefinition = "TEXT")
    private String identificacaoNecessidadesEspecificas;

    @Column(name = "relato_percurso_educacional", columnDefinition = "TEXT")
    private String relatoPercursoEducacional;

    @Column(name = "demandas_identificadas", columnDefinition = "TEXT")
    private String demandasIdentificadas;

    @Column(name = "propostas_intervencao", columnDefinition = "TEXT")
    private String propostasIntervencao;

    // Rodapé — Assinatura do(a) coordenador(a) da CLAI e data
    @Column(name = "assinatura_coordenador_clai", length = 255)
    private String assinaturaCoordenadorClai;

    @Column(name = "data_assinatura")
    private LocalDate dataAssinatura;

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

    public String getPeriodoLetivo() {
        return periodoLetivo;
    }

    public void setPeriodoLetivo(String periodoLetivo) {
        this.periodoLetivo = periodoLetivo;
    }

    public String getPeriodoIngresso() {
        return periodoIngresso;
    }

    public void setPeriodoIngresso(String periodoIngresso) {
        this.periodoIngresso = periodoIngresso;
    }

    public LocalDate getDataNascimento() {
        return dataNascimento;
    }

    public void setDataNascimento(LocalDate dataNascimento) {
        this.dataNascimento = dataNascimento;
    }

    public String getTelefoneEstudante() {
        return telefoneEstudante;
    }

    public void setTelefoneEstudante(String telefoneEstudante) {
        this.telefoneEstudante = telefoneEstudante;
    }

    public String getEmailEstudante() {
        return emailEstudante;
    }

    public void setEmailEstudante(String emailEstudante) {
        this.emailEstudante = emailEstudante;
    }

    public String getNomeResponsavel() {
        return nomeResponsavel;
    }

    public void setNomeResponsavel(String nomeResponsavel) {
        this.nomeResponsavel = nomeResponsavel;
    }

    public String getGrauParentescoResponsavel() {
        return grauParentescoResponsavel;
    }

    public void setGrauParentescoResponsavel(String grauParentescoResponsavel) {
        this.grauParentescoResponsavel = grauParentescoResponsavel;
    }

    public String getTelefoneResponsavel() {
        return telefoneResponsavel;
    }

    public void setTelefoneResponsavel(String telefoneResponsavel) {
        this.telefoneResponsavel = telefoneResponsavel;
    }

    public String getEmailResponsavel() {
        return emailResponsavel;
    }

    public void setEmailResponsavel(String emailResponsavel) {
        this.emailResponsavel = emailResponsavel;
    }

    public Boolean getPossuiComorbidade() {
        return possuiComorbidade;
    }

    public void setPossuiComorbidade(Boolean possuiComorbidade) {
        this.possuiComorbidade = possuiComorbidade;
    }

    public String getComorbidadeDetalhes() {
        return comorbidadeDetalhes;
    }

    public void setComorbidadeDetalhes(String comorbidadeDetalhes) {
        this.comorbidadeDetalhes = comorbidadeDetalhes;
    }

    public Boolean getUsaMedicacaoContinua() {
        return usaMedicacaoContinua;
    }

    public void setUsaMedicacaoContinua(Boolean usaMedicacaoContinua) {
        this.usaMedicacaoContinua = usaMedicacaoContinua;
    }

    public String getMedicacaoDetalhes() {
        return medicacaoDetalhes;
    }

    public void setMedicacaoDetalhes(String medicacaoDetalhes) {
        this.medicacaoDetalhes = medicacaoDetalhes;
    }

    public Boolean getFrequentaServicosApoio() {
        return frequentaServicosApoio;
    }

    public void setFrequentaServicosApoio(Boolean frequentaServicosApoio) {
        this.frequentaServicosApoio = frequentaServicosApoio;
    }

    public String getServicosApoioDetalhes() {
        return servicosApoioDetalhes;
    }

    public void setServicosApoioDetalhes(String servicosApoioDetalhes) {
        this.servicosApoioDetalhes = servicosApoioDetalhes;
    }

    public Boolean getApresentouDocumentosComprobatorios() {
        return apresentouDocumentosComprobatorios;
    }

    public void setApresentouDocumentosComprobatorios(Boolean apresentouDocumentosComprobatorios) {
        this.apresentouDocumentosComprobatorios = apresentouDocumentosComprobatorios;
    }

    public String getDocumentosComprobatoriosDetalhes() {
        return documentosComprobatoriosDetalhes;
    }

    public void setDocumentosComprobatoriosDetalhes(String documentosComprobatoriosDetalhes) {
        this.documentosComprobatoriosDetalhes = documentosComprobatoriosDetalhes;
    }

    public String getIdentificacaoNecessidadesEspecificas() {
        return identificacaoNecessidadesEspecificas;
    }

    public void setIdentificacaoNecessidadesEspecificas(String identificacaoNecessidadesEspecificas) {
        this.identificacaoNecessidadesEspecificas = identificacaoNecessidadesEspecificas;
    }

    public String getRelatoPercursoEducacional() {
        return relatoPercursoEducacional;
    }

    public void setRelatoPercursoEducacional(String relatoPercursoEducacional) {
        this.relatoPercursoEducacional = relatoPercursoEducacional;
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

    public String getAssinaturaCoordenadorClai() {
        return assinaturaCoordenadorClai;
    }

    public void setAssinaturaCoordenadorClai(String assinaturaCoordenadorClai) {
        this.assinaturaCoordenadorClai = assinaturaCoordenadorClai;
    }

    public LocalDate getDataAssinatura() {
        return dataAssinatura;
    }

    public void setDataAssinatura(LocalDate dataAssinatura) {
        this.dataAssinatura = dataAssinatura;
    }
}
