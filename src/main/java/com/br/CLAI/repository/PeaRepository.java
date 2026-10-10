package com.br.CLAI.repository;

import com.br.CLAI.domain.Pea;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface PeaRepository extends JpaRepository<Pea, UUID> {
    
    List<Pea> findByAcompanhamentoId(UUID acompanhamentoId);
}
