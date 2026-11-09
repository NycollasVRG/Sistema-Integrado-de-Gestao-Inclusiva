package com.br.CLAI.domain;

import com.br.CLAI.domain.enums.TipoClassificacaoAnexo;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "anexo_estudante", schema = "sigi")
public class AnexoEstudante extends BaseEntity {

    @ManyToOne
    @JoinColumn(name = "aluno_id", nullable = false)
    private Aluno aluno;

    @Column(name = "nome_original", nullable = false, length = 255)
    private String nomeOriginal;

    @Column(name = "content_type", nullable = false, length = 100)
    private String contentType;

    @Column(name = "tamanho_bytes", nullable = false)
    private Long tamanhoBytes;

    @Enumerated(EnumType.STRING)
    @Column(name = "classificacao", nullable = false, length = 50)
    private TipoClassificacaoAnexo classificacao;

    @Column(name = "criptografado", nullable = false)
    private Boolean criptografado = false;

    @Column(name = "caminho_armazenamento", nullable = false, length = 500)
    private String caminhoArmazenamento;

    @Column(name = "iv", length = 64)
    private String iv;

    public AnexoEstudante() {
    }

    public AnexoEstudante(
            Aluno aluno,
            String nomeOriginal,
            String contentType,
            Long tamanhoBytes,
            TipoClassificacaoAnexo classificacao,
            Boolean criptografado,
            String caminhoArmazenamento,
            String iv
    ) {
        this.aluno = aluno;
        this.nomeOriginal = nomeOriginal;
        this.contentType = contentType;
        this.tamanhoBytes = tamanhoBytes;
        this.classificacao = classificacao;
        this.criptografado = criptografado != null ? criptografado : false;
        this.caminhoArmazenamento = caminhoArmazenamento;
        this.iv = iv;
    }

    public Aluno getAluno() {
        return aluno;
    }

    public void setAluno(Aluno aluno) {
        this.aluno = aluno;
    }

    public String getNomeOriginal() {
        return nomeOriginal;
    }

    public void setNomeOriginal(String nomeOriginal) {
        this.nomeOriginal = nomeOriginal;
    }

    public String getContentType() {
        return contentType;
    }

    public void setContentType(String contentType) {
        this.contentType = contentType;
    }

    public Long getTamanhoBytes() {
        return tamanhoBytes;
    }

    public void setTamanhoBytes(Long tamanhoBytes) {
        this.tamanhoBytes = tamanhoBytes;
    }

    public TipoClassificacaoAnexo getClassificacao() {
        return classificacao;
    }

    public void setClassificacao(TipoClassificacaoAnexo classificacao) {
        this.classificacao = classificacao;
    }

    public Boolean getCriptografado() {
        return criptografado;
    }

    public void setCriptografado(Boolean criptografado) {
        this.criptografado = criptografado;
    }

    public boolean isCriptografado() {
        return Boolean.TRUE.equals(this.criptografado);
    }

    public String getCaminhoArmazenamento() {
        return caminhoArmazenamento;
    }

    public void setCaminhoArmazenamento(String caminhoArmazenamento) {
        this.caminhoArmazenamento = caminhoArmazenamento;
    }

    public String getIv() {
        return iv;
    }

    public void setIv(String iv) {
        this.iv = iv;
    }
}
