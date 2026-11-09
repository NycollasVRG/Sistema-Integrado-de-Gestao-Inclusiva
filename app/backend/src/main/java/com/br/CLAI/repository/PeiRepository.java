package com.br.CLAI.repository;

import com.br.CLAI.domain.Pei;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PeiRepository extends JpaRepository<Pei, UUID> {

    @Override
    @EntityGraph(attributePaths = {"acompanhamento", "acompanhamento.aluno"})
    List<Pei> findAll();

    @Override
    @EntityGraph(attributePaths = {"acompanhamento", "acompanhamento.aluno"})
    Optional<Pei> findById(UUID id);

    @EntityGraph(attributePaths = {"acompanhamento", "acompanhamento.aluno"})
    List<Pei> findByAcompanhamentoId(UUID acompanhamentoId);

    @EntityGraph(attributePaths = {"acompanhamento", "acompanhamento.aluno"})
    List<Pei> findByAcompanhamento_Aluno_Id(UUID alunoId);
}
