package com.br.CLAI.repository;

import com.br.CLAI.domain.EstudoDeCaso;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface EstudoDeCasoRepository extends JpaRepository<EstudoDeCaso, UUID> {
    
    List<EstudoDeCaso> findByAlunoId(UUID alunoId);

    boolean existsByAlunoIdAndStatus(UUID alunoId, com.br.CLAI.domain.enums.StatusEstudoCaso status);

    boolean existsByAlunoIdAndStatusAndIdNot(UUID alunoId, com.br.CLAI.domain.enums.StatusEstudoCaso status, UUID id);
}
