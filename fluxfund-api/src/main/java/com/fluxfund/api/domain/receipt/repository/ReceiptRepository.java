package com.fluxfund.api.domain.receipt.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.fluxfund.api.domain.receipt.Receipt;
import com.fluxfund.api.domain.receipt.ReceiptStatus;
import com.fluxfund.api.domain.receipt.ReceiptType;

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
}