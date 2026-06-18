package com.fluxfund.api.domain.creditcardstatement.service;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fluxfund.api.domain.account.Account;
import com.fluxfund.api.domain.account.AccountType;
import com.fluxfund.api.domain.account.repository.AccountRepository;
import com.fluxfund.api.domain.category.Category;
import com.fluxfund.api.domain.category.CategoryType;
import com.fluxfund.api.domain.category.repository.CategoryRepository;
import com.fluxfund.api.domain.creditcardstatement.CreditCardStatement;
import com.fluxfund.api.domain.creditcardstatement.CreditCardStatementStatus;
import com.fluxfund.api.domain.creditcardstatement.dto.CreateCreditCardItemRequest;
import com.fluxfund.api.domain.creditcardstatement.dto.CreateCreditCardStatementRequest;
import com.fluxfund.api.domain.creditcardstatement.dto.CreditCardStatementResponse;
import com.fluxfund.api.domain.creditcardstatement.dto.PayCreditCardStatementRequest;
import com.fluxfund.api.domain.creditcardstatement.dto.UpdateCreditCardStatementRequest;
import com.fluxfund.api.domain.creditcardstatement.mapper.CreditCardStatementMapper;
import com.fluxfund.api.domain.creditcardstatement.repository.CreditCardStatementRepository;
import com.fluxfund.api.domain.financialtransaction.FinancialTransaction;
import com.fluxfund.api.domain.financialtransaction.FinancialTransactionSource;
import com.fluxfund.api.domain.financialtransaction.FinancialTransactionStatus;
import com.fluxfund.api.domain.financialtransaction.FinancialTransactionType;
import com.fluxfund.api.domain.financialtransaction.FiscalDocumentPolicy;
import com.fluxfund.api.domain.financialtransaction.dto.FinancialTransactionResponse;
import com.fluxfund.api.domain.financialtransaction.mapper.FinancialTransactionMapper;
import com.fluxfund.api.domain.financialtransaction.repository.FinancialTransactionRepository;
import com.fluxfund.api.domain.financialtransaction.service.FinancialTransactionDocumentPolicyService;
import com.fluxfund.api.domain.financialtransaction.service.FinancialTransactionService;
import com.fluxfund.api.domain.organization.Organization;
import com.fluxfund.api.domain.organization.OrganizationRepository;
import com.fluxfund.api.security.OrganizationAccessService;
import com.fluxfund.api.shared.exception.BusinessException;
import com.fluxfund.api.shared.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class CreditCardStatementService {

    private final CreditCardStatementRepository statementRepository;
    private final FinancialTransactionRepository financialTransactionRepository;
    private final FinancialTransactionService financialTransactionService;
    private final OrganizationRepository organizationRepository;
    private final AccountRepository accountRepository;
    private final CategoryRepository categoryRepository;
    private final OrganizationAccessService organizationAccessService;
    private final FinancialTransactionDocumentPolicyService documentPolicyService;

    public CreditCardStatementResponse create(UUID organizationId, CreateCreditCardStatementRequest request) {

        organizationAccessService.requireFinanceWriteAccess(organizationId);

        Organization organization = organizationRepository.findById(organizationId)
                .orElseThrow(() -> new ResourceNotFoundException("Organization not found"));

        Account creditCardAccount = accountRepository
                .findByIdAndOrganizationIdAndActiveTrue(request.creditCardAccountId(), organizationId)
                .orElseThrow(() -> new ResourceNotFoundException("Credit card account not found"));

        validateCreditCardAccount(creditCardAccount);

        CreditCardStatement statement = new CreditCardStatement();
        statement.setOrganization(organization);
        statement.setCreditCardAccount(creditCardAccount);
        statement.setName(request.name());
        statement.setClosingDate(request.closingDate());
        statement.setDueDate(request.dueDate());
        statement.setStatus(CreditCardStatementStatus.OPEN);

        CreditCardStatement savedStatement = statementRepository.save(statement);

        return toResponse(organizationId, savedStatement);
    }

    @Transactional(readOnly = true)
    public Page<CreditCardStatementResponse> findAll(
            UUID organizationId,
            UUID creditCardAccountId,
            CreditCardStatementStatus status,
            Pageable pageable) {

        organizationAccessService.requireReadAccess(organizationId);

        Page<CreditCardStatement> statements;

        if (creditCardAccountId != null && status != null) {
            statements = statementRepository.findAllByOrganizationIdAndCreditCardAccountIdAndStatus(
                    organizationId,
                    creditCardAccountId,
                    status,
                    pageable);
        } else if (creditCardAccountId != null) {
            statements = statementRepository.findAllByOrganizationIdAndCreditCardAccountId(
                    organizationId,
                    creditCardAccountId,
                    pageable);
        } else if (status != null) {
            statements = statementRepository.findAllByOrganizationIdAndStatus(
                    organizationId,
                    status,
                    pageable);
        } else {
            statements = statementRepository.findAllByOrganizationId(organizationId, pageable);
        }

        return statements.map(statement -> toResponse(organizationId, statement));
    }

    @Transactional(readOnly = true)
    public CreditCardStatementResponse findById(UUID organizationId, UUID id) {
        organizationAccessService.requireReadAccess(organizationId);

        CreditCardStatement statement = findStatement(organizationId, id);

        return toResponse(organizationId, statement);
    }

    public CreditCardStatementResponse update(
            UUID organizationId,
            UUID id,
            UpdateCreditCardStatementRequest request) {

        organizationAccessService.requireFinanceWriteAccess(organizationId);

        CreditCardStatement statement = findStatement(organizationId, id);

        if (statement.getStatus() == CreditCardStatementStatus.PAID) {
            throw new BusinessException("Paid credit card statements cannot be edited");
        }

        if (request.name() != null) {
            statement.setName(request.name());
        }

        if (request.closingDate() != null) {
            statement.setClosingDate(request.closingDate());
        }

        if (request.dueDate() != null) {
            statement.setDueDate(request.dueDate());
        }

        CreditCardStatement savedStatement = statementRepository.save(statement);

        return toResponse(organizationId, savedStatement);
    }

    public FinancialTransactionResponse addItem(
            UUID organizationId,
            UUID statementId,
            CreateCreditCardItemRequest request) {

        organizationAccessService.requireFinanceWriteAccess(organizationId);

        CreditCardStatement statement = findStatement(organizationId, statementId);

        if (statement.getStatus() == CreditCardStatementStatus.PAID
                || statement.getStatus() == CreditCardStatementStatus.CANCELED) {
            throw new BusinessException("Cannot add items to paid or canceled statements");
        }

        Category category = categoryRepository
                .findByIdAndOrganizationIdAndActiveTrue(request.categoryId(), organizationId)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found"));

        if (category.getType() != CategoryType.EXPENSE) {
            throw new BusinessException("Credit card item category must be an expense category");
        }

        FinancialTransaction transaction = FinancialTransaction.builder()
                .organization(statement.getOrganization())
                .account(statement.getPaymentAccount() != null
                        ? statement.getPaymentAccount()
                        : statement.getCreditCardAccount())
                .creditCardStatement(statement)
                .type(FinancialTransactionType.EXPENSE)
                .source(FinancialTransactionSource.CREDIT_CARD)
                .status(FinancialTransactionStatus.PENDING)
                .category(category)
                .dueDate(statement.getDueDate())
                .settlementDate(null)
                .expectedAmount(request.amount())
                .settledAmount(null)
                .interestAmount(BigDecimal.ZERO)
                .discountAmount(BigDecimal.ZERO)
                .description(request.description())
                .rawDescription(request.description())
                .documentNumber(request.documentNumber())
                .fiscalDocumentPolicy(
                        request.fiscalDocumentPolicy() != null
                                ? request.fiscalDocumentPolicy()
                                : FiscalDocumentPolicy.CATEGORY)
                .fiscalDocumentNote(request.fiscalDocumentNote())
                .installmentNumber(request.installmentNumber())
                .installmentCount(request.installmentCount())
                .build();

        documentPolicyService.normalizeAndValidate(transaction);

        FinancialTransaction savedTransaction = financialTransactionRepository.save(transaction);

        if (request.allocations() != null && !request.allocations().isEmpty()) {
            for (var allocation : request.allocations()) {
                financialTransactionService.addAllocation(
                        organizationId,
                        savedTransaction.getId(),
                        allocation);
            }
        }

        FinancialTransaction reloadedTransaction = financialTransactionRepository
                .findByIdAndOrganizationId(savedTransaction.getId(), organizationId)
                .orElseThrow(() -> new ResourceNotFoundException("Financial transaction not found"));

        return FinancialTransactionMapper.toResponse(reloadedTransaction);
    }

    public CreditCardStatementResponse pay(
            UUID organizationId,
            UUID statementId,
            PayCreditCardStatementRequest request) {

        organizationAccessService.requireFinanceWriteAccess(organizationId);

        CreditCardStatement statement = findStatement(organizationId, statementId);

        if (statement.getStatus() == CreditCardStatementStatus.PAID) {
            throw new BusinessException("Credit card statement is already paid");
        }

        Account paymentAccount = accountRepository
                .findByIdAndOrganizationIdAndActiveTrue(request.paymentAccountId(), organizationId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment account not found"));

        if (paymentAccount.getType() == AccountType.CREDIT_CARD) {
            throw new BusinessException("Payment account cannot be a credit card");
        }

        statement.setPaymentAccount(paymentAccount);
        statement.setPaymentDate(request.paymentDate());
        statement.setStatus(CreditCardStatementStatus.PAID);

        if (request.paymentTransactionId() != null) {
            FinancialTransaction paymentTransaction = financialTransactionRepository
                    .findByIdAndOrganizationId(request.paymentTransactionId(), organizationId)
                    .orElseThrow(() -> new ResourceNotFoundException("Payment transaction not found"));

            paymentTransaction.setType(FinancialTransactionType.TRANSFER);
            paymentTransaction.setCategory(null);
            paymentTransaction.setDescription("Pagamento da fatura " + statement.getName());
            paymentTransaction.setDocumentNumber(null);

            statement.setPaymentTransaction(paymentTransaction);
        }

        List<FinancialTransaction> items = financialTransactionRepository
                .findAllByCreditCardStatementIdAndOrganizationId(statementId, organizationId);

        for (FinancialTransaction item : items) {
            item.setAccount(paymentAccount);
            item.setSettlementDate(request.paymentDate());
            item.setSettledAmount(item.getExpectedAmount());
            item.setStatus(FinancialTransactionStatus.SETTLED);
        }

        financialTransactionRepository.saveAll(items);

        CreditCardStatement savedStatement = statementRepository.save(statement);

        return toResponse(organizationId, savedStatement);
    }

    public void cancel(UUID organizationId, UUID id) {
        organizationAccessService.requireFinanceWriteAccess(organizationId);

        CreditCardStatement statement = findStatement(organizationId, id);

        if (statement.getStatus() == CreditCardStatementStatus.PAID) {
            throw new BusinessException("Paid credit card statements cannot be canceled");
        }

        statement.setStatus(CreditCardStatementStatus.CANCELED);

        List<FinancialTransaction> items = financialTransactionRepository
                .findAllByCreditCardStatementIdAndOrganizationId(id, organizationId);

        for (FinancialTransaction item : items) {
            item.setStatus(FinancialTransactionStatus.CANCELED);
        }

        financialTransactionRepository.saveAll(items);
        statementRepository.save(statement);
    }

    private CreditCardStatement findStatement(UUID organizationId, UUID id) {
        return statementRepository.findByIdAndOrganizationId(id, organizationId)
                .orElseThrow(() -> new ResourceNotFoundException("Credit card statement not found"));
    }

    private void validateCreditCardAccount(Account account) {
        if (account.getType() != AccountType.CREDIT_CARD) {
            throw new BusinessException("Account must be a credit card account");
        }
    }

    private CreditCardStatementResponse toResponse(
            UUID organizationId,
            CreditCardStatement statement) {

        BigDecimal totalAmount = financialTransactionRepository.sumCreditCardStatementTotal(
                organizationId,
                statement.getId());

        long itemCount = financialTransactionRepository.countCreditCardStatementItems(
                organizationId,
                statement.getId());

        return CreditCardStatementMapper.toResponse(
                statement,
                totalAmount,
                itemCount);
    }

    @Transactional(readOnly = true)
    public List<FinancialTransactionResponse> findItems(
            UUID organizationId,
            UUID statementId) {

        organizationAccessService.requireReadAccess(organizationId);

        findStatement(organizationId, statementId);

        return financialTransactionRepository
                .findCreditCardStatementItems(organizationId, statementId)
                .stream()
                .map(FinancialTransactionMapper::toResponse)
                .toList();
    }
}