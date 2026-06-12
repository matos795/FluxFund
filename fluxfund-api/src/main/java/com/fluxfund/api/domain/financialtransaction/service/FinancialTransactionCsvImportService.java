package com.fluxfund.api.domain.financialtransaction.service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.fluxfund.api.domain.account.Account;
import com.fluxfund.api.domain.account.AccountType;
import com.fluxfund.api.domain.account.repository.AccountRepository;
import com.fluxfund.api.domain.financialtransaction.FinancialTransaction;
import com.fluxfund.api.domain.financialtransaction.FinancialTransactionSource;
import com.fluxfund.api.domain.financialtransaction.FinancialTransactionStatus;
import com.fluxfund.api.domain.financialtransaction.FinancialTransactionType;
import com.fluxfund.api.domain.financialtransaction.dto.ImportOfxResponse;
import com.fluxfund.api.domain.financialtransaction.importer.MercadoPagoAccountCsvParser;
import com.fluxfund.api.domain.financialtransaction.repository.FinancialTransactionRepository;
import com.fluxfund.api.domain.organization.Organization;
import com.fluxfund.api.domain.organization.OrganizationRepository;
import com.fluxfund.api.security.OrganizationAccessService;
import com.fluxfund.api.shared.exception.BusinessException;
import com.fluxfund.api.shared.exception.ResourceNotFoundException;
import com.fluxfund.api.shared.importer.ImportProfile;
import com.fluxfund.api.shared.importer.ImportedTransactionRow;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class FinancialTransactionCsvImportService {

    private final FinancialTransactionRepository financialTransactionRepository;
    private final OrganizationRepository organizationRepository;
    private final AccountRepository accountRepository;
    private final OrganizationAccessService organizationAccessService;
    private final MercadoPagoAccountCsvParser mercadoPagoParser;

    public ImportOfxResponse importCsv(
            UUID organizationId,
            UUID accountId,
            ImportProfile profile,
            MultipartFile file) {

        organizationAccessService.requireFinanceWriteAccess(organizationId);

        if (profile != ImportProfile.MERCADO_PAGO_ACCOUNT_CSV) {
            throw new BusinessException("Perfil de importação inválido para extrato bancário CSV.");
        }

        Organization organization = organizationRepository.findByIdAndActiveTrue(organizationId)
                .orElseThrow(() -> new ResourceNotFoundException("Organization not found"));

        Account account = accountRepository.findByIdAndOrganizationIdAndActiveTrue(accountId, organizationId)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found"));

        if (account.getType() == AccountType.CREDIT_CARD) {
            throw new BusinessException("CSV bancário não pode ser importado em conta de cartão.");
        }

        List<ImportedTransactionRow> rows = mercadoPagoParser.parse(file);

        int imported = 0;
        int ignoredDuplicates = 0;
        int failed = 0;
        List<String> errors = new ArrayList<>();

        for (ImportedTransactionRow row : rows) {
            try {
                boolean alreadyExists = financialTransactionRepository
                        .existsByOrganizationIdAndAccountIdAndExternalId(
                                organizationId,
                                accountId,
                                row.externalId());

                if (alreadyExists) {
                    ignoredDuplicates++;
                    continue;
                }

                FinancialTransaction transaction = createBankTransaction(
                        organization,
                        account,
                        row);

                financialTransactionRepository.save(transaction);
                imported++;
            } catch (Exception exception) {
                failed++;
                errors.add("Erro ao importar linha: " + exception.getMessage());
            }
        }

        return new ImportOfxResponse(
                imported,
                ignoredDuplicates,
                failed,
                errors);
    }

    private FinancialTransaction createBankTransaction(
            Organization organization,
            Account account,
            ImportedTransactionRow row) {

        BigDecimal amount = row.amount();

        if (amount == null || amount.compareTo(BigDecimal.ZERO) == 0) {
            throw new BusinessException("Valor da transação deve ser diferente de zero.");
        }

        FinancialTransactionType type = amount.compareTo(BigDecimal.ZERO) > 0
                ? FinancialTransactionType.INCOME
                : FinancialTransactionType.EXPENSE;

        BigDecimal absoluteAmount = amount.abs();

        FinancialTransaction transaction = new FinancialTransaction();

        transaction.setOrganization(organization);
        transaction.setAccount(account);
        transaction.setCategory(null);
        transaction.setType(type);
        transaction.setSource(FinancialTransactionSource.CSV);
        transaction.setStatus(FinancialTransactionStatus.SETTLED);

        transaction.setDueDate(row.date());
        transaction.setSettlementDate(row.date());

        transaction.setExpectedAmount(absoluteAmount);
        transaction.setSettledAmount(absoluteAmount);

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