package com.br.CLAI.service;

import com.br.CLAI.domain.AtaCompromisso;
import com.br.CLAI.domain.AtaReuniao;
import com.br.CLAI.domain.Usuario;
import com.br.CLAI.repository.AtaCompromissoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.List;

/**
 * Serviço responsável por gerar notificações automáticas de lembrete aos responsáveis designados
 * pelos compromissos acordados em atas FINALIZADAS próximos do vencimento ou vencidos (TA8.3).
 */
@Service
public class AtaCompromissoLembreteService {

    private static final DateTimeFormatter FORMATO_DATA = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private final AtaCompromissoRepository compromissoRepository;
    private final NotificacaoService notificacaoService;
    private final Clock clock;
    private final int antecedenciaDias;

    @Autowired
    public AtaCompromissoLembreteService(
            AtaCompromissoRepository compromissoRepository,
            NotificacaoService notificacaoService,
            Clock clock,
            @Value("${sigi.atas.lembrete.antecedencia-dias:3}") int antecedenciaDias) {
        this.compromissoRepository = compromissoRepository;
        this.notificacaoService = notificacaoService;
        this.clock = clock;
        this.antecedenciaDias = Math.max(0, antecedenciaDias);
    }

    /**
     * Varre compromissos pendentes de atas FINALIZADAS cujo prazo está dentro da janela de antecedência
     * (ou já vencido) e que ainda não receberam lembrete, criando uma notificação individual para o
     * usuário responsável e registrando {@code lembreteEnviadoEm} para evitar duplicidade.
     *
     * @return quantidade de lembretes gerados nesta execução.
     */
    @Transactional
    public int enviarLembretes() {
        LocalDate hoje = LocalDate.now(clock);
        LocalDate limite = hoje.plusDays(antecedenciaDias);
        LocalDateTime agora = LocalDateTime.now(clock);

        List<AtaCompromisso> pendentes = compromissoRepository.buscarPendentesParaLembrete(limite);
        int enviados = 0;

        for (AtaCompromisso compromisso : pendentes) {
            Usuario responsavel = compromisso.getResponsavel();
            AtaReuniao ata = compromisso.getAta();
            if (responsavel == null || responsavel.getId() == null || ata == null || ata.getId() == null) {
                continue;
            }

            String perfilResponsavel = responsavel.getRole() != null
                    ? responsavel.getRole().name()
                    : "CLAI_PSICOPEDAGOGO";

            String titulo = construirTitulo(compromisso.getPrazo(), hoje);
            String mensagem = construirMensagem(compromisso, hoje);
            String linkReferencia = "/api/atas/" + ata.getId();

            notificacaoService.criarNotificacaoParaUsuario(
                    responsavel.getId(),
                    perfilResponsavel,
                    titulo,
                    mensagem,
                    linkReferencia
            );

            compromisso.setLembreteEnviadoEm(agora);
            compromissoRepository.save(compromisso);
            enviados++;
        }

        return enviados;
    }

    private String construirTitulo(LocalDate prazo, LocalDate hoje) {
        if (prazo.isBefore(hoje)) {
            return "Compromisso de Ata vencido";
        }
        if (prazo.isEqual(hoje)) {
            return "Compromisso de Ata vence hoje";
        }
        return "Lembrete de compromisso de Ata próximo do prazo";
    }

    private String construirMensagem(AtaCompromisso compromisso, LocalDate hoje) {
        LocalDate prazo = compromisso.getPrazo();
        String dataFormatada = prazo.format(FORMATO_DATA);
        String nomeAluno = (compromisso.getAta() != null
                && compromisso.getAta().getAluno() != null
                && compromisso.getAta().getAluno().getNomeCompleto() != null)
                ? compromisso.getAta().getAluno().getNomeCompleto()
                : "estudante vinculado";

        String situacaoPrazo;
        if (prazo.isBefore(hoje)) {
            long diasAtraso = ChronoUnit.DAYS.between(prazo, hoje);
            situacaoPrazo = "venceu há " + diasAtraso + (diasAtraso == 1 ? " dia" : " dias")
                    + " (" + dataFormatada + ")";
        } else if (prazo.isEqual(hoje)) {
            situacaoPrazo = "vence hoje (" + dataFormatada + ")";
        } else {
            long diasRestantes = ChronoUnit.DAYS.between(hoje, prazo);
            situacaoPrazo = "vence em " + diasRestantes + (diasRestantes == 1 ? " dia" : " dias")
                    + " (" + dataFormatada + ")";
        }

        return String.format(
                "O compromisso acordado na ata de reunião do estudante %s %s: %s",
                nomeAluno,
                situacaoPrazo,
                compromisso.getDescricao()
        );
    }
}
