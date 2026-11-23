package com.br.CLAI.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PreRemove;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import org.hibernate.annotations.Immutable;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Registro imutável de trilha de auditoria (US 06 - TA6.1 / TA6.3).
 * <p>
 * Intencionalmente NÃO estende {@link BaseEntity} e NÃO utiliza {@code @SoftDelete},
 * garantindo natureza append-only sem deleção lógica ou física.
 */
@Entity
@Immutable
@Table(name = "audit_log", schema = "sigi")
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Column(name = "usuario_id", updatable = false)
    private UUID usuarioId;

    @Column(name = "acao", nullable = false, length = 100, updatable = false)
    private String acao;

    @Column(name = "entidade", nullable = false, length = 100, updatable = false)
    private String entidade;

    @Column(name = "entidade_id", updatable = false)
    private UUID entidadeId;

    @Column(name = "endpoint", nullable = false, length = 500, updatable = false)
    private String endpoint;

    @Column(name = "metodo_http", nullable = false, length = 20, updatable = false)
    private String metodoHttp;

    @Column(name = "detalhes", columnDefinition = "TEXT", updatable = false)
    private String detalhes;

    @Column(name = "timestamp", nullable = false, updatable = false)
    private LocalDateTime timestamp;

    protected AuditLog() {
    }

    public AuditLog(
            UUID usuarioId,
            String acao,
            String entidade,
            UUID entidadeId,
            String endpoint,
            String metodoHttp,
            String detalhes,
            LocalDateTime timestamp
    ) {
        this.usuarioId = usuarioId;
        this.acao = acao;
        this.entidade = entidade;
        this.entidadeId = entidadeId;
        this.endpoint = endpoint;
        this.metodoHttp = metodoHttp;
        this.detalhes = detalhes;
        this.timestamp = timestamp != null ? timestamp : LocalDateTime.now();
    }

    @PreUpdate
    void impedirAtualizacao() {
        throw new UnsupportedOperationException(
                "Registros da tabela sigi.audit_log são estritamente imutáveis e não permitem alteração (TA6.3)."
        );
    }

    @PreRemove
    void impedirExclusao() {
        throw new UnsupportedOperationException(
                "Registros da tabela sigi.audit_log são estritamente imutáveis e não permitem deleção (TA6.3)."
        );
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getUsuarioId() {
        return usuarioId;
    }

    public String getAcao() {
        return acao;
    }

    public String getEntidade() {
        return entidade;
    }

    public UUID getEntidadeId() {
        return entidadeId;
    }

    public String getEndpoint() {
        return endpoint;
    }

    public String getMetodoHttp() {
        return metodoHttp;
    }

    public String getDetalhes() {
        return detalhes;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }
}
