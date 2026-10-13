package com.br.CLAI.repository;

import com.br.CLAI.domain.Pei;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface PeiRepository extends JpaRepository<Pei, UUID> {
    
    List<Pei> findByAcompanhamentoId(UUID acompanhamentoId);
}
