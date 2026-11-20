package com.br.CLAI.repository;

import com.br.CLAI.domain.AnexoEstudante;
import com.br.CLAI.domain.enums.TipoClassificacaoAnexo;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AnexoEstudanteRepository extends JpaRepository<AnexoEstudante, UUID> {

    @Override
    @EntityGraph(attributePaths = {"aluno", "rolesPermitidas"})
    Optional<AnexoEstudante> findById(UUID id);

    @EntityGraph(attributePaths = {"aluno", "rolesPermitidas"})
    List<AnexoEstudante> findByAlunoIdOrderByCriadoEmDesc(UUID alunoId);

    @EntityGraph(attributePaths = {"aluno", "rolesPermitidas"})
    List<AnexoEstudante> findByAlunoIdAndClassificacaoOrderByCriadoEmDesc(
            UUID alunoId,
            TipoClassificacaoAnexo classificacao
    );
}
