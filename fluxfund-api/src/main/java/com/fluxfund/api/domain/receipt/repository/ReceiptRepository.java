package com.fluxfund.api.domain.receipt.repository;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.fluxfund.api.domain.receipt.Receipt;
import com.fluxfund.api.domain.receipt.ReceiptStatus;
import com.fluxfund.api.domain.receipt.ReceiptType;

import jakarta.persistence.LockModeType;

public interface ReceiptRepository
        extends JpaRepository<Receipt, UUID> {

    Optional<Receipt> findByIdAndOrganizationId(

            UUID id,

            UUID organizationId);

    @Query("""
            select receipt

            from Receipt receipt

            where receipt.organization.id =
                :organizationId

              and (
                    :status is null

                    or receipt.status =
                        :status
                  )

              and (
                    :receiptType is null

                    or receipt.receiptType =
                        :receiptType
                  )
            """)
    Page<Receipt> findAllByFilters(

            @Param("organizationId") UUID organizationId,

            @Param("status") ReceiptStatus status,

            @Param("receiptType") ReceiptType receiptType,

            Pageable pageable);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            select receipt

            from Receipt receipt

            where receipt.id =
                :receiptId

              and receipt.organization.id =
                :organizationId
            """)
    Optional<Receipt> findByIdAndOrganizationIdForUpdate(

            @Param("receiptId") UUID receiptId,

            @Param("organizationId") UUID organizationId);

    @Query("""
            select coalesce(
                sum(receipt.amount),
                0
            )

            from Receipt receipt

            where receipt.organization.id =
                :organizationId

              and receipt.status =
                com.fluxfund.api.domain.receipt.ReceiptStatus.ISSUED

              and receipt.transactionAllocation.id =
                :allocationId
            """)
    BigDecimal sumIssuedByAllocation(

            @Param("organizationId") UUID organizationId,

            @Param("allocationId") UUID allocationId);

    @Query("""
            select coalesce(
                sum(receipt.amount),
                0
            )

            from Receipt receipt

            where receipt.organization.id =
                :organizationId

              and receipt.status =
                com.fluxfund.api.domain.receipt.ReceiptStatus.ISSUED

              and receipt.sourceType =
                com.fluxfund.api.domain.receipt.ReceiptSourceType.TRANSACTION

              and receipt.financialTransaction.id =
                :transactionId
            """)
    BigDecimal sumIssuedByTransaction(

            @Param("organizationId") UUID organizationId,

            @Param("transactionId") UUID transactionId);

    @Query("""
            select case
                when count(receipt) > 0
                then true
                else false
            end

            from Receipt receipt

            where receipt.organization.id =
                :organizationId

              and receipt.status =
                com.fluxfund.api.domain.receipt.ReceiptStatus.ISSUED

              and receipt.sourceType =
                :sourceType

              and receipt.financialTransaction.id =
                :transactionId
            """)
    boolean existsIssuedByTransactionAndSourceType(

            @Param("organizationId") UUID organizationId,

            @Param("transactionId") UUID transactionId,

            @Param("sourceType") com.fluxfund.api.domain.receipt.ReceiptSourceType sourceType);
}