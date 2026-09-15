package com.fluxfund.api.domain.financialtransaction.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import com.fluxfund.api.domain.account.Account;
import com.fluxfund.api.domain.account.repository.AccountRepository;
import com.fluxfund.api.domain.audit.service.AuditLogService;
import com.fluxfund.api.domain.financialtransaction.FinancialTransaction;
import com.fluxfund.api.domain.financialtransaction.TechnicalMovementType;
import com.fluxfund.api.domain.financialtransaction.repository.FinancialTransactionRepository;
import com.fluxfund.api.domain.importbatch.ImportBatch;
import com.fluxfund.api.domain.importbatch.repository.ImportBatchRepository;
import com.fluxfund.api.domain.organization.Organization;
import com.fluxfund.api.domain.organization.repository.OrganizationRepository;
import com.fluxfund.api.security.OrganizationAccessService;
import com.fluxfund.api.shared.ofx.OfxTextNormalizer;

@ExtendWith(MockitoExtension.class)
class OfxImportServiceTest {

    @Mock
    private FinancialTransactionRepository financialTransactionRepository;

    @Mock
    private OrganizationRepository organizationRepository;

    @Mock
    private AccountRepository accountRepository;

    @Mock
    private OrganizationAccessService organizationAccessService;

    @Mock
    private AuditLogService auditLogService;

    @Mock
    private OfxTextNormalizer ofxTextNormalizer;

    @Mock
    private ImportBatchRepository importBatchRepository;

    @Mock
    private NubankPixCreditBridgeDetector technicalMovementDetector;

    @InjectMocks
    private OfxImportService service;

    @Test
    void shouldPersistDetectedOfxEntriesAsTechnicalMovements() {

        UUID organizationId = UUID.randomUUID();

        UUID accountId = UUID.randomUUID();

        Organization organization = new Organization();

        Account account = new Account();

        when(organizationRepository
                .findByIdAndActiveTrue(organizationId))
                .thenReturn(Optional.of(organization));

        when(accountRepository
                .findByIdAndOrganizationIdAndActiveTrue(accountId, organizationId))
                .thenReturn(Optional.of(account));

        when(importBatchRepository
                .save(any(ImportBatch.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        when(ofxTextNormalizer
                .normalize(anyString()))
                .thenAnswer(invocation -> invocation.getArgument(0));

        when(technicalMovementDetector
                .detect(anyList()))
                .thenReturn(Map.of(
                        "pix-credit-123",
                        TechnicalMovementType.NUBANK_PIX_CREDIT_BRIDGE,
                        "pix-credit-123:reversal",
                        TechnicalMovementType.NUBANK_PIX_CREDIT_BRIDGE));

        MockMultipartFile file = new MockMultipartFile(
                "file",
                "nubank.ofx",
                "application/x-ofx",
                minimalOfx().getBytes(StandardCharsets.UTF_8));

        var response = service.importOfx(organizationId, accountId, file);

        ArgumentCaptor<FinancialTransaction> captor = ArgumentCaptor.forClass(FinancialTransaction.class);

        verify(financialTransactionRepository, times(2))
                .save(captor.capture());

        List<FinancialTransaction> savedTransactions = captor.getAllValues();

        assertThat(response.imported()).isEqualTo(2);

        assertThat(savedTransactions)
                .allSatisfy(transaction -> {

                    assertThat(
                            transaction.isTechnicalMovement())
                            .isTrue();

                    assertThat(
                            transaction.getTechnicalMovementType())
                            .isEqualTo(TechnicalMovementType.NUBANK_PIX_CREDIT_BRIDGE);
                });
    }

    private String minimalOfx() {

        return """
                OFXHEADER:100
                DATA:OFXSGML
                VERSION:102
                SECURITY:NONE
                ENCODING:USASCII
                CHARSET:1252
                COMPRESSION:NONE
                OLDFILEUID:NONE
                NEWFILEUID:NONE

                <OFX>
                <SIGNONMSGSRSV1>
                <SONRS>
                <STATUS>
                <CODE>0
                <SEVERITY>INFO
                </STATUS>
                <DTSERVER>20260818120000
                <LANGUAGE>POR
                </SONRS>
                </SIGNONMSGSRSV1>

                <BANKMSGSRSV1>
                <STMTTRNRS>
                <TRNUID>1
                <STATUS>
                <CODE>0
                <SEVERITY>INFO
                </STATUS>

                <STMTRS>
                <CURDEF>BRL

                <BANKACCTFROM>
                <BANKID>260
                <ACCTID>123456
                <ACCTTYPE>CHECKING
                </BANKACCTFROM>

                <BANKTRANLIST>
                <DTSTART>20260818000000
                <DTEND>20260818235959

                <STMTTRN>
                <TRNTYPE>CREDIT
                <DTPOSTED>20260818120000
                <TRNAMT>50.00
                <FITID>pix-credit-123
                <MEMO>Valor adicionado para Pix no Credito
                </STMTTRN>

                <STMTTRN>
                <TRNTYPE>DEBIT
                <DTPOSTED>20260818120000
                <TRNAMT>-50.00
                <FITID>pix-credit-123:reversal
                <MEMO>Transferencia enviada pelo Pix
                </STMTTRN>

                </BANKTRANLIST>

                <LEDGERBAL>
                <BALAMT>0.00
                <DTASOF>20260818120000
                </LEDGERBAL>

                </STMTRS>
                </STMTTRNRS>
                </BANKMSGSRSV1>
                </OFX>
                """;
    }
}