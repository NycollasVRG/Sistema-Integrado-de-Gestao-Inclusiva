package com.br.CLAI.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Clock;

/**
  Relógio único da aplicação, injetável para tornar determinísticas as regras que dependem
  do tempo (ex.: trava de 24h de edição do Atendimento).
  <p>
  Usa o fuso padrão da JVM de propósito: o {@code @CreatedDate} do Spring Data Auditing grava
  {@code criadoEm} com {@code LocalDateTime.now()} nesse mesmo fuso, então a comparação
  {@code agora - criadoEm} é feita na mesma referência.
 */
@Configuration
public class ClockConfig {

    @Bean
    public Clock clock() {
        return Clock.systemDefaultZone();
    }
}
