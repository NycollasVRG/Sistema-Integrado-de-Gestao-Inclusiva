package com.br.CLAI.repository;

import com.br.CLAI.domain.Atendimento;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AtendimentoRepository extends JpaRepository<Atendimento, UUID> {

    @Override
    @EntityGraph(attributePaths = {"aluno"})
    Optional<Atendimento> findById(UUID id);

    @EntityGraph(attributePaths = {"aluno"})
    List<Atendimento> findByAlunoId(UUID alunoId);
}
