package com.br.CLAI.repository;

import com.br.CLAI.domain.Indicacao;
import com.br.CLAI.domain.enums.StatusIndicacao;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface IndicacaoRepository extends JpaRepository<Indicacao, UUID> {

    @EntityGraph(attributePaths = {"aluno", "solicitante", "disciplinasObservadas", "estudoDeCaso"})
    Optional<Indicacao> findDetalhadaById(UUID id);

    @EntityGraph(attributePaths = {"aluno", "solicitante", "disciplinasObservadas", "estudoDeCaso"})
    List<Indicacao> findByAlunoIdOrderByCriadoEmDesc(UUID alunoId);

    @EntityGraph(attributePaths = {"aluno", "solicitante", "disciplinasObservadas", "estudoDeCaso"})
    List<Indicacao> findByStatusOrderByCriadoEmDesc(StatusIndicacao status);

    @EntityGraph(attributePaths = {"aluno", "solicitante", "disciplinasObservadas", "estudoDeCaso"})
    List<Indicacao> findAllByOrderByCriadoEmDesc();

    boolean existsByAlunoIdAndStatusAndIdNot(UUID alunoId, StatusIndicacao status, UUID id);
}
