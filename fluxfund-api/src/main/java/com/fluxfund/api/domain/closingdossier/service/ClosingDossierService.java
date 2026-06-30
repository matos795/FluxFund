package com.fluxfund.api.domain.closingdossier.service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
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
import com.fluxfund.api.domain.closingdossier.dto.ClosingDossierDocumentIssueResponse;
import com.fluxfund.api.domain.closingdossier.dto.ClosingDossierDocumentIssueType;
import com.fluxfund.api.domain.closingdossier.dto.ClosingDossierPreviewRequest;
import com.fluxfund.api.domain.closingdossier.dto.ClosingDossierPreviewResponse;
import com.fluxfund.api.domain.financialtransaction.FinancialTransaction;
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

                Map<UUID, List<FinancialTransaction>> transactionsByAccountId = transactions.stream()
                                .collect(Collectors.groupingBy(
                                                transaction -> transaction.getAccount().getId()));

                Map<UUID, List<Attachment>> attachmentsByTransactionId = loadAttachmentsByTransactionId(
                                organizationId,
                                transactions);

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

                List<ClosingDossierAccountPreviewResponse> accountPreviews = new ArrayList<>();

                long accountsWithoutMovementCount = 0;
                long accountsWithoutBankStatementCount = 0;
                long expensesWithoutPaymentProofCount = 0;
                long expensesWithoutFiscalDocumentCount = 0;
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
                                        sumByType(
                                                        accountTransactions,
                                                        FinancialTransactionType.INCOME),
                                        sumByType(
                                                        accountTransactions,
                                                        FinancialTransactionType.EXPENSE),
                                        sumByType(
                                                        accountTransactions,
                                                        FinancialTransactionType.TRANSFER),

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

                                accountIds.size(),
                                includedAccountCount,
                                automaticSectionCount,

                                transactions.size(),
                                accountsWithoutMovementCount,
                                accountsWithoutBankStatementCount,
                                expensesWithoutPaymentProofCount,
                                expensesWithoutFiscalDocumentCount,

                                accountPreviews);
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

                return transaction.getCategory() != null
                                && transaction.getCategory().isRequiresPaymentProof();
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
}