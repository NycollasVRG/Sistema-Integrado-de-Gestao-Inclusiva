package com.br.CLAI.repository;

import com.br.CLAI.domain.AuditLog;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repositório estritamente append-only para {@link AuditLog} (US 06 / TA6.3).
 * Estende {@link Repository} em vez de {@code JpaRepository}/{@code CrudRepository}
 * para NÃO expor nenhum método de deleção ({@code delete}, {@code deleteById}, {@code deleteAll}).
 */
@org.springframework.stereotype.Repository
public interface AuditLogRepository extends Repository<AuditLog, UUID> {

    AuditLog save(AuditLog auditLog);

    Optional<AuditLog> findById(UUID id);

    List<AuditLog> findAll();

    List<AuditLog> findAllByOrderByTimestampDesc();

    List<AuditLog> findByUsuarioIdOrderByTimestampDesc(UUID usuarioId);

    List<AuditLog> findByEntidadeIdInOrderByTimestampDesc(Collection<UUID> entidadeIds);

    @Query("""
            SELECT a FROM AuditLog a
            WHERE a.entidadeId IN :entidadeIds
               OR LOWER(a.endpoint) LIKE LOWER(CONCAT('%', :alunoIdTexto, '%'))
               OR LOWER(COALESCE(a.detalhes, '')) LIKE LOWER(CONCAT('%', :alunoIdTexto, '%'))
            ORDER BY a.timestamp DESC
            """)
    List<AuditLog> buscarRelacionadosAoEstudante(
            @Param("entidadeIds") Collection<UUID> entidadeIds,
            @Param("alunoIdTexto") String alunoIdTexto
    );

    long count();
}
