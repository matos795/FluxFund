package com.fluxfund.api.domain.legal.service;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.stereotype.Service;

import com.fluxfund.api.domain.legal.LegalDocumentHasher;
import com.fluxfund.api.domain.legal.dto.LegalDocumentSnapshot;
import com.fluxfund.api.domain.legal.dto.LegalDocumentProperties;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class LegalDocumentService {

    private final LegalDocumentProperties properties;

    private final ResourceLoader resourceLoader;

    private final LegalDocumentHasher hasher;

    public LegalDocumentSnapshot currentTerms() {

        return load(
                properties.terms());
    }

    public LegalDocumentSnapshot currentPrivacyNotice() {

        return load(
                properties.privacyNotice());
    }

    private LegalDocumentSnapshot load(LegalDocumentProperties.Document document) {

        Resource resource = resourceLoader.getResource(
                document.resource());

        try {

            String content = new String(
                    resource
                            .getInputStream()
                            .readAllBytes(),
                    StandardCharsets.UTF_8);

            String hash = hasher.sha256(content);

            return new LegalDocumentSnapshot(document.version(), hash, content);

        } catch (IOException ex) {
            throw new IllegalStateException("Unable to load legal document: " + document.resource(), ex);
        }
    }
}