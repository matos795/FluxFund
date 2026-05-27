package com.fluxfund.api.domain.financialtransaction.service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fluxfund.api.domain.account.Account;
import com.fluxfund.api.domain.account.repository.AccountRepository;
import com.fluxfund.api.domain.beneficiary.Beneficiary;
import com.fluxfund.api.domain.beneficiary.repository.BeneficiaryRepository;
import com.fluxfund.api.domain.category.Category;
import com.fluxfund.api.domain.category.repository.CategoryRepository;
import com.fluxfund.api.domain.financialtransaction.FinancialTransaction;
import com.fluxfund.api.domain.financialtransaction.FinancialTransactionSource;
import com.fluxfund.api.domain.financialtransaction.FinancialTransactionStatus;
import com.fluxfund.api.domain.financialtransaction.FinancialTransactionType;
import com.fluxfund.api.domain.financialtransaction.dto.ClassifyFinancialTransactionRequest;
import com.fluxfund.api.domain.financialtransaction.dto.CreateFinancialTransactionRequest;
import com.fluxfund.api.domain.financialtransaction.dto.FinancialTransactionResponse;
import com.fluxfund.api.domain.financialtransaction.dto.UpdateFinancialTransactionRequest;
import com.fluxfund.api.domain.financialtransaction.mapper.FinancialTransactionMapper;
import com.fluxfund.api.domain.financialtransaction.repository.FinancialTransactionRepository;
import com.fluxfund.api.domain.financialtransaction.specification.FinancialTransactionSpecification;
import com.fluxfund.api.domain.fund.Fund;
import com.fluxfund.api.domain.fund.repository.FundRepository;
import com.fluxfund.api.domain.organization.Organization;
import com.fluxfund.api.domain.organization.OrganizationRepository;
import com.fluxfund.api.domain.organizationsettings.repository.OrganizationSettingsRepository;
import com.fluxfund.api.domain.transactionallocation.TransactionAllocation;
import com.fluxfund.api.domain.transactionallocation.dto.CreateTransactionAllocationRequest;
import com.fluxfund.api.domain.transactionallocation.dto.TransactionAllocationResponse;
import com.fluxfund.api.domain.transactionallocation.dto.UpdateTransactionAllocationRequest;
import com.fluxfund.api.domain.transactionallocation.mapper.TransactionAllocationMapper;
import com.fluxfund.api.domain.transactionallocation.repository.TransactionAllocationRepository;
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

    public FinancialTransactionResponse create(UUID organizationId, CreateFinancialTransactionRequest request) {

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

        addInitialAllocations(organizationId, financialTransaction, request.allocations());

        addDefaultFundAllocationIfNeeded(organizationId, financialTransaction);

        validateTotalAllocatedAmount(financialTransaction);

        repository.save(financialTransaction);

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

        return repository
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
                        pageable)
                .map(FinancialTransactionMapper::toResponse);
    }

    @Transactional(readOnly = true)
    public FinancialTransactionResponse findById(UUID organizationId, UUID id) {

        FinancialTransaction financialTransaction = findFinancialTransactionById(organizationId, id);

        return FinancialTransactionMapper.toResponse(financialTransaction);
    }

    public FinancialTransactionResponse update(
            UUID organizationId,
            UUID id,
            UpdateFinancialTransactionRequest request) {

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
        validateTotalAllocatedAmount(financialTransaction);

        repository.save(financialTransaction);

        return FinancialTransactionMapper.toResponse(financialTransaction);
    }

    public void delete(UUID organizationId, UUID id) {

        FinancialTransaction financialTransaction = findFinancialTransactionById(organizationId, id);

        if (financialTransaction.getStatus() == FinancialTransactionStatus.CANCELED) {
            throw new BusinessException("Transaction already canceled");
        }

        financialTransaction.setStatus(FinancialTransactionStatus.CANCELED);
        repository.save(financialTransaction);
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

        FinancialTransaction financialTransaction = findFinancialTransactionById(organizationId, id);

        if (financialTransaction.getStatus() == FinancialTransactionStatus.CANCELED) {
            throw new BusinessException("Canceled transactions cannot be classified");
        }

        Category category = categoryRepository
                .findByIdAndOrganizationIdAndActiveTrue(request.categoryId(), organizationId)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found"));

        validateCategoryMatchesTransactionType(request.type(), category);

        financialTransaction.setType(request.type());
        financialTransaction.setCategory(category);
        financialTransaction.setDueDate(request.dueDate());
        financialTransaction.setSettlementDate(request.settlementDate());

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

        normalizeTransactionStatusAndAmounts(financialTransaction);

        financialTransaction.getAllocations().clear();

        addInitialAllocations(organizationId, financialTransaction, request.allocations());

        addDefaultFundAllocationIfNeeded(organizationId, financialTransaction);

        validateTotalAllocatedAmount(financialTransaction);

        repository.save(financialTransaction);

        return FinancialTransactionMapper.toResponse(financialTransaction);
    }

    public TransactionAllocationResponse addAllocation(UUID organizationId, UUID id,
            CreateTransactionAllocationRequest request) {

        FinancialTransaction financialTransaction = findFinancialTransactionById(organizationId, id);

        TransactionAllocation allocation = buildAllocation(organizationId, financialTransaction, request);

        validateAllocationRules(allocation);

        financialTransaction.addAllocation(allocation);

        repository.save(financialTransaction);

        return TransactionAllocationMapper.toResponse(allocation);
    }

    public TransactionAllocationResponse updateAllocation(UUID organizationId, UUID id, UUID allocationId,
            UpdateTransactionAllocationRequest request) {

        FinancialTransaction financialTransaction = findFinancialTransactionById(organizationId, id);

        TransactionAllocation allocation = financialTransaction.getAllocations().stream()
                .filter(a -> a.getId().equals(allocationId))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("TransactionAllocation not found"));

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

        repository.save(financialTransaction);

        return TransactionAllocationMapper.toResponse(allocation);
    }

    public void removeAllocation(UUID organizationId, UUID id, UUID allocationId) {

        FinancialTransaction financialTransaction = findFinancialTransactionById(organizationId, id);

        TransactionAllocation allocation = financialTransaction.getAllocations().stream()
                .filter(a -> a.getId().equals(allocationId))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("TransactionAllocation not found"));

        financialTransaction.removeAllocation(allocation);

        repository.save(financialTransaction);
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

        if (financialTransaction.getAllocations() != null
                && !financialTransaction.getAllocations().isEmpty()) {
            return;
        }

        organizationSettingsRepository.findByOrganizationId(organizationId)
                .map(settings -> settings.getDefaultFund())
                .ifPresent(defaultFund -> {
                    CreateTransactionAllocationRequest allocationRequest = new CreateTransactionAllocationRequest(
                            defaultFund.getId(),
                            null,
                            financialTransaction.getSettledAmount().abs());

                    TransactionAllocation allocation = buildAllocation(
                            organizationId,
                            financialTransaction,
                            allocationRequest);

                    validateBasicAllocationRules(allocation);

                    financialTransaction.addAllocation(allocation);
                });
    }
}
