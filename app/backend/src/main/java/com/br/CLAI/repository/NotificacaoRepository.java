package com.br.CLAI.repository;

import com.br.CLAI.domain.Notificacao;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface NotificacaoRepository extends JpaRepository<Notificacao, UUID> {

    @Query("""
            SELECT n FROM Notificacao n
            WHERE n.perfilDestinatario = :perfilDestinatario
              AND n.usuarioDestinatarioId IS NULL
              AND n.lida = FALSE
            ORDER BY n.criadoEm DESC
            """)
    List<Notificacao> findByPerfilDestinatarioAndLidaFalseOrderByCriadoEmDesc(
            @Param("perfilDestinatario") String perfilDestinatario
    );

    @Query("""
            SELECT n FROM Notificacao n
            WHERE n.perfilDestinatario = :perfilDestinatario
              AND n.usuarioDestinatarioId IS NULL
            ORDER BY n.criadoEm DESC
            """)
    List<Notificacao> findByPerfilDestinatarioOrderByCriadoEmDesc(
            @Param("perfilDestinatario") String perfilDestinatario
    );

    @Query("""
            SELECT COUNT(n) FROM Notificacao n
            WHERE n.perfilDestinatario = :perfilDestinatario
              AND n.usuarioDestinatarioId IS NULL
              AND n.lida = FALSE
            """)
    long countByPerfilDestinatarioAndLidaFalse(
            @Param("perfilDestinatario") String perfilDestinatario
    );

    List<Notificacao> findByUsuarioDestinatarioIdOrderByCriadoEmDesc(UUID usuarioDestinatarioId);

    List<Notificacao> findByUsuarioDestinatarioIdAndLidaFalseOrderByCriadoEmDesc(UUID usuarioDestinatarioId);
}
