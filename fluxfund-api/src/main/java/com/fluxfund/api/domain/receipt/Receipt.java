package com.fluxfund.api.domain.receipt;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;

import com.fluxfund.api.domain.beneficiary.Beneficiary;
import com.fluxfund.api.domain.financialtransaction.FinancialTransaction;
import com.fluxfund.api.domain.fund.Fund;
import com.fluxfund.api.domain.organization.Organization;
import com.fluxfund.api.domain.transactionallocation.TransactionAllocation;
import com.fluxfund.api.shared.BaseEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "receipt")
@Getter
@Setter
@NoArgsConstructor
public class Receipt extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "organization_id", nullable = false)
    private Organization organization;

    @Enumerated(EnumType.STRING)
    @Column(name = "source_type", nullable = false, length = 20)
    private ReceiptSourceType sourceType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "financial_transaction_id")
    private FinancialTransaction financialTransaction;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "transaction_allocation_id")
    private TransactionAllocation transactionAllocation;

    @Enumerated(EnumType.STRING)
    @Column(name = "receipt_type", nullable = false, length = 40)
    private ReceiptType receiptType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ReceiptStatus status = ReceiptStatus.DRAFT;

    @Column(name = "sequence_year")
    private Integer sequenceYear;

    @Column(name = "sequence_number")
    private Long sequenceNumber;

    @Column(name = "issue_date")
    private LocalDate issueDate;

    @Column(name = "payment_date", nullable = false)
    private LocalDate paymentDate;

    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal amount;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "counterparty_party_id")
    private Beneficiary counterpartyParty;

    @Column(name = "counterparty_name", nullable = false, length = 255)
    private String counterpartyName;

    @Column(name = "counterparty_document", length = 50)
    private String counterpartyDocument;

    @Column(name = "counterparty_address", length = 500)
    private String counterpartyAddress;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "beneficiary_party_id")
    private Beneficiary beneficiaryParty;

    @Column(name = "beneficiary_name", length = 255)
    private String beneficiaryName;

    @Column(name = "beneficiary_document", length = 50)
    private String beneficiaryDocument;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "fund_id")
    private Fund fund;

    @Column(name = "fund_name", length = 255)
    private String fundName;

    @Column(name = "purpose_description", nullable = false, length = 500)
    private String purposeDescription;

    @Column(name = "place_city", length = 255)
    private String placeCity;

    @Column(name = "place_state", length = 2)
    private String placeState;

    @Column(name = "signatory_name", length = 255)
    private String signatoryName;

    @Column(name = "signatory_title", length = 255)
    private String signatoryTitle;

    @Column(length = 1000)
    private String notes;

    @Column(name = "issuer_name", length = 255)
    private String issuerName;

    @Column(name = "issuer_legal_name", length = 255)
    private String issuerLegalName;

    @Column(name = "issuer_document", length = 50)
    private String issuerDocument;

    @Column(name = "issuer_address", length = 500)
    private String issuerAddress;

    @Column(name = "issuer_contact", length = 255)
    private String issuerContact;

    @Column(name = "pdf_storage_key", length = 500)
    private String pdfStorageKey;

    @Column(name = "pdf_filename", length = 255)
    private String pdfFilename;

    @Column(name = "pdf_size_bytes")
    private Long pdfSizeBytes;

    @Column(name = "issued_at")
    private OffsetDateTime issuedAt;

    @Column(name = "canceled_at")
    private OffsetDateTime canceledAt;

    @Column(name = "cancellation_reason", length = 500)
    private String cancellationReason;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "replaces_receipt_id")
    private Receipt replacesReceipt;
}