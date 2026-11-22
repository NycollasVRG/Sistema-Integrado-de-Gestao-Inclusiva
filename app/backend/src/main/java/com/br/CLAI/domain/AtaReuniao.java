package com.br.CLAI.domain;

import com.br.CLAI.domain.enums.StatusAta;
import com.br.CLAI.domain.enums.TipoReuniao;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import org.hibernate.annotations.BatchSize;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Ata de reunião pedagógica ou de alinhamento com famílias vinculada ao prontuário do estudante (US 08).
 * Suporta upload de documento assinado (cifrado via CryptoStorageService) ou coleta de assinaturas digitais (TA8.1),
 * integra a Linha do Tempo do estudante (TA8.2 / TA9.2), gera lembretes para compromissos (TA8.3)
 * e torna-se imutável após finalização, aceitando apenas Termos Aditivos explicativos (TA8.4).
 */
@Entity
@Table(name = "ata_reuniao", schema = "sigi")
public class AtaReuniao extends BaseEntity {

    @ManyToOne(optional = false)
    @JoinColumn(name = "aluno_id", nullable = false)
    private Aluno aluno;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_reuniao", nullable = false, length = 30)
    private TipoReuniao tipoReuniao;

    @Column(name = "data_reuniao", nullable = false)
    private LocalDateTime dataReuniao;

    @Column(name = "local_reuniao", length = 255)
    private String localReuniao;

    @Column(name = "pauta", nullable = false, columnDefinition = "TEXT")
    private String pauta;

    @Column(name = "deliberacoes", columnDefinition = "TEXT")
    private String deliberacoes;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private StatusAta status = StatusAta.RASCUNHO;

    @Column(name = "documento_nome_original", length = 255)
    private String documentoNomeOriginal;

    @Column(name = "documento_content_type", length = 100)
    private String documentoContentType;

    @Column(name = "documento_tamanho_bytes")
    private Long documentoTamanhoBytes;

    @Column(name = "documento_caminho", length = 500)
    private String documentoCaminho;

    @Column(name = "documento_iv", length = 64)
    private String documentoIv;

    @Column(name = "finalizada_em")
    private LocalDateTime finalizadaEm;

    @Column(name = "finalizada_por")
    private UUID finalizadaPor;

    @OneToMany(mappedBy = "ata", cascade = CascadeType.ALL, orphanRemoval = true)
    @BatchSize(size = 50)
    private List<AtaAssinatura> assinaturas = new ArrayList<>();

    @OneToMany(mappedBy = "ata", cascade = CascadeType.ALL, orphanRemoval = true)
    @BatchSize(size = 50)
    private List<AtaCompromisso> compromissos = new ArrayList<>();

    @OneToMany(mappedBy = "ata", cascade = CascadeType.ALL, orphanRemoval = true)
    @BatchSize(size = 50)
    private List<AtaTermoAditivo> termosAditivos = new ArrayList<>();

    public AtaReuniao() {
    }

    public AtaReuniao(Aluno aluno,
                      TipoReuniao tipoReuniao,
                      LocalDateTime dataReuniao,
                      String localReuniao,
                      String pauta,
                      String deliberacoes) {
        this.aluno = aluno;
        this.tipoReuniao = tipoReuniao;
        this.dataReuniao = dataReuniao;
        this.localReuniao = localReuniao;
        this.pauta = pauta;
        this.deliberacoes = deliberacoes;
        this.status = StatusAta.RASCUNHO;
    }

    public boolean possuiDocumentoAssinado() {
        return documentoCaminho != null && !documentoCaminho.isBlank()
                && documentoIv != null && !documentoIv.isBlank();
    }

    public boolean isFinalizada() {
        return status == StatusAta.FINALIZADA;
    }

    public void adicionarAssinatura(AtaAssinatura assinatura) {
        assinatura.setAta(this);
        this.assinaturas.add(assinatura);
    }

    public void adicionarCompromisso(AtaCompromisso compromisso) {
        compromisso.setAta(this);
        this.compromissos.add(compromisso);
    }

    public void adicionarTermoAditivo(AtaTermoAditivo termoAditivo) {
        termoAditivo.setAta(this);
        this.termosAditivos.add(termoAditivo);
    }

    public Aluno getAluno() {
        return aluno;
    }

    public void setAluno(Aluno aluno) {
        this.aluno = aluno;
    }

    public TipoReuniao getTipoReuniao() {
        return tipoReuniao;
    }

    public void setTipoReuniao(TipoReuniao tipoReuniao) {
        this.tipoReuniao = tipoReuniao;
    }

    public LocalDateTime getDataReuniao() {
        return dataReuniao;
    }

    public void setDataReuniao(LocalDateTime dataReuniao) {
        this.dataReuniao = dataReuniao;
    }

    public String getLocalReuniao() {
        return localReuniao;
    }

    public void setLocalReuniao(String localReuniao) {
        this.localReuniao = localReuniao;
    }

    public String getPauta() {
        return pauta;
    }

    public void setPauta(String pauta) {
        this.pauta = pauta;
    }

    public String getDeliberacoes() {
        return deliberacoes;
    }

    public void setDeliberacoes(String deliberacoes) {
        this.deliberacoes = deliberacoes;
    }

    public StatusAta getStatus() {
        return status;
    }

    public void setStatus(StatusAta status) {
        this.status = status;
    }

    public String getDocumentoNomeOriginal() {
        return documentoNomeOriginal;
    }

    public void setDocumentoNomeOriginal(String documentoNomeOriginal) {
        this.documentoNomeOriginal = documentoNomeOriginal;
    }

    public String getDocumentoContentType() {
        return documentoContentType;
    }

    public void setDocumentoContentType(String documentoContentType) {
        this.documentoContentType = documentoContentType;
    }

    public Long getDocumentoTamanhoBytes() {
        return documentoTamanhoBytes;
    }

    public void setDocumentoTamanhoBytes(Long documentoTamanhoBytes) {
        this.documentoTamanhoBytes = documentoTamanhoBytes;
    }

    public String getDocumentoCaminho() {
        return documentoCaminho;
    }

    public void setDocumentoCaminho(String documentoCaminho) {
        this.documentoCaminho = documentoCaminho;
    }

    public String getDocumentoIv() {
        return documentoIv;
    }

    public void setDocumentoIv(String documentoIv) {
        this.documentoIv = documentoIv;
    }

    public LocalDateTime getFinalizadaEm() {
        return finalizadaEm;
    }

    public void setFinalizadaEm(LocalDateTime finalizadaEm) {
        this.finalizadaEm = finalizadaEm;
    }

    public UUID getFinalizadaPor() {
        return finalizadaPor;
    }

    public void setFinalizadaPor(UUID finalizadaPor) {
        this.finalizadaPor = finalizadaPor;
    }

    public List<AtaAssinatura> getAssinaturas() {
        return assinaturas;
    }

    public void setAssinaturas(List<AtaAssinatura> assinaturas) {
        this.assinaturas = assinaturas != null ? assinaturas : new ArrayList<>();
    }

    public List<AtaCompromisso> getCompromissos() {
        return compromissos;
    }

    public void setCompromissos(List<AtaCompromisso> compromissos) {
        this.compromissos = compromissos != null ? compromissos : new ArrayList<>();
    }

    public List<AtaTermoAditivo> getTermosAditivos() {
        return termosAditivos;
    }

    public void setTermosAditivos(List<AtaTermoAditivo> termosAditivos) {
        this.termosAditivos = termosAditivos != null ? termosAditivos : new ArrayList<>();
    }
}
