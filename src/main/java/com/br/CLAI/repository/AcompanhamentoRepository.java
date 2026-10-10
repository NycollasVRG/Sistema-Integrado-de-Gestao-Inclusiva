package com.br.CLAI.repository;

import com.br.CLAI.domain.Acompanhamento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AcompanhamentoRepository extends JpaRepository<Acompanhamento, UUID> {
    
    List<Acompanhamento> findByAlunoId(UUID alunoId);
}
