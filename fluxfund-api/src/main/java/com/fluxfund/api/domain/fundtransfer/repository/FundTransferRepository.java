package com.fluxfund.api.domain.fundtransfer.repository;

import java.math.BigDecimal;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.fluxfund.api.domain.fundtransfer.FundTransfer;

public interface FundTransferRepository extends JpaRepository<FundTransfer, UUID> {

    Page<FundTransfer> findAllByOrganizationIdOrderByTransferDateDescCreatedAtDesc(
            UUID organizationId,
            Pageable pageable);

    @Query("""
            select coalesce(sum(
                case
                    when ft.destinationFund.id = :fundId then ft.amount
                    when ft.sourceFund.id = :fundId then -ft.amount
                    else 0
                end
            ), 0)
            from FundTransfer ft
            where ft.organization.id = :organizationId
              and ft.status = com.fluxfund.api.domain.fundtransfer.FundTransferStatus.ACTIVE
              and (
                    ft.sourceFund.id = :fundId
                    or ft.destinationFund.id = :fundId
              )
            """)
    BigDecimal sumNetAmountByFundId(
            @Param("organizationId") UUID organizationId,
            @Param("fundId") UUID fundId);

    @Query("""
            select coalesce(sum(
                case
                    when ft.destinationFund.id = :fundId then ft.amount
                    when ft.sourceFund.id = :fundId then -ft.amount
                    else 0
                end
            ), 0)
            from FundTransfer ft
            where ft.organization.id = :organizationId
              and ft.status = com.fluxfund.api.domain.fundtransfer.FundTransferStatus.ACTIVE
              and ft.id <> :excludedTransferId
              and (
                    ft.sourceFund.id = :fundId
                    or ft.destinationFund.id = :fundId
              )
            """)
    BigDecimal sumNetAmountByFundIdExcludingTransfer(
            @Param("organizationId") UUID organizationId,
            @Param("fundId") UUID fundId,
            @Param("excludedTransferId") UUID excludedTransferId);

    @Query("""
            select coalesce(sum(
                case
                    when ft.destinationFund.active = true then ft.amount
                    else 0
                end
                -
                case
                    when ft.sourceFund.active = true then ft.amount
                    else 0
                end
            ), 0)
            from FundTransfer ft
            where ft.organization.id = :organizationId
              and ft.status = com.fluxfund.api.domain.fundtransfer.FundTransferStatus.ACTIVE
            """)
    BigDecimal sumNetAmountForActiveFundsByOrganizationId(
            @Param("organizationId") UUID organizationId);
}