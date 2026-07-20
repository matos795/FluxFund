package com.fluxfund.api.domain.financialtransaction.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fluxfund.api.domain.account.Account;
import com.fluxfund.api.domain.account.AccountType;
import com.fluxfund.api.domain.account.mapper.AccountMapper;
import com.fluxfund.api.domain.account.repository.AccountRepository;
import com.fluxfund.api.domain.attachment.dto.AttachmentCountByTransactionProjection;
import com.fluxfund.api.domain.attachment.repository.AttachmentRepository;
import com.fluxfund.api.domain.audit.AuditAction;
import com.fluxfund.api.domain.audit.AuditEntityType;
import com.fluxfund.api.domain.audit.service.AuditLogService;
import com.fluxfund.api.domain.beneficiary.Beneficiary;
import com.fluxfund.api.domain.beneficiary.mapper.BeneficiaryMapper;
import com.fluxfund.api.domain.beneficiary.repository.BeneficiaryRepository;
import com.fluxfund.api.domain.category.Category;
import com.fluxfund.api.domain.category.mapper.CategoryMapper;
import com.fluxfund.api.domain.category.repository.CategoryRepository;
import com.fluxfund.api.domain.financialtransaction.FinancialTransaction;
import com.fluxfund.api.domain.financialtransaction.FinancialTransactionSource;
import com.fluxfund.api.domain.financialtransaction.FinancialTransactionStatus;
import com.fluxfund.api.domain.financialtransaction.FinancialTransactionType;
import com.fluxfund.api.domain.financialtransaction.FiscalDocumentPolicy;
import com.fluxfund.api.domain.financialtransaction.TransferDirection;
import com.fluxfund.api.domain.financialtransaction.dto.ClassificationSuggestionAllocationResponse;
import com.fluxfund.api.domain.financialtransaction.dto.ClassifyFinancialTransactionRequest;
import com.fluxfund.api.domain.financialtransaction.dto.CreateAccountTransferRequest;
import com.fluxfund.api.domain.financialtransaction.dto.CreateFinancialTransactionRequest;
import com.fluxfund.api.domain.financialtransaction.dto.FinancialTransactionClassificationSuggestionResponse;
import com.fluxfund.api.domain.financialtransaction.dto.FinancialTransactionResponse;
import com.fluxfund.api.domain.financialtransaction.dto.TransferMatchCandidateResponse;
import com.fluxfund.api.domain.financialtransaction.dto.TransferMatchSuggestionResponse;
import com.fluxfund.api.domain.financialtransaction.dto.UpdateFinancialTransactionRequest;
import com.fluxfund.api.domain.financialtransaction.mapper.FinancialTransactionMapper;
import com.fluxfund.api.domain.financialtransaction.repository.FinancialTransactionRepository;
import com.fluxfund.api.domain.financialtransaction.specification.FinancialTransactionSpecification;
import com.fluxfund.api.domain.fund.Fund;
import com.fluxfund.api.domain.fund.mapper.FundMapper;
import com.fluxfund.api.domain.fund.repository.FundRepository;
import com.fluxfund.api.domain.fundtransfer.repository.FundTransferRepository;
import com.fluxfund.api.domain.organization.Organization;
import com.fluxfund.api.domain.organization.repository.OrganizationRepository;
import com.fluxfund.api.domain.organizationsettings.OrganizationSettings;
import com.fluxfund.api.domain.organizationsettings.repository.OrganizationSettingsRepository;
import com.fluxfund.api.domain.transactionallocation.TransactionAllocation;
import com.fluxfund.api.domain.transactionallocation.dto.CreateTransactionAllocationRequest;
import com.fluxfund.api.domain.transactionallocation.dto.TransactionAllocationResponse;
import com.fluxfund.api.domain.transactionallocation.dto.UpdateTransactionAllocationRequest;
import com.fluxfund.api.domain.transactionallocation.mapper.TransactionAllocationMapper;
import com.fluxfund.api.domain.transactionallocation.repository.TransactionAllocationRepository;
import com.fluxfund.api.security.OrganizationAccessService;
import com.fluxfund.api.shared.exception.BusinessException;
import com.fluxfund.api.shared.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class FinancialTransactionService {

    private final FinancialTransactionRepository repository;
    private final TransactionAllocationRepository allocationRepository;
    private final OrganizationRepository organizationRepository;
    private final AccountRepository accountRepository;
    private final CategoryRepository categoryRepository;
    private final FundRepository fundRepository;
    private final BeneficiaryRepository beneficiaryRepository;
    private final OrganizationSettingsRepository organizationSettingsRepository;
    private final AttachmentRepository attachmentRepository;
    private final OrganizationAccessService organizationAccessService;
    private final AuditLogService auditLogService;
    private final FundTransferRepository fundTransferRepository;
    private final FinancialTransactionDocumentPolicyService documentPolicyService;

    public FinancialTransactionResponse create(UUID organizationId, CreateFinancialTransactionRequest request) {
        organizationAccessService.requireFinanceWriteAccess(organizationId);

        Organization organization = organizationRepository.findById(organizationId)
                .orElseThrow(() -> new ResourceNotFoundException("Organization not found"));

        Account account = accountRepository.findByIdAndOrganizationIdAndActiveTrue(request.accountId(), organizationId)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found"));

        Category category = null;

        if (request.categoryId() != null) {
            category = categoryRepository.findByIdAndOrganizationIdAndActiveTrue(request.categoryId(), organizationId)
                    .orElseThrow(() -> new ResourceNotFoundException("Category not found"));
        }

        validateCategoryMatchesTransactionType(request.type(), category);

        FinancialTransaction financialTransaction = FinancialTransactionMapper.createEntity(request, organization,
                account, category);

        normalizeTransactionStatusAndAmounts(financialTransaction);

        documentPolicyService.normalizeAndValidate(financialTransaction);

        addInitialAllocations(organizationId, financialTransaction, request.allocations());

        addDefaultFundAllocationIfNeeded(organizationId, financialTransaction);

        validateTotalAllocatedAmount(financialTransaction);

        validateFundNegativePolicy(
                organizationId,
                financialTransaction.getId(),
                Map.of(),
                toImpactByFund(financialTransaction.getAllocations()));

        repository.save(financialTransaction);

        auditLogService.record(
                organizationId,
                AuditEntityType.FINANCIAL_TRANSACTION,
                financialTransaction.getId(),
                AuditAction.CREATE,
                "Manual financial transaction created");

        return FinancialTransactionMapper.toResponse(financialTransaction);
    }

    @Transactional(readOnly = true)
    public Page<FinancialTransactionResponse> findAll(
            UUID organizationId,
            FinancialTransactionType type,
            FinancialTransactionStatus status,
            FinancialTransactionSource source,
            UUID accountId,
            UUID categoryId,
            String description,
            LocalDate settlementDateFrom,
            LocalDate settlementDateTo,
            Boolean onlyUnclassified,
            Boolean onlyUnallocated,
            UUID fundId,
            Pageable pageable) {
        organizationAccessService.requireReadAccess(organizationId);

        Page<FinancialTransaction> transactions = repository
                .findAll(FinancialTransactionSpecification.withFilters(
                        organizationId,
                        type,
                        status,
                        source,
                        accountId,
                        categoryId,
                        description,
                        settlementDateFrom,
                        settlementDateTo,
                        onlyUnclassified,
                        onlyUnallocated,
                        fundId),
                        pageable);

        List<UUID> transactionIds = transactions.getContent()
                .stream()
                .map(FinancialTransaction::getId)
                .toList();

        Map<UUID, AttachmentCountByTransactionProjection> attachmentCounts = transactionIds.isEmpty()
                ? Map.of()
                : attachmentRepository.countByTransactionIds(organizationId, transactionIds)
                        .stream()
                        .collect(Collectors.toMap(
                                AttachmentCountByTransactionProjection::financialTransactionId,
                                Function.identity()));

        return transactions.map(transaction -> {
            AttachmentCountByTransactionProjection count = attachmentCounts.get(transaction.getId());

            return FinancialTransactionMapper.toResponse(
                    transaction,
                    count != null ? count.totalCount() : 0,
                    count != null ? count.paymentProofCount() : 0,
                    count != null ? count.fiscalCount() : 0);
        });
    }

    @Transactional(readOnly = true)
    public FinancialTransactionResponse findById(UUID organizationId, UUID id) {
        organizationAccessService.requireReadAccess(organizationId);

        FinancialTransaction financialTransaction = findFinancialTransactionById(organizationId, id);

        return FinancialTransactionMapper.toResponse(financialTransaction);
    }

    public FinancialTransactionResponse update(
            UUID organizationId,
            UUID id,
            UpdateFinancialTransactionRequest request) {
        organizationAccessService.requireFinanceWriteAccess(organizationId);

        FinancialTransaction financialTransaction = findFinancialTransactionById(organizationId, id);

        FinancialTransactionType type = Objects.requireNonNullElse(request.type(), financialTransaction.getType());
        Category category = financialTransaction.getCategory();

        if (request.categoryId() != null) {
            category = categoryRepository
                    .findByIdAndOrganizationIdAndActiveTrue(request.categoryId(), organizationId)
                    .orElseThrow(() -> new ResourceNotFoundException("Category not found"));
        }

        validateTypeChangeAllowed(financialTransaction, type);

        validateCategoryMatchesTransactionType(type, category);

        validateSettlementRemovalAllowed(financialTransaction, request);

        FinancialTransactionMapper.updateEntity(financialTransaction, request, type, category);

        normalizeTransactionStatusAndAmounts(financialTransaction);

        documentPolicyService.normalizeAndValidate(financialTransaction);

        validateTotalAllocatedAmount(financialTransaction);

        repository.save(financialTransaction);

        auditLogService.record(
                organizationId,
                AuditEntityType.FINANCIAL_TRANSACTION,
                financialTransaction.getId(),
                AuditAction.UPDATE,
                "Financial transaction updated");

        return FinancialTransactionMapper.toResponse(financialTransaction);
    }

    public void delete(UUID organizationId, UUID id) {
        organizationAccessService.requireFinanceWriteAccess(organizationId);

        FinancialTransaction financialTransaction = findFinancialTransactionById(organizationId, id);

        if (financialTransaction.getStatus() == FinancialTransactionStatus.CANCELED) {
            throw new BusinessException("Transaction already canceled");
        }

        financialTransaction.setStatus(FinancialTransactionStatus.CANCELED);
        repository.save(financialTransaction);

        auditLogService.record(
                organizationId,
                AuditEntityType.FINANCIAL_TRANSACTION,
                financialTransaction.getId(),
                AuditAction.CANCEL,
                "Financial transaction canceled");
    }

    private FinancialTransaction findFinancialTransactionById(
            UUID organizationId,
            UUID id) {
        return repository.findByIdAndOrganizationId(id, organizationId)
                .orElseThrow(() -> new ResourceNotFoundException("FinancialTransaction not found"));
    }

    public FinancialTransactionResponse classify(
            UUID organizationId,
            UUID id,
            ClassifyFinancialTransactionRequest request) {
        organizationAccessService.requireFinanceWriteAccess(organizationId);

        FinancialTransaction financialTransaction = findFinancialTransactionById(organizationId, id);

        if (financialTransaction.getStatus() == FinancialTransactionStatus.CANCELED) {
            throw new BusinessException("Canceled transactions cannot be classified");
        }

        if (request.type() == FinancialTransactionType.TRANSFER) {
            return classifyAsTransfer(organizationId, financialTransaction, request);
        }

        Category category = null;

        if (request.type() != FinancialTransactionType.TRANSFER) {
            if (request.categoryId() == null) {
                throw new BusinessException("Category is required for income and expense transactions");
            }

            category = categoryRepository.findByIdAndOrganizationIdAndActiveTrue(request.categoryId(), organizationId)
                    .orElseThrow(() -> new ResourceNotFoundException("Category not found"));
        }

        if (request.type() == FinancialTransactionType.TRANSFER && request.categoryId() != null) {
            throw new BusinessException("Transfer transactions cannot have a category");
        }

        validateCategoryMatchesTransactionType(request.type(), category);

        financialTransaction.setType(request.type());
        financialTransaction.setCategory(category);
        financialTransaction.setDueDate(request.dueDate());
        financialTransaction.setSettlementDate(request.settlementDate());
        financialTransaction.setTransferDirection(null);
        financialTransaction.setTransferGroupId(null);
        financialTransaction.setTransferCounterpartyAccount(null);

        BigDecimal expectedAmount = Objects.requireNonNullElse(
                request.expectedAmount(),
                financialTransaction.getExpectedAmount());

        financialTransaction.setExpectedAmount(expectedAmount);

        financialTransaction.setSettledAmount(
                Objects.requireNonNullElse(request.settledAmount(), expectedAmount));

        if (request.description() != null) {
            financialTransaction.setDescription(request.description());
        }

        financialTransaction.setDocumentNumber(request.documentNumber());

        if (request.fiscalDocumentPolicy() != null) {
            financialTransaction.setFiscalDocumentPolicy(request.fiscalDocumentPolicy());
        }

        financialTransaction.setFiscalDocumentNote(request.fiscalDocumentNote());

        normalizeTransactionStatusAndAmounts(financialTransaction);

        documentPolicyService.normalizeAndValidate(financialTransaction);

        Map<UUID, BigDecimal> oldImpactByFund = toImpactByFund(
                financialTransaction.getAllocations());

        financialTransaction.getAllocations().clear();

        addInitialAllocations(organizationId, financialTransaction, request.allocations());

        addDefaultFundAllocationIfNeeded(organizationId, financialTransaction);

        validateTotalAllocatedAmount(financialTransaction);

        validateFundNegativePolicy(
                organizationId,
                financialTransaction.getId(),
                oldImpactByFund,
                toImpactByFund(financialTransaction.getAllocations()));

        repository.save(financialTransaction);

        auditLogService.record(
                organizationId,
                AuditEntityType.FINANCIAL_TRANSACTION,
                financialTransaction.getId(),
                AuditAction.CLASSIFY,
                "Financial transaction classified with category " + (category != null ? category.getId() : "<none>"));

        return FinancialTransactionMapper.toResponse(financialTransaction);
    }

    public TransactionAllocationResponse addAllocation(UUID organizationId, UUID id,
            CreateTransactionAllocationRequest request) {
        organizationAccessService.requireFinanceWriteAccess(organizationId);

        FinancialTransaction financialTransaction = findFinancialTransactionById(organizationId, id);

        TransactionAllocation allocation = buildAllocation(
                organizationId,
                financialTransaction,
                request);

        validateAllocationRules(allocation);

        validateFundNegativePolicy(
                organizationId,
                financialTransaction.getId(),
                Map.of(),
                singleImpact(allocation));

        financialTransaction.addAllocation(allocation);

        TransactionAllocation savedAllocation = allocationRepository.saveAndFlush(allocation);

        auditLogService.record(
                organizationId,
                AuditEntityType.TRANSACTION_ALLOCATION,
                savedAllocation.getId(),
                AuditAction.ADD_ALLOCATION,
                "Allocation added to transaction " + financialTransaction.getId());

        return TransactionAllocationMapper.toResponse(savedAllocation);
    }

    public List<TransactionAllocationResponse> addAllocationsBatch(
            UUID organizationId,
            UUID id,
            List<CreateTransactionAllocationRequest> requests) {

        organizationAccessService.requireFinanceWriteAccess(organizationId);

        FinancialTransaction financialTransaction = findFinancialTransactionById(organizationId, id);

        List<TransactionAllocation> allocations = requests.stream()
                .map(request -> buildAllocation(
                        organizationId,
                        financialTransaction,
                        request))
                .toList();

        for (TransactionAllocation allocation : allocations) {
            validateBasicAllocationRules(allocation);
            financialTransaction.addAllocation(allocation);
        }

        validateTotalAllocatedAmount(financialTransaction);

        validateFundNegativePolicy(
                organizationId,
                financialTransaction.getId(),
                Map.of(),
                toImpactByFund(allocations));

        List<TransactionAllocation> savedAllocations = allocationRepository.saveAllAndFlush(allocations);

        for (TransactionAllocation allocation : savedAllocations) {
            auditLogService.record(
                    organizationId,
                    AuditEntityType.TRANSACTION_ALLOCATION,
                    allocation.getId(),
                    AuditAction.ADD_ALLOCATION,
                    "Allocation added through batch to transaction "
                            + financialTransaction.getId());
        }

        return savedAllocations.stream()
                .map(TransactionAllocationMapper::toResponse)
                .toList();
    }

    public TransactionAllocationResponse updateAllocation(UUID organizationId, UUID id, UUID allocationId,
            UpdateTransactionAllocationRequest request) {
        organizationAccessService.requireFinanceWriteAccess(organizationId);

        FinancialTransaction financialTransaction = findFinancialTransactionById(organizationId, id);

        TransactionAllocation allocation = financialTransaction.getAllocations().stream()
                .filter(a -> a.getId().equals(allocationId))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("TransactionAllocation not found"));

        Map<UUID, BigDecimal> oldImpactByFund = singleImpact(allocation);

        Fund fund = null;
        if (request.fundId() != null) {
            fund = fundRepository.findByIdAndOrganizationIdAndActiveTrue(request.fundId(), organizationId)
                    .orElseThrow(() -> new ResourceNotFoundException("Fund not found"));
        }

        Beneficiary beneficiary = null;
        if (request.beneficiaryId() != null) {
            beneficiary = beneficiaryRepository
                    .findByIdAndOrganizationIdAndActiveTrue(request.beneficiaryId(), organizationId)
                    .orElseThrow(() -> new ResourceNotFoundException("Beneficiary not found"));
        }

        TransactionAllocationMapper.updateEntity(allocation, request, fund, beneficiary);

        validateBasicAllocationRules(allocation);
        validateTotalAllocatedAmount(financialTransaction);

        validateFundNegativePolicy(
                organizationId,
                financialTransaction.getId(),
                oldImpactByFund,
                singleImpact(allocation));

        repository.save(financialTransaction);

        auditLogService.record(
                organizationId,
                AuditEntityType.TRANSACTION_ALLOCATION,
                allocation.getId(),
                AuditAction.UPDATE_ALLOCATION,
                "Allocation updated for transaction " + financialTransaction.getId());

        return TransactionAllocationMapper.toResponse(allocation);
    }

    public void removeAllocation(UUID organizationId, UUID id, UUID allocationId) {
        organizationAccessService.requireFinanceWriteAccess(organizationId);

        FinancialTransaction financialTransaction = findFinancialTransactionById(organizationId, id);

        TransactionAllocation allocation = financialTransaction.getAllocations().stream()
                .filter(a -> a.getId().equals(allocationId))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("TransactionAllocation not found"));

        financialTransaction.removeAllocation(allocation);

        repository.save(financialTransaction);

        auditLogService.record(
                organizationId,
                AuditEntityType.TRANSACTION_ALLOCATION,
                allocationId,
                AuditAction.REMOVE_ALLOCATION,
                "Allocation removed from transaction " + financialTransaction.getId());
    }

    @Transactional(readOnly = true)
    public List<TransactionAllocationResponse> findAllByTransaction(
            UUID organizationId,
            UUID transactionId) {
        organizationAccessService.requireReadAccess(organizationId);

        FinancialTransaction transaction = repository
                .findByIdAndOrganizationId(transactionId, organizationId)
                .orElseThrow(() -> new ResourceNotFoundException("Financial transaction not found"));

        return transaction.getAllocations()
                .stream()
                .map(TransactionAllocationMapper::toResponse)
                .toList();
    }

    @Transactional
    public List<FinancialTransactionResponse> createAccountTransfer(
            UUID organizationId,
            CreateAccountTransferRequest request) {

        organizationAccessService.requireFinanceWriteAccess(organizationId);

        if (request.sourceAccountId().equals(request.destinationAccountId())) {
            throw new BusinessException("Source and destination accounts must be different");
        }

        Account sourceAccount = accountRepository
                .findByIdAndOrganizationIdAndActiveTrue(request.sourceAccountId(), organizationId)
                .orElseThrow(() -> new ResourceNotFoundException("Source account not found"));

        Account destinationAccount = accountRepository
                .findByIdAndOrganizationIdAndActiveTrue(request.destinationAccountId(), organizationId)
                .orElseThrow(() -> new ResourceNotFoundException("Destination account not found"));

        if (sourceAccount.getType() == AccountType.CREDIT_CARD
                || destinationAccount.getType() == AccountType.CREDIT_CARD) {
            throw new BusinessException("Credit card accounts cannot be used in account transfers");
        }

        UUID transferGroupId = UUID.randomUUID();

        String description = request.description() != null && !request.description().isBlank()
                ? request.description().trim()
                : "Transferência entre contas";

        FinancialTransaction outTransaction = new FinancialTransaction();

        outTransaction.setOrganization(sourceAccount.getOrganization());
        outTransaction.setAccount(sourceAccount);
        outTransaction.setType(FinancialTransactionType.TRANSFER);
        outTransaction.setSource(FinancialTransactionSource.MANUAL);
        outTransaction.setStatus(FinancialTransactionStatus.SETTLED);
        outTransaction.setTransferDirection(TransferDirection.OUT);
        outTransaction.setTransferGroupId(transferGroupId);
        outTransaction.setTransferCounterpartyAccount(destinationAccount);
        outTransaction.setCategory(null);
        outTransaction.setDueDate(request.transferDate());
        outTransaction.setSettlementDate(request.transferDate());
        outTransaction.setExpectedAmount(request.amount());
        outTransaction.setSettledAmount(request.amount());
        outTransaction.setInterestAmount(BigDecimal.ZERO);
        outTransaction.setDiscountAmount(BigDecimal.ZERO);
        outTransaction.setDescription(description);
        outTransaction.setRawDescription(description);
        outTransaction.setClassifiedAt(null);

        FinancialTransaction inTransaction = new FinancialTransaction();

        inTransaction.setOrganization(sourceAccount.getOrganization());
        inTransaction.setAccount(destinationAccount);
        inTransaction.setType(FinancialTransactionType.TRANSFER);
        inTransaction.setSource(FinancialTransactionSource.MANUAL);
        inTransaction.setStatus(FinancialTransactionStatus.SETTLED);
        inTransaction.setTransferDirection(TransferDirection.IN);
        inTransaction.setTransferGroupId(transferGroupId);
        inTransaction.setTransferCounterpartyAccount(sourceAccount);
        inTransaction.setCategory(null);
        inTransaction.setDueDate(request.transferDate());
        inTransaction.setSettlementDate(request.transferDate());
        inTransaction.setExpectedAmount(request.amount());
        inTransaction.setSettledAmount(request.amount());
        inTransaction.setInterestAmount(BigDecimal.ZERO);
        inTransaction.setDiscountAmount(BigDecimal.ZERO);
        inTransaction.setDescription(description);
        inTransaction.setRawDescription(description);
        inTransaction.setClassifiedAt(null);

        FinancialTransaction savedOut = repository.save(outTransaction);
        FinancialTransaction savedIn = repository.save(inTransaction);

        return List.of(
                FinancialTransactionMapper.toResponse(savedOut),
                FinancialTransactionMapper.toResponse(savedIn));
    }

    @Transactional
    public void cancelAccountTransfer(UUID organizationId, UUID transactionId) {
        organizationAccessService.requireFinanceWriteAccess(organizationId);

        FinancialTransaction transaction = repository
                .findByIdAndOrganizationId(transactionId, organizationId)
                .orElseThrow(() -> new ResourceNotFoundException("Financial transaction not found"));

        if (transaction.getType() != FinancialTransactionType.TRANSFER) {
            throw new BusinessException("Transaction is not an account transfer");
        }

        if (transaction.getTransferGroupId() == null) {
            throw new BusinessException("Transfer group not found");
        }

        List<FinancialTransaction> transferTransactions = repository.findAllByOrganizationIdAndTransferGroupId(
                organizationId,
                transaction.getTransferGroupId());

        if (transferTransactions.isEmpty()) {
            throw new BusinessException("No transactions found for this transfer group");
        }

        for (FinancialTransaction transferTransaction : transferTransactions) {
            if (transferTransaction.getStatus() == FinancialTransactionStatus.CANCELED) {
                continue;
            }

            transferTransaction.setStatus(FinancialTransactionStatus.CANCELED);
        }

        repository.saveAll(transferTransactions);

        auditLogService.record(
                organizationId,
                AuditEntityType.FINANCIAL_TRANSACTION,
                transaction.getId(),
                AuditAction.CANCEL,
                "Account transfer canceled. transferGroupId=%s"
                        .formatted(transaction.getTransferGroupId()));
    }

    @Transactional(readOnly = true)
    public FinancialTransactionClassificationSuggestionResponse getClassificationSuggestion(
            UUID organizationId,
            UUID id) {
        organizationAccessService.requireReadAccess(organizationId);

        FinancialTransaction currentTransaction = findFinancialTransactionById(
                organizationId,
                id);

        if (currentTransaction.getStatus() == FinancialTransactionStatus.CANCELED) {
            return FinancialTransactionClassificationSuggestionResponse.unavailable();
        }

        if (currentTransaction.getCategory() != null) {
            return FinancialTransactionClassificationSuggestionResponse.unavailable();
        }

        String rawDescription = normalizeSuggestionText(
                currentTransaction.getRawDescription());

        if (rawDescription == null) {
            return FinancialTransactionClassificationSuggestionResponse.unavailable();
        }

        List<FinancialTransaction> candidates = repository.findClassificationSuggestionCandidates(
                organizationId,
                currentTransaction.getId(),
                rawDescription,
                PageRequest.of(0, 1));

        System.out.println("=== CLASSIFICATION SUGGESTION DEBUG ===");
        System.out.println("Current transaction id: " + currentTransaction.getId());
        System.out.println("Current category: " + currentTransaction.getCategory());
        System.out.println("Current rawDescription: [" + currentTransaction.getRawDescription() + "]");
        System.out.println("Normalized rawDescription: [" + rawDescription + "]");
        System.out.println("Candidates found: " + candidates.size());

        if (candidates.isEmpty()) {
            return FinancialTransactionClassificationSuggestionResponse.unavailable();
        }

        FinancialTransaction baseTransaction = candidates.get(0);

        BigDecimal currentAmount = getSuggestionAmount(currentTransaction);

        List<ClassificationSuggestionAllocationResponse> suggestedAllocations = buildSuggestedAllocations(
                baseTransaction, currentAmount);

        return new FinancialTransactionClassificationSuggestionResponse(
                true,
                "HISTORY",
                baseTransaction.getId(),
                baseTransaction.getType(),
                CategoryMapper.toSummary(baseTransaction.getCategory()),
                baseTransaction.getDescription(),
                suggestedAllocations);
    }

    @Transactional(readOnly = true)
    public TransferMatchSuggestionResponse getTransferMatchSuggestion(

            UUID organizationId,
            UUID transactionId) {

        organizationAccessService
                .requireReadAccess(
                        organizationId);

        FinancialTransaction current = findFinancialTransactionById(
                organizationId,
                transactionId);

        if (!isEligibleForTransferMatching(current)) {

            return TransferMatchSuggestionResponse
                    .unavailable();
        }

        FinancialTransactionType oppositeType = current.getType() == FinancialTransactionType.EXPENSE

                ? FinancialTransactionType.INCOME

                : FinancialTransactionType.EXPENSE;

        TransferDirection suggestedDirection = current.getType() == FinancialTransactionType.EXPENSE

                ? TransferDirection.OUT

                : TransferDirection.IN;

        BigDecimal amount = getSuggestionAmount(current);

        LocalDate currentDate = current.getSettlementDate();

        List<TransferMatchCandidateResponse> candidates = repository
                .findTransferMatchCandidates(
                        organizationId,
                        current.getId(),
                        current.getAccount().getId(),
                        oppositeType,
                        amount,
                        currentDate.minusDays(3),
                        currentDate.plusDays(3))
                .stream()
                .sorted(Comparator.comparingLong(candidate -> Math.abs(
                        ChronoUnit.DAYS.between(currentDate, candidate.getSettlementDate()))))
                .limit(5)
                .map(candidate -> new TransferMatchCandidateResponse(

                        candidate.getId(),

                        AccountMapper
                                .toSummaryResponse(
                                        candidate.getAccount()),

                        candidate.getSettlementDate(),

                        getSuggestionAmount(
                                candidate),

                        resolveSuggestionDescription(
                                candidate),

                        Math.abs(
                                ChronoUnit.DAYS
                                        .between(
                                                currentDate,
                                                candidate
                                                        .getSettlementDate()))))
                .toList();

        return new TransferMatchSuggestionResponse(
                !candidates.isEmpty(),
                suggestedDirection,
                candidates);
    }

    public List<FinancialTransactionResponse> pairTransferTransactions(

            UUID organizationId,

            UUID transactionId,

            UUID matchingTransactionId) {

        organizationAccessService
                .requireFinanceWriteAccess(
                        organizationId);

        FinancialTransaction current = findFinancialTransactionById(
                organizationId,
                transactionId);

        FinancialTransaction matching = findFinancialTransactionById(
                organizationId,
                matchingTransactionId);

        validateTransferPair(
                current,
                matching);

        TransferDirection currentDirection = current.getType() == FinancialTransactionType.EXPENSE

                ? TransferDirection.OUT

                : TransferDirection.IN;

        TransferDirection matchingDirection = currentDirection == TransferDirection.OUT

                ? TransferDirection.IN

                : TransferDirection.OUT;

        UUID transferGroupId = UUID.randomUUID();

        prepareTransferSide(

                current,

                currentDirection,

                matching.getAccount(),

                transferGroupId);

        prepareTransferSide(

                matching,

                matchingDirection,

                current.getAccount(),

                transferGroupId);

        List<FinancialTransaction> saved = repository.saveAll(
                List.of(
                        current,
                        matching));

        auditLogService.record(

                organizationId,

                AuditEntityType.FINANCIAL_TRANSACTION,

                current.getId(),

                AuditAction.CLASSIFY,

                "Matched account transfer with transaction "
                        + matching.getId());

        auditLogService.record(

                organizationId,

                AuditEntityType.FINANCIAL_TRANSACTION,

                matching.getId(),

                AuditAction.CLASSIFY,

                "Matched account transfer with transaction "
                        + current.getId());

        return saved.stream()
                .map(
                        FinancialTransactionMapper::toResponse)
                .toList();
    }

    private TransactionAllocation buildAllocation(
            UUID organizationId,
            FinancialTransaction financialTransaction,
            CreateTransactionAllocationRequest request) {

        Fund fund = fundRepository
                .findByIdAndOrganizationIdAndActiveTrue(request.fundId(), organizationId)
                .orElseThrow(() -> new ResourceNotFoundException("Fund not found"));

        Beneficiary beneficiary = null;

        if (request.beneficiaryId() != null) {
            beneficiary = beneficiaryRepository
                    .findByIdAndOrganizationIdAndActiveTrue(request.beneficiaryId(), organizationId)
                    .orElseThrow(() -> new ResourceNotFoundException("Beneficiary not found"));
        }

        return TransactionAllocationMapper.createEntity(request, financialTransaction, fund, beneficiary);
    }

    private void addInitialAllocations(
            UUID organizationId,
            FinancialTransaction financialTransaction,
            List<CreateTransactionAllocationRequest> allocations) {

        if (allocations == null || allocations.isEmpty()) {
            return;
        }

        for (CreateTransactionAllocationRequest allocationRequest : allocations) {
            TransactionAllocation allocation = buildAllocation(
                    organizationId,
                    financialTransaction,
                    allocationRequest);

            validateBasicAllocationRules(allocation);

            financialTransaction.addAllocation(allocation);
        }
    }

    private void normalizeTransactionStatusAndAmounts(FinancialTransaction transaction) {

        if (transaction.getCategory() != null && transaction.getClassifiedAt() == null) {
            transaction.setClassifiedAt(LocalDateTime.now());
        }

        if (transaction.getSettlementDate() == null) {
            transaction.setStatus(FinancialTransactionStatus.PENDING);
            transaction.setSettledAmount(null);
            transaction.setInterestAmount(BigDecimal.ZERO);
            transaction.setDiscountAmount(BigDecimal.ZERO);
            return;
        }

        transaction.setStatus(FinancialTransactionStatus.SETTLED);

        BigDecimal settled = Objects.requireNonNullElse(
                transaction.getSettledAmount(),
                transaction.getExpectedAmount());

        transaction.setSettledAmount(settled);

        BigDecimal difference = settled.subtract(transaction.getExpectedAmount());

        if (difference.compareTo(BigDecimal.ZERO) > 0) {
            transaction.setInterestAmount(difference);
            transaction.setDiscountAmount(BigDecimal.ZERO);
        } else if (difference.compareTo(BigDecimal.ZERO) < 0) {
            transaction.setDiscountAmount(difference.abs());
            transaction.setInterestAmount(BigDecimal.ZERO);
        } else {
            transaction.setInterestAmount(BigDecimal.ZERO);
            transaction.setDiscountAmount(BigDecimal.ZERO);
        }
    }

    private void validateAllocationRules(TransactionAllocation allocation) {

        if (allocation.getFinancialTransaction().getType() == FinancialTransactionType.TRANSFER) {
            throw new BusinessException(
                    "Transfer transactions cannot have allocations");
        }

        if (allocation.getAmount().abs().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessException("Amount must be greater than zero");
        }

        BigDecimal allocatedAmount = allocationRepository.sumAmountByFinancialTransactionId(
                allocation.getFinancialTransaction().getId());

        BigDecimal newTotal = allocatedAmount.add(allocation.getAmount().abs());

        if (allocation.getFinancialTransaction().getStatus() != FinancialTransactionStatus.SETTLED) {
            throw new BusinessException(
                    "Only settled transactions can receive allocations");
        }

        if (newTotal.compareTo(
                allocation.getFinancialTransaction().getSettledAmount().abs()) > 0) {

            throw new BusinessException(
                    "Allocated amount exceeds transaction amount");
        }
    }

    private void validateBasicAllocationRules(TransactionAllocation allocation) {

        if (allocation.getFinancialTransaction().getType() == FinancialTransactionType.TRANSFER) {
            throw new BusinessException("Transfer transactions cannot have allocations");
        }

        if (allocation.getAmount().abs().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessException("Amount must be greater than zero");
        }

        if (allocation.getFinancialTransaction().getStatus() != FinancialTransactionStatus.SETTLED) {
            throw new BusinessException("Only settled transactions can receive allocations");
        }
    }

    private void validateTotalAllocatedAmount(FinancialTransaction transaction) {

        if (transaction.getAllocations() == null || transaction.getAllocations().isEmpty()) {
            return;
        }

        if (transaction.getStatus() != FinancialTransactionStatus.SETTLED) {
            throw new BusinessException("Only settled transactions can have allocations");
        }

        BigDecimal totalAllocated = transaction.getAllocations().stream()
                .map(TransactionAllocation::getAmount)
                .map(BigDecimal::abs)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal transactionAmount = transaction.getSettledAmount().abs();

        if (totalAllocated.compareTo(transactionAmount) > 0) {
            throw new BusinessException("Allocated amount exceeds transaction amount");
        }
    }

    private void validateCategoryMatchesTransactionType(
            FinancialTransactionType transactionType,
            Category category) {

        if (category == null) {
            return;
        }

        if (transactionType == FinancialTransactionType.TRANSFER) {
            throw new BusinessException("Transfer transactions cannot have category");
        }

        if (category.getType().name().equals(transactionType.name())) {
            return;
        }

        throw new BusinessException("Category type must match transaction type");
    }

    private void validateTypeChangeAllowed(
            FinancialTransaction transaction,
            FinancialTransactionType newType) {

        if (newType == transaction.getType()) {
            return;
        }

        if (transaction.getAllocations() != null && !transaction.getAllocations().isEmpty()) {
            throw new BusinessException("Transaction type cannot be changed when allocations exist");
        }
    }

    private void validateSettlementRemovalAllowed(
            FinancialTransaction transaction,
            UpdateFinancialTransactionRequest request) {

        boolean isSettled = transaction.getStatus() == FinancialTransactionStatus.SETTLED;

        boolean isRemovingSettlement = request.settlementDate() == null
                && request.settledAmount() == null;

        boolean hasAllocations = transaction.getAllocations() != null
                && !transaction.getAllocations().isEmpty();

        if (isSettled && isRemovingSettlement && hasAllocations) {
            throw new BusinessException(
                    "Cannot remove settlement from a transaction that has allocations");
        }
    }

    private void addDefaultFundAllocationIfNeeded(
            UUID organizationId,
            FinancialTransaction financialTransaction) {
        if (financialTransaction.getType() == FinancialTransactionType.TRANSFER) {
            return;
        }

        if (financialTransaction.getStatus() != FinancialTransactionStatus.SETTLED) {
            return;
        }

        if (financialTransaction.getCategory() == null) {
            return;
        }

        if (financialTransaction.getSettledAmount() == null) {
            return;
        }

        if (financialTransaction.getAllocations() != null
                && !financialTransaction.getAllocations().isEmpty()) {
            return;
        }

        Fund defaultFund = organizationSettingsRepository.findByOrganizationId(organizationId)
                .map(settings -> settings.getDefaultFund())
                .orElse(null);

        if (defaultFund == null) {
            return;
        }

        CreateTransactionAllocationRequest allocationRequest = new CreateTransactionAllocationRequest(
                defaultFund.getId(),
                null,
                financialTransaction.getSettledAmount().abs(),
                financialTransaction.getSettlementDate().withDayOfMonth(1));

        TransactionAllocation allocation = buildAllocation(
                organizationId,
                financialTransaction,
                allocationRequest);

        validateBasicAllocationRules(allocation);

        financialTransaction.addAllocation(allocation);
    }

    private OrganizationSettings getOrganizationSettings(UUID organizationId) {
        return organizationSettingsRepository.findByOrganizationId(organizationId)
                .orElse(null);
    }

    private void validateFundNegativePolicy(
            UUID organizationId,
            UUID currentTransactionId,
            Map<UUID, BigDecimal> oldImpactByFund,
            Map<UUID, BigDecimal> newImpactByFund) {

        OrganizationSettings settings = getOrganizationSettings(organizationId);

        if (settings == null || settings.isAllowNegativeFunds()) {
            return;
        }

        Map<UUID, BigDecimal> allImpactedFunds = new HashMap<>();

        oldImpactByFund.forEach((fundId, amount) -> allImpactedFunds.merge(fundId, BigDecimal.ZERO, BigDecimal::add));

        newImpactByFund.forEach((fundId, amount) -> allImpactedFunds.merge(fundId, BigDecimal.ZERO, BigDecimal::add));

        for (UUID fundId : allImpactedFunds.keySet()) {
            Fund fund = fundRepository
                    .findByIdAndOrganizationIdAndActiveTrue(fundId, organizationId)
                    .orElseThrow(() -> new ResourceNotFoundException("Fund not found"));

            BigDecimal currentBalance = calculateCurrentFundBalance(
                    organizationId,
                    fund,
                    currentTransactionId);

            BigDecimal newImpact = newImpactByFund.getOrDefault(
                    fundId,
                    BigDecimal.ZERO);

            BigDecimal projectedBalance = currentBalance.add(newImpact);

            boolean fundWasAlreadyNegative = currentBalance.compareTo(BigDecimal.ZERO) < 0;

            boolean projectedIsNegative = projectedBalance.compareTo(BigDecimal.ZERO) < 0;

            boolean gotWorse = projectedBalance.compareTo(currentBalance) < 0;

            if (!fundWasAlreadyNegative && projectedIsNegative) {
                throw new BusinessException(
                        "A alocação deixaria o fundo '" + fund.getName() + "' negativo.");
            }

            if (fundWasAlreadyNegative && gotWorse) {
                throw new BusinessException(
                        "O fundo '" + fund.getName() + "' já está negativo e esta operação pioraria o saldo.");
            }
        }
    }

    private Map<UUID, BigDecimal> toImpactByFund(List<TransactionAllocation> allocations) {
        if (allocations == null || allocations.isEmpty()) {
            return Map.of();
        }

        return allocations.stream()
                .collect(Collectors.groupingBy(
                        allocation -> allocation.getFund().getId(),
                        Collectors.mapping(
                                TransactionAllocation::getAmount,
                                Collectors.reducing(BigDecimal.ZERO, BigDecimal::add))));
    }

    private Map<UUID, BigDecimal> singleImpact(TransactionAllocation allocation) {
        return Map.of(
                allocation.getFund().getId(),
                allocation.getAmount());
    }

    private BigDecimal calculateCurrentFundBalance(
            UUID organizationId,
            Fund fund,
            UUID excludedTransactionId) {

        BigDecimal allocationsSum = excludedTransactionId != null
                ? allocationRepository.sumAmountByFundIdExcludingTransaction(
                        organizationId,
                        fund.getId(),
                        excludedTransactionId)
                : allocationRepository.sumAmountByFundId(
                        organizationId,
                        fund.getId());

        BigDecimal transferSum = fundTransferRepository.sumNetAmountByFundId(
                organizationId,
                fund.getId());

        return fund.getInitialBalance()
                .add(allocationsSum)
                .add(transferSum);
    }

    private FinancialTransactionResponse classifyAsTransfer(
            UUID organizationId,
            FinancialTransaction financialTransaction,
            ClassifyFinancialTransactionRequest request) {

        if (request.transferDirection() == null) {
            throw new BusinessException("Transfer direction is required");
        }

        if (request.transferCounterpartyAccountId() == null) {
            throw new BusinessException("Transfer counterparty account is required");
        }

        if (financialTransaction.getAccount().getId().equals(request.transferCounterpartyAccountId())) {
            throw new BusinessException("Transfer counterparty account must be different from transaction account");
        }

        Account counterpartyAccount = accountRepository
                .findByIdAndOrganizationIdAndActiveTrue(
                        request.transferCounterpartyAccountId(),
                        organizationId)
                .orElseThrow(() -> new ResourceNotFoundException("Transfer counterparty account not found"));

        if (counterpartyAccount.getType() == AccountType.CREDIT_CARD) {
            throw new BusinessException("Credit card accounts cannot be used in account transfers");
        }

        Map<UUID, BigDecimal> oldImpactByFund = toImpactByFund(
                financialTransaction.getAllocations());

        financialTransaction.setType(FinancialTransactionType.TRANSFER);
        financialTransaction.setCategory(null);

        financialTransaction.setFiscalDocumentPolicy(FiscalDocumentPolicy.CATEGORY);
        financialTransaction.setFiscalDocumentNote(null);

        financialTransaction.setTransferDirection(request.transferDirection());
        financialTransaction.setTransferCounterpartyAccount(counterpartyAccount);

        if (financialTransaction.getTransferGroupId() == null) {
            financialTransaction.setTransferGroupId(UUID.randomUUID());
        }

        LocalDate settlementDate = request.settlementDate();

        financialTransaction.setDueDate(
                request.dueDate() != null ? request.dueDate() : settlementDate);
        financialTransaction.setSettlementDate(settlementDate);

        BigDecimal amount = Objects.requireNonNullElse(
                request.settledAmount(),
                Objects.requireNonNullElse(
                        request.expectedAmount(),
                        financialTransaction.getSettledAmount() != null
                                ? financialTransaction.getSettledAmount()
                                : financialTransaction.getExpectedAmount()));

        financialTransaction.setExpectedAmount(amount.abs());
        financialTransaction.setSettledAmount(amount.abs());

        if (request.description() != null) {
            financialTransaction.setDescription(request.description());
        }

        financialTransaction.setDocumentNumber(request.documentNumber());
        financialTransaction.setClassifiedAt(LocalDateTime.now());

        financialTransaction.getAllocations().clear();

        normalizeTransactionStatusAndAmounts(financialTransaction);

        validateFundNegativePolicy(
                organizationId,
                financialTransaction.getId(),
                oldImpactByFund,
                Map.of());

        FinancialTransaction savedTransaction = repository.save(financialTransaction);

        auditLogService.record(
                organizationId,
                AuditEntityType.FINANCIAL_TRANSACTION,
                financialTransaction.getId(),
                AuditAction.CLASSIFY,
                "Financial transaction classified as transfer");

        return FinancialTransactionMapper.toResponse(savedTransaction);
    }

    private String normalizeSuggestionText(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

        return value.trim();
    }

    private BigDecimal getSuggestionAmount(FinancialTransaction transaction) {
        BigDecimal amount = transaction.getSettledAmount() != null
                ? transaction.getSettledAmount()
                : transaction.getExpectedAmount();

        return amount.abs();
    }

    private List<ClassificationSuggestionAllocationResponse> buildSuggestedAllocations(
            FinancialTransaction baseTransaction,
            BigDecimal currentAmount) {

        if (baseTransaction.getAllocations() == null
                || baseTransaction.getAllocations().isEmpty()
                || currentAmount == null
                || currentAmount.compareTo(BigDecimal.ZERO) <= 0) {
            return List.of();
        }

        List<TransactionAllocation> baseAllocations = baseTransaction.getAllocations()
                .stream()
                .filter(allocation -> allocation.getFund() != null)
                .toList();

        if (baseAllocations.isEmpty()) {
            return List.of();
        }

        if (baseAllocations.size() == 1) {
            TransactionAllocation allocation = baseAllocations.get(0);

            return List.of(
                    new ClassificationSuggestionAllocationResponse(
                            FundMapper.toSummaryResponse(allocation.getFund()),
                            allocation.getBeneficiary() != null
                                    ? BeneficiaryMapper.toSummaryResponse(allocation.getBeneficiary())
                                    : null,
                            currentAmount,
                            allocation.getReferenceMonth(),
                            "HISTORY"));
        }

        BigDecimal previousTotal = baseAllocations.stream()
                .map(TransactionAllocation::getAmount)
                .map(BigDecimal::abs)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        if (previousTotal.compareTo(BigDecimal.ZERO) <= 0) {
            return List.of();
        }

        List<ClassificationSuggestionAllocationResponse> suggestions = new java.util.ArrayList<>();

        BigDecimal remainingAmount = currentAmount;

        for (int index = 0; index < baseAllocations.size(); index++) {
            TransactionAllocation allocation = baseAllocations.get(index);

            BigDecimal suggestedAmount;

            boolean isLast = index == baseAllocations.size() - 1;

            if (isLast) {
                suggestedAmount = remainingAmount;
            } else {
                suggestedAmount = allocation.getAmount()
                        .abs()
                        .multiply(currentAmount)
                        .divide(previousTotal, 2, RoundingMode.HALF_UP);

                remainingAmount = remainingAmount.subtract(suggestedAmount);
            }

            if (suggestedAmount.compareTo(BigDecimal.ZERO) <= 0) {
                continue;
            }

            suggestions.add(
                    new ClassificationSuggestionAllocationResponse(
                            FundMapper.toSummaryResponse(allocation.getFund()),
                            allocation.getBeneficiary() != null
                                    ? BeneficiaryMapper.toSummaryResponse(allocation.getBeneficiary())
                                    : null,
                            suggestedAmount,
                            allocation.getReferenceMonth(),
                            "HISTORY"));
        }

        return suggestions;
    }

    private boolean isEligibleForTransferMatching(
            FinancialTransaction transaction) {

        if (transaction.getStatus() != FinancialTransactionStatus.SETTLED) {

            return false;
        }

        if (transaction.getAccount().getType() == AccountType.CREDIT_CARD) {

            return false;
        }

        if (transaction.getType() != FinancialTransactionType.INCOME
                && transaction.getType() != FinancialTransactionType.EXPENSE) {

            return false;
        }

        if (transaction.getCategory() != null) {
            return false;
        }

        if (transaction.getSettlementDate() == null) {
            return false;
        }

        return transaction.getAllocations() == null
                || transaction.getAllocations().isEmpty();
    }

    private String resolveSuggestionDescription(
            FinancialTransaction transaction) {

        if (transaction.getDescription() != null
                && !transaction
                        .getDescription()
                        .isBlank()) {

            return transaction
                    .getDescription()
                    .trim();
        }

        if (transaction.getRawDescription() != null
                && !transaction
                        .getRawDescription()
                        .isBlank()) {

            return transaction
                    .getRawDescription()
                    .trim();
        }

        return "Transferência sem descrição";
    }

    private void validateTransferPair(

            FinancialTransaction current,

            FinancialTransaction matching) {

        if (current.getId().equals(
                matching.getId())) {

            throw new BusinessException(
                    "A transaction cannot be paired with itself");
        }

        if (!isEligibleForTransferMatching(current)
                || !isEligibleForTransferMatching(
                        matching)) {

            throw new BusinessException(
                    "Both transactions must be settled and unclassified");
        }

        if (current.getAccount().getId().equals(
                matching.getAccount().getId())) {

            throw new BusinessException(
                    "Transfer transactions must belong to different accounts");
        }

        boolean oppositeTypes = current.getType() == FinancialTransactionType.EXPENSE
                && matching.getType() == FinancialTransactionType.INCOME

                || current.getType() == FinancialTransactionType.INCOME
                        && matching.getType() == FinancialTransactionType.EXPENSE;

        if (!oppositeTypes) {

            throw new BusinessException(
                    "Transfer transactions must have opposite movements");
        }

        BigDecimal currentAmount = getSuggestionAmount(current);

        BigDecimal matchingAmount = getSuggestionAmount(matching);

        if (currentAmount.compareTo(
                matchingAmount) != 0) {

            throw new BusinessException(
                    "Transfer transaction amounts must match");
        }

        long dateDistance = Math.abs(
                ChronoUnit.DAYS.between(

                        current.getSettlementDate(),

                        matching.getSettlementDate()));

        if (dateDistance > 3) {

            throw new BusinessException(
                    "Transfer transaction dates are too far apart");
        }
    }

    private void prepareTransferSide(

            FinancialTransaction transaction,

            TransferDirection direction,

            Account counterpartyAccount,

            UUID transferGroupId) {

        BigDecimal amount = getSuggestionAmount(
                transaction);

        transaction.setType(
                FinancialTransactionType.TRANSFER);

        transaction.setCategory(null);

        transaction.getAllocations().clear();

        transaction.setTransferDirection(
                direction);

        transaction.setTransferCounterpartyAccount(
                counterpartyAccount);

        transaction.setTransferGroupId(
                transferGroupId);

        transaction.setExpectedAmount(
                amount);

        transaction.setSettledAmount(
                amount);

        transaction.setFiscalDocumentPolicy(
                FiscalDocumentPolicy.CATEGORY);

        transaction.setFiscalDocumentNote(null);

        transaction.setClassifiedAt(
                LocalDateTime.now());
    }
}