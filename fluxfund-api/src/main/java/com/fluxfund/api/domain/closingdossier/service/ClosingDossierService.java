package com.fluxfund.api.domain.closingdossier.service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fluxfund.api.domain.account.Account;
import com.fluxfund.api.domain.account.AccountType;
import com.fluxfund.api.domain.account.repository.AccountRepository;
import com.fluxfund.api.domain.attachment.Attachment;
import com.fluxfund.api.domain.attachment.AttachmentType;
import com.fluxfund.api.domain.attachment.repository.AttachmentRepository;
import com.fluxfund.api.domain.bankstatementdocument.dto.BankStatementDocumentResponse;
import com.fluxfund.api.domain.bankstatementdocument.mapper.BankStatementDocumentMapper;
import com.fluxfund.api.domain.bankstatementdocument.repository.BankStatementDocumentRepository;
import com.fluxfund.api.domain.closingdossier.dto.ClosingDossierAccountPreviewResponse;
import com.fluxfund.api.domain.closingdossier.dto.ClosingDossierCreditCardStatementPreviewResponse;
import com.fluxfund.api.domain.closingdossier.dto.ClosingDossierDocumentIssueResponse;
import com.fluxfund.api.domain.closingdossier.dto.ClosingDossierDocumentIssueType;
import com.fluxfund.api.domain.closingdossier.dto.ClosingDossierPreviewRequest;
import com.fluxfund.api.domain.closingdossier.dto.ClosingDossierPreviewResponse;
import com.fluxfund.api.domain.creditcardstatement.CreditCardStatement;
import com.fluxfund.api.domain.creditcardstatement.CreditCardStatementStatus;
import com.fluxfund.api.domain.creditcardstatement.repository.CreditCardStatementRepository;
import com.fluxfund.api.domain.financialtransaction.FinancialTransaction;
import com.fluxfund.api.domain.financialtransaction.FinancialTransactionSource;
import com.fluxfund.api.domain.financialtransaction.FinancialTransactionStatus;
import com.fluxfund.api.domain.financialtransaction.FinancialTransactionType;
import com.fluxfund.api.domain.financialtransaction.FiscalDocumentPolicy;
import com.fluxfund.api.domain.financialtransaction.repository.FinancialTransactionRepository;
import com.fluxfund.api.domain.organization.repository.OrganizationRepository;
import com.fluxfund.api.domain.organizationsettings.OrganizationSettings;
import com.fluxfund.api.domain.organizationsettings.repository.OrganizationSettingsRepository;
import com.fluxfund.api.security.OrganizationAccessService;
import com.fluxfund.api.shared.exception.BusinessException;
import com.fluxfund.api.shared.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ClosingDossierService {

        private final OrganizationAccessService organizationAccessService;
        private final OrganizationRepository organizationRepository;
        private final OrganizationSettingsRepository organizationSettingsRepository;
        private final AccountRepository accountRepository;
        private final FinancialTransactionRepository financialTransactionRepository;
        private final AttachmentRepository attachmentRepository;
        private final BankStatementDocumentRepository bankStatementDocumentRepository;
        private final CreditCardStatementRepository creditCardStatementRepository;

        public ClosingDossierPreviewResponse preview(
                        UUID organizationId,
                        ClosingDossierPreviewRequest request) {

                organizationAccessService.requireReadAccess(organizationId);

                validatePeriod(request.periodStartDate(), request.periodEndDate());

                organizationRepository.findByIdAndActiveTrue(organizationId)
                                .orElseThrow(() -> new ResourceNotFoundException("Organization not found"));

                List<UUID> accountIds = new ArrayList<>(
                                new LinkedHashSet<>(request.accountIds()));

                List<Account> accounts = accountRepository
                                .findAllByIdInAndOrganizationIdAndActiveTrue(
                                                accountIds,
                                                organizationId);

                if (accounts.size() != accountIds.size()) {
                        throw new ResourceNotFoundException(
                                        "One or more selected accounts were not found");
                }

                boolean includeAccountsWithoutMovement = Boolean.TRUE.equals(request.includeAccountsWithoutMovement());

                boolean includeIncomes = Boolean.TRUE.equals(request.includeIncomes());

                boolean includeExpenses = request.includeExpenses() == null
                                || Boolean.TRUE.equals(request.includeExpenses());

                boolean includeTransfers = Boolean.TRUE.equals(request.includeTransfers());

                boolean includesSupportReport = shouldIncludeSupportReport(request);
                boolean includesPayablesReport = shouldIncludePayablesReport(request);
                boolean includesReceivablesReport = shouldIncludeReceivablesReport(request);
                boolean includesFundMovementReport = shouldIncludeFundMovementReport(request);

                int automaticSectionCount = 0;

                if (includesSupportReport) {
                        automaticSectionCount++;
                }
                if (includesPayablesReport) {
                        automaticSectionCount++;
                }
                if (includesReceivablesReport) {
                        automaticSectionCount++;
                }

                if (includesFundMovementReport) {
                        automaticSectionCount++;
                }

                List<FinancialTransactionType> selectedTypes = resolveSelectedTypes(
                                includeIncomes,
                                includeExpenses,
                                includeTransfers);

                accounts.forEach(this::validateAccountSupported);

                List<FinancialTransaction> transactions = financialTransactionRepository.findSettledForClosingDossier(
                                organizationId,
                                accountIds,
                                request.periodStartDate(),
                                request.periodEndDate(),
                                selectedTypes);

                List<CreditCardStatement> creditCardStatements = loadCreditCardStatementsForDossier(
                                organizationId,
                                request.periodStartDate(),
                                request.periodEndDate(),
                                includeExpenses,
                                transactions);

                List<FinancialTransaction> creditCardStatementItems = loadCreditCardStatementItems(
                                organizationId,
                                creditCardStatements);

                Map<UUID, List<FinancialTransaction>> transactionsByAccountId = transactions.stream()
                                .collect(Collectors.groupingBy(
                                                transaction -> transaction.getAccount().getId()));

                List<FinancialTransaction> documentTransactions = new ArrayList<>(transactions);

                documentTransactions.addAll(creditCardStatementItems);

                Map<UUID, List<Attachment>> attachmentsByTransactionId = loadAttachmentsByTransactionId(
                                organizationId,
                                documentTransactions);

                Map<UUID, List<BankStatementDocumentResponse>> statementsByAccountId = bankStatementDocumentRepository
                                .findAllForAccountsAndOverlappingPeriod(
                                                organizationId,
                                                accountIds,
                                                request.periodStartDate(),
                                                request.periodEndDate())
                                .stream()
                                .map(BankStatementDocumentMapper::toResponse)
                                .collect(Collectors.groupingBy(
                                                BankStatementDocumentResponse::accountId));

                OrganizationSettings settings = organizationSettingsRepository
                                .findByOrganizationId(organizationId)
                                .orElse(null);

                boolean requireFiscalDocumentForExpenses = settings == null
                                || settings.isRequireFiscalDocumentForExpenses();

                Map<UUID, List<FinancialTransaction>> creditCardItemsByStatementId = creditCardStatementItems.stream()
                                .collect(
                                                Collectors.groupingBy(
                                                                item -> item.getCreditCardStatement()
                                                                                .getId()));

                List<ClosingDossierCreditCardStatementPreviewResponse> creditCardStatementPreviews = buildCreditCardStatementPreviews(
                                creditCardStatements,
                                creditCardItemsByStatementId,
                                attachmentsByTransactionId,
                                requireFiscalDocumentForExpenses);

                long creditCardStatementsWithoutPdfCount = creditCardStatementPreviews.stream()
                                .filter(statement -> !statement.hasOfficialPdf())
                                .count();

                long creditCardFiscalDocumentIssueCount = creditCardStatementPreviews.stream()
                                .mapToLong(statement -> statement
                                                .fiscalDocumentIssues()
                                                .size())
                                .sum();

                automaticSectionCount += creditCardStatementPreviews.size();

                List<ClosingDossierAccountPreviewResponse> accountPreviews = new ArrayList<>();

                long accountsWithoutMovementCount = 0;
                long accountsWithoutBankStatementCount = 0;
                long expensesWithoutPaymentProofCount = 0;
                long expensesWithoutFiscalDocumentCount = creditCardFiscalDocumentIssueCount;
                int includedAccountCount = 0;

                List<Account> sortedAccounts = accounts.stream()
                                .sorted(Comparator.comparing(
                                                Account::getName,
                                                String.CASE_INSENSITIVE_ORDER))
                                .toList();

                for (Account account : sortedAccounts) {
                        List<FinancialTransaction> accountTransactions = transactionsByAccountId.getOrDefault(
                                        account.getId(),
                                        List.of());

                        List<BankStatementDocumentResponse> statementDocuments = statementsByAccountId.getOrDefault(
                                        account.getId(),
                                        List.of());

                        boolean hasMovement = !accountTransactions.isEmpty();
                        boolean includedInDossier = includeAccountsWithoutMovement || hasMovement;

                        if (!hasMovement) {
                                accountsWithoutMovementCount++;
                        }

                        if (includedInDossier) {
                                includedAccountCount++;

                                if (statementDocuments.isEmpty()) {
                                        accountsWithoutBankStatementCount++;
                                }
                        }

                        List<ClosingDossierDocumentIssueResponse> paymentProofIssues = new ArrayList<>();

                        List<ClosingDossierDocumentIssueResponse> fiscalDocumentIssues = new ArrayList<>();

                        for (FinancialTransaction transaction : accountTransactions) {
                                if (transaction.getType() != FinancialTransactionType.EXPENSE) {
                                        continue;
                                }

                                List<Attachment> transactionAttachments = attachmentsByTransactionId.getOrDefault(
                                                transaction.getId(),
                                                List.of());

                                if (requiresPaymentProof(transaction)
                                                && !hasPaymentProof(transactionAttachments)) {

                                        paymentProofIssues.add(toIssue(
                                                        transaction,
                                                        ClosingDossierDocumentIssueType.PAYMENT_PROOF_MISSING));
                                }

                                ClosingDossierDocumentIssueType fiscalIssueType = resolveFiscalDocumentIssueType(
                                                transaction,
                                                transactionAttachments,
                                                requireFiscalDocumentForExpenses);

                                if (fiscalIssueType != null) {
                                        fiscalDocumentIssues.add(toIssue(
                                                        transaction,
                                                        fiscalIssueType));
                                }
                        }

                        expensesWithoutPaymentProofCount += paymentProofIssues.size();
                        expensesWithoutFiscalDocumentCount += fiscalDocumentIssues.size();

                        accountPreviews.add(new ClosingDossierAccountPreviewResponse(
                                        account.getId(),
                                        account.getName(),
                                        account.getType(),

                                        hasMovement,
                                        includedInDossier,

                                        !statementDocuments.isEmpty(),
                                        statementDocuments,

                                        accountTransactions.size(),
                                        sumByType(accountTransactions, FinancialTransactionType.INCOME),
                                        sumByType(accountTransactions, FinancialTransactionType.EXPENSE),
                                        sumByType(accountTransactions, FinancialTransactionType.TRANSFER),

                                        paymentProofIssues,
                                        fiscalDocumentIssues));
                }

                return new ClosingDossierPreviewResponse(
                                request.periodStartDate(),
                                request.periodEndDate(),

                                includeAccountsWithoutMovement,
                                includeIncomes,
                                includeExpenses,
                                includeTransfers,

                                includesSupportReport,
                                includesPayablesReport,
                                includesReceivablesReport,
                                includesFundMovementReport,

                                accountIds.size(),
                                includedAccountCount,
                                automaticSectionCount,

                                transactions.size() + creditCardStatementItems.size(),

                                accountsWithoutMovementCount,
                                accountsWithoutBankStatementCount,
                                expensesWithoutPaymentProofCount,
                                expensesWithoutFiscalDocumentCount,

                                creditCardStatementPreviews.size(),
                                creditCardStatementItems.size(),
                                creditCardStatementsWithoutPdfCount,

                                creditCardStatementPreviews,

                                accountPreviews);
        }

        private List<CreditCardStatement> loadCreditCardStatementsForDossier(

                        UUID organizationId,
                        LocalDate startDate,
                        LocalDate endDate,
                        boolean includeExpenses,
                        List<FinancialTransaction> transactions) {

                Map<UUID, CreditCardStatement> statementsById = new LinkedHashMap<>();

                /*
                 * Faturas que possuem compras reconhecidas
                 * no período.
                 */
                if (includeExpenses) {

                        creditCardStatementRepository
                                        .findForClosingDossierByItemPeriod(
                                                        organizationId,
                                                        startDate,
                                                        endDate,
                                                        CreditCardStatementStatus.CANCELED,
                                                        FinancialTransactionStatus.CANCELED)
                                        .forEach(statement -> statementsById.put(
                                                        statement.getId(),
                                                        statement));
                }

                /*
                 * Preserva o comportamento anterior:
                 * faturas pagas por uma movimentação bancária
                 * presente no período também são incluídas.
                 */
                List<UUID> paymentTransactionIds = transactions.stream()
                                .map(FinancialTransaction::getId)
                                .toList();

                if (!paymentTransactionIds.isEmpty()) {

                        creditCardStatementRepository
                                        .findPaidForClosingDossier(
                                                        organizationId,
                                                        CreditCardStatementStatus.PAID,
                                                        paymentTransactionIds)
                                        .forEach(statement -> statementsById.put(
                                                        statement.getId(),
                                                        statement));
                }

                return statementsById.values()
                                .stream()
                                .sorted(Comparator.comparing(CreditCardStatement::getDueDate)
                                                .thenComparing(CreditCardStatement::getName,
                                                                String.CASE_INSENSITIVE_ORDER))
                                .toList();
        }

        private List<FinancialTransaction> loadCreditCardStatementItems(

                        UUID organizationId,
                        List<CreditCardStatement> statements) {

                List<UUID> statementIds = statements.stream()
                                .map(CreditCardStatement::getId)
                                .toList();

                if (statementIds.isEmpty()) {
                        return List.of();
                }

                return financialTransactionRepository
                                .findCreditCardStatementItemsForClosingDossier(
                                                organizationId,
                                                statementIds,
                                                FinancialTransactionStatus.CANCELED);
        }

        private List<ClosingDossierCreditCardStatementPreviewResponse> buildCreditCardStatementPreviews(
                        List<CreditCardStatement> statements,
                        Map<UUID, List<FinancialTransaction>> itemsByStatementId,
                        Map<UUID, List<Attachment>> attachmentsByTransactionId,
                        boolean requireFiscalDocumentForExpenses) {

                return statements.stream()
                                .map(statement -> {

                                        List<FinancialTransaction> items = itemsByStatementId.getOrDefault(
                                                        statement.getId(),
                                                        List.of());

                                        List<ClosingDossierDocumentIssueResponse> fiscalIssues = new ArrayList<>();

                                        for (FinancialTransaction item : items) {

                                                List<Attachment> attachments = attachmentsByTransactionId
                                                                .getOrDefault(
                                                                                item.getId(),
                                                                                List.of());

                                                ClosingDossierDocumentIssueType issueType = resolveFiscalDocumentIssueType(
                                                                item,
                                                                attachments,
                                                                requireFiscalDocumentForExpenses);

                                                if (issueType != null) {
                                                        fiscalIssues.add(toIssue(item, issueType));
                                                }
                                        }

                                        BigDecimal itemTotal = items.stream()
                                                        .map(this::resolveCreditCardItemAmount)
                                                        .reduce(BigDecimal.ZERO, BigDecimal::add);

                                        BigDecimal previousBalance = statement.getPreviousBalanceAmount() != null

                                                        ? statement
                                                                        .getPreviousBalanceAmount()
                                                                        .abs()

                                                        : BigDecimal.ZERO;

                                        BigDecimal totalAmount = previousBalance.add(itemTotal);

                                        long unclassifiedItemCount = items.stream()
                                                        .filter(item -> item.getCategory() == null)
                                                        .count();

                                        boolean hasOfficialPdf = statement.getStatementPdfStorageKey() != null
                                                        && !statement
                                                                        .getStatementPdfStorageKey()
                                                                        .isBlank();

                                        return new ClosingDossierCreditCardStatementPreviewResponse(
                                                        statement.getId(),
                                                        statement.getName(),
                                                        statement.getCreditCardAccount().getId(),
                                                        statement.getCreditCardAccount().getName(),
                                                        statement.getStatus(),
                                                        statement.getClosingDate(),
                                                        statement.getDueDate(),
                                                        totalAmount,
                                                        items.size(),
                                                        unclassifiedItemCount,
                                                        hasOfficialPdf,
                                                        fiscalIssues);
                                })
                                .toList();
        }

        private BigDecimal resolveCreditCardItemAmount(FinancialTransaction transaction) {

                BigDecimal amount = transaction.getExpectedAmount() != null
                                ? transaction.getExpectedAmount()
                                : transaction.getSettledAmount();

                return absoluteAmount(amount);
        }

        private Map<UUID, List<Attachment>> loadAttachmentsByTransactionId(
                        UUID organizationId,
                        List<FinancialTransaction> transactions) {

                List<UUID> transactionIds = transactions.stream()
                                .map(FinancialTransaction::getId)
                                .toList();

                if (transactionIds.isEmpty()) {
                        return Map.of();
                }

                return attachmentRepository
                                .findAllByTransactionIdsForExport(
                                                organizationId,
                                                transactionIds)
                                .stream()
                                .collect(Collectors.groupingBy(
                                                attachment -> attachment.getFinancialTransaction().getId()));
        }

        private List<FinancialTransactionType> resolveSelectedTypes(
                        boolean includeIncomes,
                        boolean includeExpenses,
                        boolean includeTransfers) {

                List<FinancialTransactionType> types = new ArrayList<>();

                if (includeIncomes) {
                        types.add(FinancialTransactionType.INCOME);
                }

                if (includeExpenses) {
                        types.add(FinancialTransactionType.EXPENSE);
                }

                if (includeTransfers) {
                        types.add(FinancialTransactionType.TRANSFER);
                }

                if (types.isEmpty()) {
                        throw new BusinessException(
                                        "Select at least one transaction type for the closing dossier");
                }

                return types;
        }

        private void validateAccountSupported(Account account) {
                if (account.getType() == AccountType.CREDIT_CARD) {
                        throw new BusinessException(
                                        "Credit card accounts are not supported in the closing dossier MVP");
                }
        }

        private void validatePeriod(
                        LocalDate periodStartDate,
                        LocalDate periodEndDate) {

                if (periodStartDate.isAfter(periodEndDate)) {
                        throw new BusinessException(
                                        "Period start date cannot be after period end date");
                }
        }

        private boolean requiresPaymentProof(
                        FinancialTransaction transaction) {

                boolean isCreditCardItem = transaction.getSource() == FinancialTransactionSource.CREDIT_CARD
                                && transaction.getCreditCardStatement() != null;

                if (isCreditCardItem) {
                        return false;
                }

                return transaction.getCategory() != null && transaction.getCategory().isRequiresPaymentProof();
        }

        private ClosingDossierDocumentIssueType resolveFiscalDocumentIssueType(
                        FinancialTransaction transaction,
                        List<Attachment> attachments,
                        boolean requireFiscalDocumentForExpenses) {

                if (hasFiscalDocument(attachments)) {
                        return null;
                }

                FiscalDocumentPolicy policy = transaction.getFiscalDocumentPolicy() != null
                                ? transaction.getFiscalDocumentPolicy()
                                : FiscalDocumentPolicy.CATEGORY;

                return switch (policy) {
                        case REQUIRED ->
                                ClosingDossierDocumentIssueType.FISCAL_DOCUMENT_REQUIRED_MISSING;

                        case MISSING ->
                                ClosingDossierDocumentIssueType.FISCAL_DOCUMENT_DECLARED_MISSING;

                        case WAIVED -> null;

                        case CATEGORY -> {
                                boolean categoryRequiresFiscalDocument = transaction.getCategory() != null
                                                && transaction.getCategory()
                                                                .isRequiresFiscalDocument();

                                yield categoryRequiresFiscalDocument
                                                && requireFiscalDocumentForExpenses
                                                                ? ClosingDossierDocumentIssueType.FISCAL_DOCUMENT_REQUIRED_MISSING
                                                                : null;
                        }
                };
        }

        private boolean hasPaymentProof(List<Attachment> attachments) {
                return attachments.stream()
                                .anyMatch(attachment -> attachment.getType() == AttachmentType.PROOF_OF_PAYMENT);
        }

        private boolean hasFiscalDocument(List<Attachment> attachments) {
                return attachments.stream()
                                .anyMatch(attachment -> attachment.getType() == AttachmentType.INVOICE
                                                || attachment.getType() == AttachmentType.RECEIPT
                                                || attachment.getType() == AttachmentType.CONTRACT);
        }

        private BigDecimal sumByType(
                        List<FinancialTransaction> transactions,
                        FinancialTransactionType type) {

                return transactions.stream()
                                .filter(transaction -> transaction.getType() == type)
                                .map(transaction -> absoluteAmount(
                                                transaction.getSettledAmount()))
                                .reduce(BigDecimal.ZERO, BigDecimal::add);
        }

        private BigDecimal absoluteAmount(BigDecimal amount) {
                return amount != null
                                ? amount.abs()
                                : BigDecimal.ZERO;
        }

        private ClosingDossierDocumentIssueResponse toIssue(
                        FinancialTransaction transaction,
                        ClosingDossierDocumentIssueType issueType) {

                String description = transaction.getDescription() != null
                                && !transaction.getDescription().isBlank()
                                                ? transaction.getDescription()
                                                : transaction.getRawDescription();

                return new ClosingDossierDocumentIssueResponse(
                                transaction.getId(),
                                transaction.getSettlementDate(),
                                description,
                                transaction.getRawDescription(),
                                transaction.getCategory() != null
                                                ? transaction.getCategory().getName()
                                                : null,
                                absoluteAmount(transaction.getSettledAmount()),
                                transaction.getFiscalDocumentPolicy(),
                                transaction.getFiscalDocumentNote(),
                                issueType);
        }

        private boolean shouldIncludeSupportReport(
                        ClosingDossierPreviewRequest request) {
                return Boolean.TRUE.equals(request.includeSupportReport());
        }

        private boolean shouldIncludePayablesReport(
                        ClosingDossierPreviewRequest request) {
                return Boolean.TRUE.equals(request.includePayablesReport());
        }

        private boolean shouldIncludeReceivablesReport(
                        ClosingDossierPreviewRequest request) {
                return Boolean.TRUE.equals(request.includeReceivablesReport());
        }

        private boolean shouldIncludeFundMovementReport(
                        ClosingDossierPreviewRequest request) {
                return Boolean.TRUE.equals(request.includeFundMovementReport());
        }
}