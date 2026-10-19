package com.br.CLAI.repository;

import com.br.CLAI.domain.PlanoAcao;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface PlanoAcaoRepository extends JpaRepository<PlanoAcao, UUID> {
    
    List<PlanoAcao> findByAcompanhamentoId(UUID acompanhamentoId);
}
