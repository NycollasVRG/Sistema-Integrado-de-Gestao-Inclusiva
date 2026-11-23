package com.br.CLAI.repository;

import com.br.CLAI.domain.AlertaPedagogico;
import com.br.CLAI.domain.enums.SeveridadeAlerta;
import com.br.CLAI.domain.enums.TipoAlertaPedagogico;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AlertaPedagogicoRepository extends JpaRepository<AlertaPedagogico, UUID> {

    @Override
    @EntityGraph(attributePaths = {"aluno"})
    Optional<AlertaPedagogico> findById(UUID id);

    @EntityGraph(attributePaths = {"aluno"})
    List<AlertaPedagogico> findByAluno_IdOrderByCriadoEmDesc(UUID alunoId);

    boolean existsByAluno_IdAndTipoAlertaAndDescricaoAndTratadoFalse(
            UUID alunoId,
            TipoAlertaPedagogico tipoAlerta,
            String descricao
    );

    /**
     * Listagem com filtros combinados (AND) para o Dashboard da CLAI (TA5.3 e TA5.4).
     * Filtros textuais vazios ("") são ignorados. O service normaliza em minúsculo, sem acentos,
     * com curingas escapados ('!') e nunca null (compatível com PostgreSQL e H2).
     */
    @EntityGraph(attributePaths = {"aluno"})
    @Query("""
            SELECT a FROM AlertaPedagogico a
            WHERE (:tratado IS NULL OR a.tratado = :tratado)
              AND (:severidade IS NULL OR a.severidade = :severidade)
              AND (:alunoId IS NULL OR a.aluno.id = :alunoId)
              AND (:unidade = '' OR (a.unidade IS NOT NULL AND LOWER(FUNCTION('translate', a.unidade,
                    'ÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇÑÝŸáàâãäéèêëíìîïóòôõöúùûüçñýÿ',
                    'aaaaaeeeeiiiiooooouuuucnyyaaaaaeeeeiiiiooooouuuucnyy')) LIKE CONCAT('%', :unidade, '%') ESCAPE '!'))
              AND (:curso = '' OR (a.curso IS NOT NULL AND LOWER(FUNCTION('translate', a.curso,
                    'ÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇÑÝŸáàâãäéèêëíìîïóòôõöúùûüçñýÿ',
                    'aaaaaeeeeiiiiooooouuuucnyyaaaaaeeeeiiiiooooouuuucnyy')) LIKE CONCAT('%', :curso, '%') ESCAPE '!'))
              AND (:turma = '' OR (a.turma IS NOT NULL AND LOWER(FUNCTION('translate', a.turma,
                    'ÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇÑÝŸáàâãäéèêëíìîïóòôõöúùûüçñýÿ',
                    'aaaaaeeeeiiiiooooouuuucnyyaaaaaeeeeiiiiooooouuuucnyy')) LIKE CONCAT('%', :turma, '%') ESCAPE '!'))
            ORDER BY a.criadoEm DESC, a.id DESC
            """)
    List<AlertaPedagogico> buscarComFiltros(
            @Param("unidade") String unidade,
            @Param("curso") String curso,
            @Param("turma") String turma,
            @Param("tratado") Boolean tratado,
            @Param("severidade") SeveridadeAlerta severidade,
            @Param("alunoId") UUID alunoId
    );
}
