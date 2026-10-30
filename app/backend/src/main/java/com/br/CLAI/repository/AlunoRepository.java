package com.br.CLAI.repository;

import com.br.CLAI.domain.Aluno;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface AlunoRepository extends JpaRepository<Aluno, UUID> {

    Optional<Aluno> findByMatricula(String matricula);

    boolean existsByMatricula(String matricula);

    boolean existsByMatriculaAndIdNot(String matricula, UUID id);

    /**
     * Listagem paginada com filtros combinados (AND).
     * Filtro vazio ("") = ignorado. O service sempre envia os textos em minúsculo e nunca null
     * (null em parâmetro String quebra o LOWER/LIKE no PostgreSQL).
     */
    @Query("""
            SELECT a FROM Aluno a
            WHERE a.ativo = :ativo
              AND (:termo = '' OR LOWER(a.nomeCompleto) LIKE CONCAT('%', :termo, '%')
                               OR LOWER(a.matricula) LIKE CONCAT('%', :termo, '%'))
              AND (:curso = '' OR LOWER(a.curso) = :curso)
              AND (:turma = '' OR LOWER(a.turma) = :turma)
              AND (:tag = '' OR EXISTS (
                    SELECT t.id FROM a.tagsDificuldade t WHERE LOWER(t.nome) = :tag))
            """)
    Page<Aluno> buscarComFiltros(@Param("termo") String termo,
                                 @Param("curso") String curso,
                                 @Param("turma") String turma,
                                 @Param("tag") String tag,
                                 @Param("ativo") Boolean ativo,
                                 Pageable pageable);
}
