package com.br.CLAI.repository;

import com.br.CLAI.domain.Aluno;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface AlunoRepository extends JpaRepository<Aluno, UUID>, JpaSpecificationExecutor<Aluno> {

    Optional<Aluno> findByMatricula(String matricula);

    boolean existsByMatricula(String matricula);

    boolean existsByMatriculaAndIdNot(String matricula, UUID id);
}
