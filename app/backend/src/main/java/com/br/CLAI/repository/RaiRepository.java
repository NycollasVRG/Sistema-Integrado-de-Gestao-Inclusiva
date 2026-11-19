package com.br.CLAI.repository;

import com.br.CLAI.domain.Rai;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface RaiRepository extends JpaRepository<Rai, UUID> {

    List<Rai> findByAlunoId(UUID alunoId);

    List<Rai> findByAlunoIdOrderByCriadoEmAsc(UUID alunoId);
}
