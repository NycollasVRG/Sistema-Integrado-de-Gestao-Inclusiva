package com.br.CLAI.repository;

import com.br.CLAI.domain.Pea;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PeaRepository extends JpaRepository<Pea, UUID> {

    @Override
    @EntityGraph(attributePaths = {"acompanhamento", "acompanhamento.aluno"})
    List<Pea> findAll();

    @Override
    @EntityGraph(attributePaths = {"acompanhamento", "acompanhamento.aluno"})
    Optional<Pea> findById(UUID id);

    @EntityGraph(attributePaths = {"acompanhamento", "acompanhamento.aluno"})
    List<Pea> findByAcompanhamentoId(UUID acompanhamentoId);

    @EntityGraph(attributePaths = {"acompanhamento", "acompanhamento.aluno"})
    List<Pea> findByAcompanhamento_Aluno_Id(UUID alunoId);
}