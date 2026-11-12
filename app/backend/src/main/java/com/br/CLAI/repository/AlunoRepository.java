package com.br.CLAI.repository;

import com.br.CLAI.domain.Aluno;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface AlunoRepository extends JpaRepository<Aluno, UUID> {

    @Override
    @EntityGraph(attributePaths = {"tagsDificuldade"})
    Optional<Aluno> findById(UUID id);

    @EntityGraph(attributePaths = {"tagsDificuldade"})
    Optional<Aluno> findByMatricula(String matricula);

    boolean existsByMatricula(String matricula);

    boolean existsByMatriculaAndIdNot(String matricula, UUID id);

    /**
     * Listagem paginada com filtros combinados (AND) e busca incremental em todos os filtros textuais.
     * Filtro vazio ("") = ignorado. O service envia os parâmetros em minúsculo, sem acentos,
     * com curingas escapados ('!') e nunca null (null em String quebra funções de texto no PostgreSQL).
     */
    @Query("""
            SELECT a FROM Aluno a
            WHERE a.ativo = :ativo
              AND (:termo = '' OR LOWER(FUNCTION('translate', a.nomeCompleto,
                                    'ÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇÑÝŸáàâãäéèêëíìîïóòôõöúùûüçñýÿ',
                                    'aaaaaeeeeiiiiooooouuuucnyyaaaaaeeeeiiiiooooouuuucnyy')) LIKE CONCAT('%', :termo, '%') ESCAPE '!'
                               OR LOWER(FUNCTION('translate', a.matricula,
                                    'ÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇÑÝŸáàâãäéèêëíìîïóòôõöúùûüçñýÿ',
                                    'aaaaaeeeeiiiiooooouuuucnyyaaaaaeeeeiiiiooooouuuucnyy')) LIKE CONCAT('%', :termo, '%') ESCAPE '!')
              AND (:curso = '' OR LOWER(FUNCTION('translate', a.curso,
                                    'ÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇÑÝŸáàâãäéèêëíìîïóòôõöúùûüçñýÿ',
                                    'aaaaaeeeeiiiiooooouuuucnyyaaaaaeeeeiiiiooooouuuucnyy')) LIKE CONCAT('%', :curso, '%') ESCAPE '!')
              AND (:turma = '' OR LOWER(FUNCTION('translate', a.turma,
                                    'ÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇÑÝŸáàâãäéèêëíìîïóòôõöúùûüçñýÿ',
                                    'aaaaaeeeeiiiiooooouuuucnyyaaaaaeeeeiiiiooooouuuucnyy')) LIKE CONCAT('%', :turma, '%') ESCAPE '!')
              AND (:tag = '' OR EXISTS (
                    SELECT 1 FROM Aluno a2
                    JOIN a2.tagsDificuldade t
                    WHERE a2.id = a.id
                      AND LOWER(FUNCTION('translate', t.nome,
                            'ÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇÑÝŸáàâãäéèêëíìîïóòôõöúùûüçñýÿ',
                            'aaaaaeeeeiiiiooooouuuucnyyaaaaaeeeeiiiiooooouuuucnyy')) LIKE CONCAT('%', :tag, '%') ESCAPE '!'))
            """)
    Page<Aluno> buscarComFiltros(@Param("termo") String termo,
                                 @Param("curso") String curso,
                                 @Param("turma") String turma,
                                 @Param("tag") String tag,
                                 @Param("ativo") Boolean ativo,
                                 Pageable pageable);
}
