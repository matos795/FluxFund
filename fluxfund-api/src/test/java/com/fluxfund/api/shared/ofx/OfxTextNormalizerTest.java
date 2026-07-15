package com.fluxfund.api.shared.ofx;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.Test;

class OfxTextNormalizerTest {

    private final OfxTextNormalizer normalizer =
            new OfxTextNormalizer();

    @Test
    void shouldRepairPortugueseCharacters() {

        assertEquals(
                "Transferência recebida pelo Pix",
                normalizer.normalize(
                        "TransferÃªncia recebida pelo Pix"));

        assertEquals(
                "Agência: 1",
                normalizer.normalize(
                        "AgÃªncia: 1"));
    }

    @Test
    void shouldRepairBrokenBulletCharacters() {

        assertEquals(
                "•••.753.719-••",
                normalizer.normalize(
                        "â€¢â€¢â€¢.753.719-â€¢â€¢"));
    }

    @Test
    void shouldRepairLatin1ControlCharacterVariant() {

        String brokenBullet =
                "â" + '\u0080' + "¢";

        assertEquals(
                "•",
                normalizer.normalize(
                        brokenBullet));
    }

    @Test
    void shouldRepairDoubleEncodedText() {

        assertEquals(
                "Transferência",
                normalizer.normalize(
                        "TransferÃƒÂªncia"));
    }

    @Test
    void shouldPreserveValidPortugueseText() {

        assertEquals(
                "SÃO PAULO",
                normalizer.normalize(
                        "SÃO PAULO"));

        assertEquals(
                "Ângela",
                normalizer.normalize(
                        "Ângela"));
    }
}