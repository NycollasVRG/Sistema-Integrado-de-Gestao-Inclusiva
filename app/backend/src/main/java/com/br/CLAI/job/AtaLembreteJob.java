package com.br.CLAI.job;

import com.br.CLAI.service.AtaCompromissoLembreteService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Job agendado que dispara lembretes automáticos para compromissos de atas de reunião
 * próximos do vencimento ou vencidos (US 08 / TA8.3).
 */
@Component
public class AtaLembreteJob {

    private static final Logger log = LoggerFactory.getLogger(AtaLembreteJob.class);

    private final AtaCompromissoLembreteService lembreteService;

    public AtaLembreteJob(AtaCompromissoLembreteService lembreteService) {
        this.lembreteService = lembreteService;
    }

    @Scheduled(
            cron = "${sigi.atas.lembrete.cron:0 0 8 * * *}",
            zone = "${sigi.atas.lembrete.zone:America/Fortaleza}"
    )
    public void executar() {
        try {
            int enviados = lembreteService.enviarLembretes();
            if (enviados > 0) {
                log.info("Job de lembretes de atas concluiu com {} notificação(ões) enviada(s).", enviados);
            }
        } catch (Exception ex) {
            log.error("Erro ao executar job de lembretes de compromissos de atas de reunião.", ex);
        }
    }
}
