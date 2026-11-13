package com.br.CLAI.repository;

import com.br.CLAI.domain.PlanoAcao;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PlanoAcaoRepository extends JpaRepository<PlanoAcao, UUID> {

    @Override
    @EntityGraph(attributePaths = {"acompanhamento", "acompanhamento.aluno"})
    List<PlanoAcao> findAll();

    @Override
    @EntityGraph(attributePaths = {"acompanhamento", "acompanhamento.aluno"})
    Optional<PlanoAcao> findById(UUID id);

    @EntityGraph(attributePaths = {"acompanhamento", "acompanhamento.aluno"})
    List<PlanoAcao> findByAcompanhamentoId(UUID acompanhamentoId);

    @EntityGraph(attributePaths = {"acompanhamento", "acompanhamento.aluno"})
    List<PlanoAcao> findByAcompanhamento_Aluno_Id(UUID alunoId);
}
