package com.br.CLAI.repository;

import com.br.CLAI.domain.AtaReuniao;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AtaReuniaoRepository extends JpaRepository<AtaReuniao, UUID> {

    @Override
    @EntityGraph(attributePaths = {"aluno"})
    Optional<AtaReuniao> findById(UUID id);

    @EntityGraph(attributePaths = {"aluno"})
    List<AtaReuniao> findByAlunoId(UUID alunoId);
}
