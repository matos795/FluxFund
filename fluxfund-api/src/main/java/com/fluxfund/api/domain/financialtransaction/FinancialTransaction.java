package com.fluxfund.api.domain.financialtransaction;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import com.fluxfund.api.domain.account.Account;
import com.fluxfund.api.domain.category.Category;
import com.fluxfund.api.domain.creditcardstatement.CreditCardStatement;
import com.fluxfund.api.domain.organization.Organization;
import com.fluxfund.api.domain.transactionallocation.TransactionAllocation;
import com.fluxfund.api.shared.BaseEntity;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "financial_transaction")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FinancialTransaction extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "organization_id", nullable = false)
    private Organization organization;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "account_id", nullable = false)
    private Account account;

    @Column(name = "external_id")
    private String externalId;

    @Enumerated(EnumType.STRING)
    @Column(name = "source", nullable = false)
    private FinancialTransactionSource source;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private FinancialTransactionStatus status;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private Category category;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private FinancialTransactionType type;

    @Column(name = "due_date")
    private LocalDate dueDate;

    @Column(name = "settlement_date")
    private LocalDate settlementDate;

    @Column(name = "expected_amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal expectedAmount;

    @Column(name = "settled_amount", precision = 15, scale = 2)
    private BigDecimal settledAmount;

    @Column(name = "interest_amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal interestAmount;

    @Column(name = "discount_amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal discountAmount;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "raw_description", columnDefinition = "TEXT")
    private String rawDescription;

    @Column(name = "document_number")
    private String documentNumber;

    @Column(name = "imported_at")
    private LocalDateTime importedAt;

    @Column(name = "classified_at")
    private LocalDateTime classifiedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "credit_card_statement_id")
    private CreditCardStatement creditCardStatement;

    @Column(name = "installment_number")
    private Integer installmentNumber;

    @Column(name = "installment_count")
    private Integer installmentCount;

    @Enumerated(EnumType.STRING)
    @Column(name = "transfer_direction")
    private TransferDirection transferDirection;

    @Column(name = "transfer_group_id")
    private UUID transferGroupId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "transfer_counterparty_account_id")
    private Account transferCounterpartyAccount;

    @Builder.Default
    @OneToMany(mappedBy = "financialTransaction", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<TransactionAllocation> allocations = new ArrayList<>();

    public void addAllocation(TransactionAllocation allocation) {
        allocations.add(allocation);
        allocation.setFinancialTransaction(this);
    }

    public void removeAllocation(TransactionAllocation allocation) {
        allocations.remove(allocation);
        allocation.setFinancialTransaction(null);
    }
}
