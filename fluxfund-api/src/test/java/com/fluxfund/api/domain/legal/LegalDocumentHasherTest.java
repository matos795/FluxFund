package com.fluxfund.api.domain.legal;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class LegalDocumentHasherTest {

    private final LegalDocumentHasher hasher = new LegalDocumentHasher();

    @Test
    void shouldCalculateSha256AsHexadecimal() {

        String hash = hasher.sha256("abc");

        assertThat(hash).isEqualTo("ba7816bf8f01cfea414140de5dae2223" + "b00361a396177a9cb410ff61f20015ad");
    }
}