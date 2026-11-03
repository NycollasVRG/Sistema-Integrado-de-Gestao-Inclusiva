package com.br.CLAI.repository;

import com.br.CLAI.domain.AnexoEstudante;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AnexoEstudanteRepository extends JpaRepository<AnexoEstudante, UUID> {

    @Override
    @EntityGraph(attributePaths = {"aluno"})
    Optional<AnexoEstudante> findById(UUID id);

    @EntityGraph(attributePaths = {"aluno"})
    List<AnexoEstudante> findByAlunoIdOrderByCriadoEmDesc(UUID alunoId);
}
