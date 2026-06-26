package com.fluxfund.api.domain.closingdossier.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fluxfund.api.domain.account.Account;
import com.fluxfund.api.domain.account.repository.AccountRepository;
import com.fluxfund.api.domain.attachment.Attachment;
import com.fluxfund.api.domain.attachment.repository.AttachmentRepository;
import com.fluxfund.api.domain.audit.AuditAction;
import com.fluxfund.api.domain.audit.AuditEntityType;
import com.fluxfund.api.domain.audit.service.AuditLogService;
import com.fluxfund.api.domain.bankstatementdocument.BankStatementDocument;
import com.fluxfund.api.domain.bankstatementdocument.repository.BankStatementDocumentRepository;
import com.fluxfund.api.domain.closingdossier.dto.ClosingDossierAccountPreviewResponse;
import com.fluxfund.api.domain.closingdossier.dto.ClosingDossierPreviewRequest;
import com.fluxfund.api.domain.closingdossier.dto.ClosingDossierPreviewResponse;
import com.fluxfund.api.domain.closingdossier.export.ClosingDossierExportAccount;
import com.fluxfund.api.domain.closingdossier.export.ClosingDossierPdfGenerator;
import com.fluxfund.api.domain.financialtransaction.FinancialTransaction;
import com.fluxfund.api.domain.financialtransaction.FinancialTransactionType;
import com.fluxfund.api.domain.financialtransaction.repository.FinancialTransactionRepository;
import com.fluxfund.api.domain.organization.Organization;
import com.fluxfund.api.domain.organization.OrganizationRepository;
import com.fluxfund.api.shared.exception.BusinessException;
import com.fluxfund.api.shared.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class ClosingDossierExportService {

    private final ClosingDossierService closingDossierService;
    private final ClosingDossierPdfGenerator pdfGenerator;

    private final OrganizationRepository organizationRepository;
    private final AccountRepository accountRepository;
    private final FinancialTransactionRepository financialTransactionRepository;
    private final AttachmentRepository attachmentRepository;
    private final BankStatementDocumentRepository bankStatementDocumentRepository;
    private final AuditLogService auditLogService;

    public byte[] export(
            UUID organizationId,
            ClosingDossierPreviewRequest request) {

        ClosingDossierPreviewResponse preview =
                closingDossierService.preview(organizationId, request);

        Organization organization = organizationRepository
                .findByIdAndActiveTrue(organizationId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Organization not found"));

        List<Account> accounts = accountRepository
                .findAllByIdInAndOrganizationIdAndActiveTrue(
                        request.accountIds(),
                        organizationId);

        Map<UUID, Account> accountsById = accounts.stream()
                .collect(Collectors.toMap(Account::getId, account -> account));

        List<FinancialTransaction> transactions =
                financialTransactionRepository.findSettledForClosingDossier(
                        organizationId,
                        request.accountIds(),
                        request.periodStartDate(),
                        request.periodEndDate(),
                        resolveSelectedTypes(request));

        Map<UUID, List<FinancialTransaction>> transactionsByAccountId =
                transactions.stream()
                        .collect(Collectors.groupingBy(
                                transaction ->
                                        transaction.getAccount().getId()));

        Map<UUID, List<BankStatementDocument>> statementsByAccountId =
                bankStatementDocumentRepository
                        .findAllForAccountsAndOverlappingPeriod(
                                organizationId,
                                request.accountIds(),
                                request.periodStartDate(),
                                request.periodEndDate())
                        .stream()
                        .collect(Collectors.groupingBy(
                                statement -> statement.getAccount().getId()));

        Map<UUID, List<Attachment>> attachmentsByTransactionId =
                loadAttachmentsByTransactionId(
                        organizationId,
                        transactions);

        List<ClosingDossierExportAccount> exportAccounts =
                new ArrayList<>();

        for (ClosingDossierAccountPreviewResponse accountPreview
                : preview.accounts()) {

            if (!accountPreview.includedInDossier()) {
                continue;
            }

            Account account = accountsById.get(accountPreview.accountId());

            if (account == null) {
                continue;
            }

            exportAccounts.add(new ClosingDossierExportAccount(
                    account,
                    accountPreview,
                    statementsByAccountId.getOrDefault(
                            account.getId(),
                            List.of()),
                    transactionsByAccountId.getOrDefault(
                            account.getId(),
                            List.of()),
                    attachmentsByTransactionId));
        }

        if (exportAccounts.isEmpty()) {
            throw new BusinessException(
                    "There are no accounts to include in the closing dossier");
        }

        byte[] pdf = pdfGenerator.generate(
                organization,
                request,
                preview,
                exportAccounts);

        auditLogService.record(
                organizationId,
                AuditEntityType.CLOSING_DOSSIER,
                UUID.randomUUID(),
                AuditAction.GENERATE_CLOSING_DOSSIER,
                "Closing dossier generated from "
                        + request.periodStartDate()
                        + " to "
                        + request.periodEndDate()
                        + " for "
                        + exportAccounts.size()
                        + " account(s)");

        return pdf;
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
                        attachment ->
                                attachment.getFinancialTransaction().getId()));
    }

    private List<FinancialTransactionType> resolveSelectedTypes(
            ClosingDossierPreviewRequest request) {

        List<FinancialTransactionType> types = new ArrayList<>();

        if (Boolean.TRUE.equals(request.includeIncomes())) {
            types.add(FinancialTransactionType.INCOME);
        }

        if (request.includeExpenses() == null
                || Boolean.TRUE.equals(request.includeExpenses())) {
            types.add(FinancialTransactionType.EXPENSE);
        }

        if (Boolean.TRUE.equals(request.includeTransfers())) {
            types.add(FinancialTransactionType.TRANSFER);
        }

        if (types.isEmpty()) {
            throw new BusinessException(
                    "Select at least one transaction type for the closing dossier");
        }

        return types;
    }
}