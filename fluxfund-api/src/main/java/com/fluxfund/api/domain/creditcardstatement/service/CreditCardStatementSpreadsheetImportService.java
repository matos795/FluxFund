package com.fluxfund.api.domain.creditcardstatement.service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.fluxfund.api.domain.account.Account;
import com.fluxfund.api.domain.creditcardstatement.CreditCardStatement;
import com.fluxfund.api.domain.creditcardstatement.CreditCardStatementStatus;
import com.fluxfund.api.domain.creditcardstatement.dto.CreditCardStatementImportResponse;
import com.fluxfund.api.domain.creditcardstatement.importer.BradescoCreditCardXlsxParser;
import com.fluxfund.api.domain.creditcardstatement.repository.CreditCardStatementRepository;
import com.fluxfund.api.domain.financialtransaction.FinancialTransaction;
import com.fluxfund.api.domain.financialtransaction.FinancialTransactionSource;
import com.fluxfund.api.domain.financialtransaction.FinancialTransactionStatus;
import com.fluxfund.api.domain.financialtransaction.FinancialTransactionType;
import com.fluxfund.api.domain.financialtransaction.dto.FinancialTransactionResponse;
import com.fluxfund.api.domain.financialtransaction.mapper.FinancialTransactionMapper;
import com.fluxfund.api.domain.financialtransaction.repository.FinancialTransactionRepository;
import com.fluxfund.api.domain.organization.Organization;
import com.fluxfund.api.security.OrganizationAccessService;
import com.fluxfund.api.shared.exception.BusinessException;
import com.fluxfund.api.shared.exception.ResourceNotFoundException;
import com.fluxfund.api.shared.importer.ImportProfile;
import com.fluxfund.api.shared.importer.ImportedTransactionRow;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class CreditCardStatementSpreadsheetImportService {

    private final CreditCardStatementRepository statementRepository;
    private final FinancialTransactionRepository financialTransactionRepository;
    private final OrganizationAccessService organizationAccessService;
    private final BradescoCreditCardXlsxParser bradescoParser;

    public CreditCardStatementImportResponse importFile(
            UUID organizationId,
            UUID statementId,
            ImportProfile profile,
            MultipartFile file) {

        organizationAccessService.requireFinanceWriteAccess(organizationId);

        if (profile != ImportProfile.BRADESCO_CREDIT_CARD_XLSX) {
            throw new BusinessException("Perfil de importação inválido para fatura de cartão.");
        }

        CreditCardStatement statement = statementRepository
                .findByIdAndOrganizationId(statementId, organizationId)
                .orElseThrow(() -> new ResourceNotFoundException("Credit card statement not found"));

        if (statement.getStatus() == CreditCardStatementStatus.PAID
                || statement.getStatus() == CreditCardStatementStatus.CANCELED) {
            throw new BusinessException("Cannot import items into paid or canceled statements");
        }

        List<ImportedTransactionRow> rows = bradescoParser.parse(file);

        Organization organization = statement.getOrganization();
        Account creditCardAccount = statement.getCreditCardAccount();

        int imported = 0;
        int ignoredDuplicates = 0;
        int failed = 0;
        List<String> errors = new ArrayList<>();
        List<FinancialTransactionResponse> importedItems = new ArrayList<>();

        for (ImportedTransactionRow row : rows) {
            try {
                boolean alreadyExists = financialTransactionRepository
                        .existsByOrganizationIdAndCreditCardStatementIdAndExternalId(
                                organizationId,
                                statementId,
                                row.externalId());

                if (alreadyExists) {
                    ignoredDuplicates++;
                    continue;
                }

                FinancialTransaction transaction = createCreditCardItem(
                        organization,
                        creditCardAccount,
                        statement,
                        row);

                FinancialTransaction savedTransaction = financialTransactionRepository.save(transaction);

                importedItems.add(FinancialTransactionMapper.toResponse(savedTransaction));
                imported++;
            } catch (Exception exception) {
                failed++;
                errors.add("Erro ao importar linha: " + exception.getMessage());
            }
        }

        return new CreditCardStatementImportResponse(
                imported,
                0,
                0,
                0,
                ignoredDuplicates,
                importedItems,
                0,
                failed,
                List.of(),
                errors);
    }

    private FinancialTransaction createCreditCardItem(
            Organization organization,
            Account creditCardAccount,
            CreditCardStatement statement,
            ImportedTransactionRow row) {

        BigDecimal amount = row.amount();

        if (amount == null || amount.compareTo(BigDecimal.ZERO) == 0) {
            throw new BusinessException("Valor da transação deve ser diferente de zero.");
        }

        FinancialTransaction transaction = new FinancialTransaction();

        transaction.setOrganization(organization);
        transaction.setAccount(creditCardAccount);
        transaction.setCreditCardStatement(statement);

        transaction.setCategory(null);
        transaction.setType(FinancialTransactionType.EXPENSE);
        transaction.setSource(FinancialTransactionSource.CREDIT_CARD);
        transaction.setStatus(FinancialTransactionStatus.PENDING);

        transaction.setPurchaseDate(row.date());
        transaction.setDueDate(statement.getDueDate());
        transaction.setSettlementDate(null);

        transaction.setExpectedAmount(amount.abs());
        transaction.setSettledAmount(null);

        transaction.setInterestAmount(BigDecimal.ZERO);
        transaction.setDiscountAmount(BigDecimal.ZERO);

        transaction.setRawDescription(row.description());
        transaction.setDescription("");

        transaction.setImportedAt(LocalDateTime.now());
        transaction.setDocumentNumber(row.documentNumber());
        transaction.setExternalId(row.externalId());
        transaction.setClassifiedAt(null);

        return transaction;
    }
}