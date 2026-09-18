package com.fluxfund.api.domain.legal.service;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.stereotype.Service;

import com.fluxfund.api.domain.legal.LegalDocumentHasher;
import com.fluxfund.api.domain.legal.dto.LegalDocumentSnapshot;
import com.fluxfund.api.domain.legal.dto.LegalDocumentProperties;

@Service
public class LegalDocumentService {

    private final LegalDocumentSnapshot currentTerms;

    private final LegalDocumentSnapshot currentPrivacyNotice;

    public LegalDocumentService(
            LegalDocumentProperties properties,
            ResourceLoader resourceLoader,
            LegalDocumentHasher hasher) {

        this.currentTerms =
                load(
                        properties.terms(),
                        resourceLoader,
                        hasher);

        this.currentPrivacyNotice =
                load(
                        properties.privacyNotice(),
                        resourceLoader,
                        hasher);
    }

    public LegalDocumentSnapshot currentTerms() {
        return currentTerms;
    }

    public LegalDocumentSnapshot currentPrivacyNotice() {
        return currentPrivacyNotice;
    }

    private LegalDocumentSnapshot load(
            LegalDocumentProperties.Document document,
            ResourceLoader resourceLoader,
            LegalDocumentHasher hasher) {

        Resource resource =
                resourceLoader.getResource(
                        document.resource());

        try {

            String content =
                    new String(
                            resource
                                    .getInputStream()
                                    .readAllBytes(),
                            StandardCharsets.UTF_8);

            String hash =
                    hasher.sha256(content);

            return new LegalDocumentSnapshot(
                    document.version(),
                    hash,
                    content);

        } catch (IOException ex) {

            throw new IllegalStateException(
                    "Unable to load legal document: "
                            + document.resource(),
                    ex);
        }
    }
}