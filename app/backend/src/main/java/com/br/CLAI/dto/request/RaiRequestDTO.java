package com.br.CLAI.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public class RaiRequestDTO {

    @NotNull(message = "O identificador do estudante é obrigatório.")
    private UUID alunoId;

    private UUID peiId;

    private UUID acompanhamentoId;

    /** Opcional; quando omitido o relatório é registrado como RAI. */
    @Size(max = 20, message = "O tipo de relatório deve ser RAI ou RAE.")
    private String tipoRelatorio;

    @NotNull(message = "O bimestre de referência é obrigatório.")
    @Min(value = 1, message = "O bimestre deve estar entre 1 e 4.")
    @Max(value = 4, message = "O bimestre deve estar entre 1 e 4.")
    private Integer bimestre;

    private Boolean indicativoRegressao;

    @Size(max = 5000, message = "A descrição não pode exceder 5000 caracteres.")
    private String descricao;

    // Cabeçalho Anexo V
    @Size(max = 30, message = "O período letivo deve ter no máximo 30 caracteres.")
    private String periodoLetivo;

    @Size(max = 200, message = "O componente curricular deve ter no máximo 200 caracteres.")
    private String componenteCurricular;

    @Size(max = 255, message = "O nome do docente deve ter no máximo 255 caracteres.")
    private String docente;

    // Aspectos Observados
    private List<String> relacionamentoOpcoes;
    @Size(max = 255)
    private String relacionamentoOutros;
    private String relacionamentoComentario;

    private List<String> habilidadesCognitivasOpcoes;
    @Size(max = 255)
    private String habilidadesCognitivasOutros;
    private String habilidadesCognitivasComentario;

    private List<String> habilidadesSocioemocionaisOpcoes;
    @Size(max = 255)
    private String habilidadesSocioemocionaisOutros;
    private String habilidadesSocioemocionaisComentario;

    // Relatos e Parecer
    private String avancosGerais;
    private String dificuldadesAprendizagem;
    private String fatoresExternos;
    private String parecer;

    // Habilidades e Competências Desenvolvidas
    private List<@Valid RaiHabilidadeDTO> habilidadesDesenvolvidas;

    // Rodapé
    private LocalDate dataRelatorio;
    @Size(max = 255)
    private String assinaturaDocente;

    public RaiRequestDTO() {
    }

    public RaiRequestDTO(UUID alunoId, UUID peiId, UUID acompanhamentoId, Integer bimestre,
                         Boolean indicativoRegressao, String descricao) {
        this(alunoId, peiId, acompanhamentoId, "RAI", bimestre, indicativoRegressao, descricao);
    }

    public RaiRequestDTO(UUID alunoId, UUID peiId, UUID acompanhamentoId, String tipoRelatorio,
                         Integer bimestre, Boolean indicativoRegressao, String descricao) {
        this.alunoId = alunoId;
        this.peiId = peiId;
        this.acompanhamentoId = acompanhamentoId;
        this.tipoRelatorio = tipoRelatorio;
        this.bimestre = bimestre;
        this.indicativoRegressao = indicativoRegressao;
        this.descricao = descricao;
    }

    public UUID getAlunoId() { return alunoId; }
    public void setAlunoId(UUID alunoId) { this.alunoId = alunoId; }

    public UUID getPeiId() { return peiId; }
    public void setPeiId(UUID peiId) { this.peiId = peiId; }

    public UUID getAcompanhamentoId() { return acompanhamentoId; }
    public void setAcompanhamentoId(UUID acompanhamentoId) { this.acompanhamentoId = acompanhamentoId; }

    public String getTipoRelatorio() { return tipoRelatorio; }
    public void setTipoRelatorio(String tipoRelatorio) { this.tipoRelatorio = tipoRelatorio; }

    public Integer getBimestre() { return bimestre; }
    public void setBimestre(Integer bimestre) { this.bimestre = bimestre; }

    public Boolean getIndicativoRegressao() { return indicativoRegressao; }
    public void setIndicativoRegressao(Boolean indicativoRegressao) { this.indicativoRegressao = indicativoRegressao; }

    public String getDescricao() { return descricao; }
    public void setDescricao(String descricao) { this.descricao = descricao; }

    public String getPeriodoLetivo() { return periodoLetivo; }
    public void setPeriodoLetivo(String periodoLetivo) { this.periodoLetivo = periodoLetivo; }

    public String getComponenteCurricular() { return componenteCurricular; }
    public void setComponenteCurricular(String componenteCurricular) { this.componenteCurricular = componenteCurricular; }

    public String getDocente() { return docente; }
    public void setDocente(String docente) { this.docente = docente; }

    public List<String> getRelacionamentoOpcoes() { return relacionamentoOpcoes; }
    public void setRelacionamentoOpcoes(List<String> relacionamentoOpcoes) { this.relacionamentoOpcoes = relacionamentoOpcoes; }

    public String getRelacionamentoOutros() { return relacionamentoOutros; }
    public void setRelacionamentoOutros(String relacionamentoOutros) { this.relacionamentoOutros = relacionamentoOutros; }

    public String getRelacionamentoComentario() { return relacionamentoComentario; }
    public void setRelacionamentoComentario(String relacionamentoComentario) { this.relacionamentoComentario = relacionamentoComentario; }

    public List<String> getHabilidadesCognitivasOpcoes() { return habilidadesCognitivasOpcoes; }
    public void setHabilidadesCognitivasOpcoes(List<String> habilidadesCognitivasOpcoes) { this.habilidadesCognitivasOpcoes = habilidadesCognitivasOpcoes; }

    public String getHabilidadesCognitivasOutros() { return habilidadesCognitivasOutros; }
    public void setHabilidadesCognitivasOutros(String habilidadesCognitivasOutros) { this.habilidadesCognitivasOutros = habilidadesCognitivasOutros; }

    public String getHabilidadesCognitivasComentario() { return habilidadesCognitivasComentario; }
    public void setHabilidadesCognitivasComentario(String habilidadesCognitivasComentario) { this.habilidadesCognitivasComentario = habilidadesCognitivasComentario; }

    public List<String> getHabilidadesSocioemocionaisOpcoes() { return habilidadesSocioemocionaisOpcoes; }
    public void setHabilidadesSocioemocionaisOpcoes(List<String> habilidadesSocioemocionaisOpcoes) { this.habilidadesSocioemocionaisOpcoes = habilidadesSocioemocionaisOpcoes; }

    public String getHabilidadesSocioemocionaisOutros() { return habilidadesSocioemocionaisOutros; }
    public void setHabilidadesSocioemocionaisOutros(String habilidadesSocioemocionaisOutros) { this.habilidadesSocioemocionaisOutros = habilidadesSocioemocionaisOutros; }

    public String getHabilidadesSocioemocionaisComentario() { return habilidadesSocioemocionaisComentario; }
    public void setHabilidadesSocioemocionaisComentario(String habilidadesSocioemocionaisComentario) { this.habilidadesSocioemocionaisComentario = habilidadesSocioemocionaisComentario; }

    public String getAvancosGerais() { return avancosGerais; }
    public void setAvancosGerais(String avancosGerais) { this.avancosGerais = avancosGerais; }

    public String getDificuldadesAprendizagem() { return dificuldadesAprendizagem; }
    public void setDificuldadesAprendizagem(String dificuldadesAprendizagem) { this.dificuldadesAprendizagem = dificuldadesAprendizagem; }

    public String getFatoresExternos() { return fatoresExternos; }
    public void setFatoresExternos(String fatoresExternos) { this.fatoresExternos = fatoresExternos; }

    public String getParecer() { return parecer; }
    public void setParecer(String parecer) { this.parecer = parecer; }

    public List<RaiHabilidadeDTO> getHabilidadesDesenvolvidas() { return habilidadesDesenvolvidas; }
    public void setHabilidadesDesenvolvidas(List<RaiHabilidadeDTO> habilidadesDesenvolvidas) { this.habilidadesDesenvolvidas = habilidadesDesenvolvidas; }

    public LocalDate getDataRelatorio() { return dataRelatorio; }
    public void setDataRelatorio(LocalDate dataRelatorio) { this.dataRelatorio = dataRelatorio; }

    public String getAssinaturaDocente() { return assinaturaDocente; }
    public void setAssinaturaDocente(String assinaturaDocente) { this.assinaturaDocente = assinaturaDocente; }
}
