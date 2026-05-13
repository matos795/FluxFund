package com.fluxfund.api.domain.financialtransaction.service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Objects;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fluxfund.api.domain.account.Account;
import com.fluxfund.api.domain.account.repository.AccountRepository;
import com.fluxfund.api.domain.category.Category;
import com.fluxfund.api.domain.category.repository.CategoryRepository;
import com.fluxfund.api.domain.financialtransaction.FinancialTransaction;
import com.fluxfund.api.domain.financialtransaction.FinancialTransactionStatus;
import com.fluxfund.api.domain.financialtransaction.dto.CreateFinancialTransactionRequest;
import com.fluxfund.api.domain.financialtransaction.dto.FinancialTransactionResponse;
import com.fluxfund.api.domain.financialtransaction.dto.UpdateFinancialTransactionRequest;
import com.fluxfund.api.domain.financialtransaction.mapper.FinancialTransactionMapper;
import com.fluxfund.api.domain.financialtransaction.repository.FinancialTransactionRepository;
import com.fluxfund.api.domain.organization.Organization;
import com.fluxfund.api.domain.organization.OrganizationRepository;
import com.fluxfund.api.shared.exception.BusinessException;
import com.fluxfund.api.shared.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class FinancialTransactionService {

    private final FinancialTransactionRepository repository;
    private final OrganizationRepository organizationRepository;
    private final AccountRepository accountRepository;
    private final CategoryRepository categoryRepository;

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

        FinancialTransaction financialTransaction = FinancialTransactionMapper.createEntity(request, organization,
                account, category);

        applyFinancialRules(financialTransaction);

        repository.save(financialTransaction);

        return FinancialTransactionMapper.toResponse(financialTransaction);
    }

    @Transactional(readOnly = true)
    public Page<FinancialTransactionResponse> findAll(
            UUID organizationId,
            Pageable pageable) {

        return repository
                .findAllByOrganizationId(organizationId, pageable)
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

        Category category = null;

        if (request.categoryId() != null) {
            category = categoryRepository.findByIdAndOrganizationIdAndActiveTrue(request.categoryId(), organizationId)
                    .orElseThrow(() -> new ResourceNotFoundException("Category not found"));
        }
        FinancialTransactionMapper.updateEntity(financialTransaction, request, category);

        applyFinancialRules(financialTransaction);

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

    private void applyFinancialRules(FinancialTransaction transaction) {

        if (transaction.getCategory() != null && transaction.getClassifiedAt() == null) {
            transaction.setClassifiedAt(LocalDateTime.now());
        }

        if (transaction.getSettlementDate() != null) {
            transaction.setStatus(FinancialTransactionStatus.SETTLED);
        } else {
            transaction.setStatus(FinancialTransactionStatus.PENDING);
            transaction.setSettledAmount(null);
            transaction.setInterestAmount(BigDecimal.ZERO);
            transaction.setDiscountAmount(BigDecimal.ZERO);

            return;
        }

        BigDecimal settled = Objects.requireNonNullElse(
                transaction.getSettledAmount(),
                transaction.getExpectedAmount());

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
}
