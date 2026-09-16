package com.fluxfund.api.domain.financialtransaction.service;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfSystemProperty;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.context.annotation.Import;
import org.springframework.test.annotation.Commit;

import com.fluxfund.api.shared.ofx.OfxTextNormalizer;

@DataJpaTest
@AutoConfigureTestDatabase(
        replace = AutoConfigureTestDatabase.Replace.NONE)
@Import({
        TechnicalMovementBackfillService.class,
        NubankPixCreditBridgeDetector.class,
        OfxTextNormalizer.class
})
@EnabledIfSystemProperty(
        named = "backfill.execute.confirm",
        matches = "I_UNDERSTAND_THIS_WRITES_DATA")
class TechnicalMovementBackfillExecuteManualTest {

    @Autowired
    private TechnicalMovementBackfillService service;

    @Autowired
    private TestEntityManager entityManager;

    @Test
    @Commit
    void shouldExecuteBackfillOnRealDatabaseCopy() {

        String rawOrganizationId =
                System.getProperty(
                        "backfill.organizationId");

        assertThat(rawOrganizationId)
                .as(
                        "Informe -Dbackfill.organizationId=<UUID>")
                .isNotBlank();

        UUID organizationId =
                UUID.fromString(
                        rawOrganizationId);

        var before =
                service.previewNubankPixCreditBridge(
                        organizationId);

        System.out.println();
        System.out.println(
                "==========================================");

        System.out.println(
                " BACKFILL - ANTES DA EXECUCAO");

        System.out.println(
                "==========================================");

        System.out.printf(
                "Candidatos estruturais : %d%n",
                before.structuralCandidatePairs());

        System.out.printf(
                "Pares confirmados      : %d%n",
                before.confirmedPairs());

        System.out.printf(
                "Transacoes a marcar    : %d%n",
                before.transactionsToMark());

        /*
         * Trava extra:
         * estamos esperando exatamente o cenário
         * que já validamos manualmente.
         */
        assertThat(
                before.structuralCandidatePairs())
                .isEqualTo(3);

        assertThat(
                before.confirmedPairs())
                .isEqualTo(3);

        assertThat(
                before.transactionsToMark())
                .isEqualTo(6);

        var execution =
                service.executeNubankPixCreditBridge(
                        organizationId);

        entityManager.flush();
        entityManager.clear();

        System.out.println();
        System.out.println(
                "==========================================");

        System.out.println(
                " BACKFILL - EXECUCAO");

        System.out.println(
                "==========================================");

        System.out.printf(
                "Candidatos processados : %d%n",
                execution.structuralCandidatePairs());

        System.out.printf(
                "Pares confirmados      : %d%n",
                execution.confirmedPairs());

        System.out.printf(
                "Transacoes marcadas    : %d%n",
                execution.transactionsMarked());

        assertThat(
                execution.structuralCandidatePairs())
                .isEqualTo(3);

        assertThat(
                execution.confirmedPairs())
                .isEqualTo(3);

        assertThat(
                execution.transactionsMarked())
                .isEqualTo(6);

        var after =
                service.previewNubankPixCreditBridge(
                        organizationId);

        System.out.println();
        System.out.println(
                "==========================================");

        System.out.println(
                " BACKFILL - DEPOIS");

        System.out.println(
                "==========================================");

        System.out.printf(
                "Candidatos estruturais : %d%n",
                after.structuralCandidatePairs());

        System.out.printf(
                "Pares confirmados      : %d%n",
                after.confirmedPairs());

        System.out.printf(
                "Transacoes a marcar    : %d%n",
                after.transactionsToMark());

        System.out.println();
        System.out.println(
                "ALTERACOES SERAO COMMITADAS NESTA COPIA LOCAL.");

        System.out.println(
                "==========================================");

        assertThat(
                after.structuralCandidatePairs())
                .isZero();

        assertThat(
                after.confirmedPairs())
                .isZero();

        assertThat(
                after.transactionsToMark())
                .isZero();
    }
}