package com.cafepos;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
@EntityScan(basePackages = "com.cafepos.entity")
@EnableJpaRepositories(basePackages = "com.cafepos.repository")
public class OdooCafePosApplication {
    public static void main(String[] args) {
        SpringApplication.run(OdooCafePosApplication.class, args);
    }
}
