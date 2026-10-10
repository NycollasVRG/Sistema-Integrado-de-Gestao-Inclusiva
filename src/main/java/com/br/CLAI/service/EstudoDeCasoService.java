package com.br.CLAI.service;

import com.br.CLAI.domain.Aluno;
import com.br.CLAI.domain.EstudoDeCaso;
import com.br.CLAI.domain.IndicadorReutilizavel;
import com.br.CLAI.domain.enums.StatusEstudoCaso;
import com.br.CLAI.dto.request.EstudoDeCasoRequestDTO;
import com.br.CLAI.dto.response.EstudoDeCasoResponseDTO;
import com.br.CLAI.exception.RegraDeNegocioException;
import com.br.CLAI.mapper.EstudoDeCasoMapper;
import com.br.CLAI.repository.AlunoRepository;
import com.br.CLAI.repository.EstudoDeCasoRepository;
import com.br.CLAI.repository.IndicadorReutilizavelRepository;
import com.br.CLAI.service.validator.EstudoDeCasoValidator;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class EstudoDeCasoService {

    private final EstudoDeCasoRepository repository;
    private final AlunoRepository alunoRepository;
    private final IndicadorReutilizavelRepository indicadorRepository;
    private final EstudoDeCasoValidator validator;
    private final EstudoDeCasoMapper mapper;

    public EstudoDeCasoService(EstudoDeCasoRepository repository, 
                               AlunoRepository alunoRepository,
                               IndicadorReutilizavelRepository indicadorRepository,
                               EstudoDeCasoValidator validator, 
                               EstudoDeCasoMapper mapper) {
        this.repository = repository;
        this.alunoRepository = alunoRepository;
        this.indicadorRepository = indicadorRepository;
        this.validator = validator;
        this.mapper = mapper;
    }

    @Transactional
    public EstudoDeCasoResponseDTO criar(EstudoDeCasoRequestDTO dto, UUID usuarioId) {

        validator.validarConclusao(dto);

        if (repository.existsByAlunoIdAndStatus(dto.getAlunoId(), StatusEstudoCaso.ATIVO)) {
            throw new RegraDeNegocioException("Já existe um Estudo de Caso ATIVO para este aluno.");
        }

        Aluno aluno = alunoRepository.findById(dto.getAlunoId())
                .orElseThrow(() -> new RegraDeNegocioException("Aluno não encontrado."));

        EstudoDeCaso entidade = new EstudoDeCaso();
        entidade.setAluno(aluno);
        entidade.setStatus(dto.getStatus());
        entidade.setDiagnosticoInicial(dto.getDiagnosticoInicial());

        if (dto.getIndicadoresIds() != null && !dto.getIndicadoresIds().isEmpty()) {
            List<IndicadorReutilizavel> indicadores = indicadorRepository.findAllById(dto.getIndicadoresIds());
            if (indicadores.size() != dto.getIndicadoresIds().size()) {
                throw new RegraDeNegocioException("Um ou mais Indicadores informados não foram encontrados.");
            }
            entidade.setIndicadores(indicadores);
        }

        entidade.setCriadoPor(usuarioId);
        entidade.setAtualizadoPor(usuarioId);

        EstudoDeCaso salvo = repository.save(entidade);
        return mapper.toResponse(salvo);
    }
}
