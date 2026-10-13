package com.br.CLAI;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@SpringBootApplication
@EnableJpaAuditing
public class ClaiApplication {

	public static void main(String[] args) {
		SpringApplication.run(ClaiApplication.class, args);
	}

}
