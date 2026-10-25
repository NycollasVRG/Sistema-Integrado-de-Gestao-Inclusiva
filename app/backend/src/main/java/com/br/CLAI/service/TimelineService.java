package com.br.CLAI.service;

import com.br.CLAI.domain.EstudoDeCaso;
import com.br.CLAI.domain.Pea;
import com.br.CLAI.domain.Pei;
import com.br.CLAI.dto.response.TimelineEventDTO;
import com.br.CLAI.repository.EstudoDeCasoRepository;
import com.br.CLAI.repository.PeaRepository;
import com.br.CLAI.repository.PeiRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

@Service
public class TimelineService {

    private final EstudoDeCasoRepository estudoDeCasoRepository;
    private final PeiRepository peiRepository;
    private final PeaRepository peaRepository;

    public TimelineService(
            EstudoDeCasoRepository estudoDeCasoRepository,
            PeiRepository peiRepository,
            PeaRepository peaRepository) {

        this.estudoDeCasoRepository = estudoDeCasoRepository;
        this.peiRepository = peiRepository;
        this.peaRepository = peaRepository;
    }

    @Transactional(readOnly = true)
    public List<TimelineEventDTO> buscarPorAluno(UUID alunoId) {

        List<TimelineEventDTO> eventos = new ArrayList<>();

        List<EstudoDeCaso> estudos =
                estudoDeCasoRepository.findByAlunoId(alunoId);

        for (EstudoDeCaso estudo : estudos) {
            eventos.add(
                    new TimelineEventDTO(
                            estudo.getId(),
                            "ESTUDO_DE_CASO",
                            estudo.getCriadoEm()
                    )
            );
        }

        List<Pei> peis =
                peiRepository.findByAcompanhamento_Aluno_Id(alunoId);

        for (Pei pei : peis) {
            eventos.add(
                    new TimelineEventDTO(
                            pei.getId(),
                            "PEI",
                            pei.getCriadoEm()
                    )
            );
        }

        List<Pea> peas =
                peaRepository.findByAcompanhamento_Aluno_Id(alunoId);

        for (Pea pea : peas) {
            eventos.add(
                    new TimelineEventDTO(
                            pea.getId(),
                            "PEA",
                            pea.getCriadoEm()
                    )
            );
        }

        eventos.sort(
                Comparator
                        .comparing(TimelineEventDTO::dataCriacao)
                        .thenComparing(TimelineEventDTO::id)
        );

        return eventos;
    }
}
