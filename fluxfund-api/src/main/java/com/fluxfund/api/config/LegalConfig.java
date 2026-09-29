package com.fluxfund.api.config;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import com.fluxfund.api.domain.legal.dto.LegalDocumentProperties;

@Configuration
@EnableConfigurationProperties(LegalDocumentProperties.class)
public class LegalConfig {
}