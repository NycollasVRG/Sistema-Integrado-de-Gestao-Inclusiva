package com.br.CLAI.repository;

import com.br.CLAI.domain.EstudoDeCaso;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface EstudoDeCasoRepository extends JpaRepository<EstudoDeCaso, UUID> {

    @Override
    @EntityGraph(attributePaths = {"indicadores", "aluno"})
    Optional<EstudoDeCaso> findById(UUID id);

    @EntityGraph(attributePaths = {"indicadores", "aluno"})
    List<EstudoDeCaso> findByAlunoId(UUID alunoId);

    boolean existsByAlunoIdAndStatus(UUID alunoId, com.br.CLAI.domain.enums.StatusEstudoCaso status);

    boolean existsByAlunoIdAndStatusAndIdNot(UUID alunoId, com.br.CLAI.domain.enums.StatusEstudoCaso status, UUID id);
}
