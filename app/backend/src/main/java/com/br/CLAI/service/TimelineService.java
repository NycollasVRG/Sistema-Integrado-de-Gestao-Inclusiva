package com.br.CLAI.service;

import com.br.CLAI.domain.Atendimento;
import com.br.CLAI.domain.EstudoDeCaso;
import com.br.CLAI.domain.Pea;
import com.br.CLAI.domain.Pei;
import com.br.CLAI.domain.Rai;
import com.br.CLAI.domain.enums.TipoRelatorio;
import com.br.CLAI.dto.response.TimelineEventDTO;
import com.br.CLAI.repository.AtendimentoRepository;
import com.br.CLAI.repository.EstudoDeCasoRepository;
import com.br.CLAI.repository.PeaRepository;
import com.br.CLAI.repository.PeiRepository;
import com.br.CLAI.repository.RaiRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class TimelineService {

    private final EstudoDeCasoRepository estudoDeCasoRepository;
    private final PeiRepository peiRepository;
    private final PeaRepository peaRepository;
    private final AtendimentoRepository atendimentoRepository;
    private final RaiRepository raiRepository;

    /**
     * Construtor mantido para os testes existentes que agregavam apenas quatro fontes.
     */
    public TimelineService(
            EstudoDeCasoRepository estudoDeCasoRepository,
            PeiRepository peiRepository,
            PeaRepository peaRepository,
            AtendimentoRepository atendimentoRepository) {
        this(estudoDeCasoRepository, peiRepository, peaRepository, atendimentoRepository, null);
    }

    @Autowired
    public TimelineService(
            EstudoDeCasoRepository estudoDeCasoRepository,
            PeiRepository peiRepository,
            PeaRepository peaRepository,
            AtendimentoRepository atendimentoRepository,
            RaiRepository raiRepository) {

        this.estudoDeCasoRepository = estudoDeCasoRepository;
        this.peiRepository = peiRepository;
        this.peaRepository = peaRepository;
        this.atendimentoRepository = atendimentoRepository;
        this.raiRepository = raiRepository;
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

        List<Atendimento> atendimentos =
                atendimentoRepository.findByAlunoId(alunoId);

        for (Atendimento atendimento : atendimentos) {
            eventos.add(
                    new TimelineEventDTO(
                            atendimento.getId(),
                            "ATENDIMENTO",
                            atendimento.getCriadoEm()
                    )
            );
        }

        // TA9.2 / TA9.3: relatórios emitidos (RAI/RAE) também compõem a linha do tempo.
        if (raiRepository != null) {
            List<Rai> rais = raiRepository.findByAlunoId(alunoId);
            for (Rai rai : rais) {
                TipoRelatorio tipo = rai.getTipoRelatorio() != null
                        ? rai.getTipoRelatorio()
                        : TipoRelatorio.RAI;
                eventos.add(
                        new TimelineEventDTO(
                                rai.getId(),
                                tipo.name(),
                                rai.getCriadoEm()
                        )
                );
            }
        }

        return OrdenacaoAuditoria.ordenarEventosTimeline(eventos);
    }
}
