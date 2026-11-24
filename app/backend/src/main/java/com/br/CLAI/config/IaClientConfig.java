package com.br.CLAI.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

import java.time.Duration;

/** RestClient dedicado ao motor de IA, com timeouts explícitos de conexão e leitura (TA7.2). */
@Configuration
public class IaClientConfig {

    @Bean("iaRestClient")
    public RestClient iaRestClient(
            @Value("${sigi.ia.base-url:https://generativelanguage.googleapis.com}") String baseUrl,
            @Value("${sigi.ia.connect-timeout-ms:5000}") int connectTimeoutMs,
            @Value("${sigi.ia.read-timeout-ms:30000}") int readTimeoutMs) {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofMillis(connectTimeoutMs));
        factory.setReadTimeout(Duration.ofMillis(readTimeoutMs));
        return RestClient.builder()
                .baseUrl(baseUrl)
                .requestFactory(factory)
                .build();
    }
}
