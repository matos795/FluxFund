package com.fluxfund.api.domain.financialtransaction.service;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfSystemProperty;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;

import com.fluxfund.api.shared.ofx.OfxTextNormalizer;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Import({
        TechnicalMovementBackfillService.class,
        NubankPixCreditBridgeDetector.class,
        OfxTextNormalizer.class
})
@EnabledIfSystemProperty(named = "backfill.preview.enabled", matches = "true")
class TechnicalMovementBackfillPreviewManualTest {

    @Autowired
    private TechnicalMovementBackfillService service;

    @Test
    void shouldPrintBackfillPreviewForRealOrganizationCopy() {

        String rawOrganizationId = System.getProperty(
                "backfill.organizationId");

        assertThat(rawOrganizationId)
                .as(
                        "Informe -Dbackfill.organizationId=<UUID>")
                .isNotBlank();

        UUID organizationId = UUID.fromString(
                rawOrganizationId);

        var preview = service.previewNubankPixCreditBridge(
                organizationId);

        System.out.println();
        System.out.println(
                "==========================================");

        System.out.println(
                " NUBANK PIX NO CREDITO - BACKFILL DRY-RUN");

        System.out.println(
                "==========================================");

        System.out.printf(
                "Candidatos estruturais : %d%n",
                preview.structuralCandidatePairs());

        System.out.printf(
                "Pares confirmados      : %d%n",
                preview.confirmedPairs());

        System.out.printf(
                "Transacoes a marcar    : %d%n",
                preview.transactionsToMark());

        System.out.println();
        System.out.println(
                "Detalhes dos pares confirmados:");

        int index = 1;

        for (var pair : preview.pairs()) {

            System.out.printf(
                    "%d) conta=%s | data=%s | valor=%s | fundingJaTecnico=%s | reversalJaTecnico=%s%n",
                    index++,
                    pair.accountId(),
                    pair.settlementDate(),
                    pair.amount(),
                    pair.fundingAlreadyTechnical(),
                    pair.reversalAlreadyTechnical());
        }

        System.out.println();
        System.out.println(
                "Banco alterado: NAO");

        System.out.println(
                "==========================================");

        assertThat(
                preview.transactionsToMark())
                .isGreaterThanOrEqualTo(0);
    }
}