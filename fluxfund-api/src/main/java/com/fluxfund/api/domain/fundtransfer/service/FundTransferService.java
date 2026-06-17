package com.fluxfund.api.domain.fundtransfer.service;

import java.math.BigDecimal;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fluxfund.api.domain.audit.AuditAction;
import com.fluxfund.api.domain.audit.AuditEntityType;
import com.fluxfund.api.domain.audit.service.AuditLogService;
import com.fluxfund.api.domain.fund.Fund;
import com.fluxfund.api.domain.fund.repository.FundRepository;
import com.fluxfund.api.domain.fundtransfer.FundTransfer;
import com.fluxfund.api.domain.fundtransfer.FundTransferStatus;
import com.fluxfund.api.domain.fundtransfer.dto.CreateFundTransferRequest;
import com.fluxfund.api.domain.fundtransfer.dto.FundTransferResponse;
import com.fluxfund.api.domain.fundtransfer.mapper.FundTransferMapper;
import com.fluxfund.api.domain.fundtransfer.repository.FundTransferRepository;
import com.fluxfund.api.domain.organizationsettings.OrganizationSettings;
import com.fluxfund.api.domain.organizationsettings.repository.OrganizationSettingsRepository;
import com.fluxfund.api.domain.transactionallocation.repository.TransactionAllocationRepository;
import com.fluxfund.api.security.OrganizationAccessService;
import com.fluxfund.api.shared.exception.BusinessException;
import com.fluxfund.api.shared.exception.ResourceNotFoundException;
import com.fluxfund.api.shared.util.StringNormalizer;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class FundTransferService {

    private final FundTransferRepository repository;
    private final FundRepository fundRepository;
    private final TransactionAllocationRepository allocationRepository;
    private final OrganizationSettingsRepository organizationSettingsRepository;
    private final OrganizationAccessService organizationAccessService;
    private final AuditLogService auditLogService;

    public FundTransferResponse create(
            UUID organizationId,
            CreateFundTransferRequest request) {

        organizationAccessService.requireFinanceWriteAccess(organizationId);

        if (request.sourceFundId().equals(request.destinationFundId())) {
            throw new BusinessException("Source and destination funds must be different");
        }

        Fund sourceFund = fundRepository
                .findByIdAndOrganizationIdAndActiveTrue(request.sourceFundId(), organizationId)
                .orElseThrow(() -> new ResourceNotFoundException("Source fund not found"));

        Fund destinationFund = fundRepository
                .findByIdAndOrganizationIdAndActiveTrue(request.destinationFundId(), organizationId)
                .orElseThrow(() -> new ResourceNotFoundException("Destination fund not found"));

        validateSourceFundBalance(organizationId, sourceFund, request.amount());

        FundTransfer transfer = new FundTransfer();
        transfer.setOrganization(sourceFund.getOrganization());
        transfer.setSourceFund(sourceFund);
        transfer.setDestinationFund(destinationFund);
        transfer.setTransferDate(request.transferDate());
        transfer.setAmount(request.amount().abs());
        transfer.setDescription(StringNormalizer.normalize(request.description()));
        transfer.setStatus(FundTransferStatus.ACTIVE);

        FundTransfer savedTransfer = repository.save(transfer);

        auditLogService.record(
                organizationId,
                AuditEntityType.FUND,
                savedTransfer.getId(),
                AuditAction.CREATE,
                "Fund transfer created from %s to %s"
                        .formatted(sourceFund.getName(), destinationFund.getName()));

        return FundTransferMapper.toResponse(savedTransfer);
    }

    @Transactional(readOnly = true)
    public Page<FundTransferResponse> findAll(
            UUID organizationId,
            Pageable pageable) {

        organizationAccessService.requireReadAccess(organizationId);

        return repository
                .findAllByOrganizationIdOrderByTransferDateDescCreatedAtDesc(
                        organizationId,
                        pageable)
                .map(FundTransferMapper::toResponse);
    }

    public void cancel(UUID organizationId, UUID id) {
        organizationAccessService.requireFinanceWriteAccess(organizationId);

        FundTransfer transfer = repository.findById(id)
                .filter(item -> item.getOrganization().getId().equals(organizationId))
                .orElseThrow(() -> new ResourceNotFoundException("Fund transfer not found"));

        if (transfer.getStatus() == FundTransferStatus.CANCELED) {
            return;
        }

        transfer.setStatus(FundTransferStatus.CANCELED);

        repository.save(transfer);

        auditLogService.record(
                organizationId,
                AuditEntityType.FUND,
                transfer.getId(),
                AuditAction.CANCEL,
                "Fund transfer canceled");
    }

    private void validateSourceFundBalance(
            UUID organizationId,
            Fund sourceFund,
            BigDecimal amount) {

        OrganizationSettings settings = organizationSettingsRepository
                .findByOrganizationId(organizationId)
                .orElse(null);

        boolean allowNegativeFunds = settings != null && settings.isAllowNegativeFunds();

        if (allowNegativeFunds) {
            return;
        }

        BigDecimal allocationBalance = allocationRepository.sumAmountByFundId(
                organizationId,
                sourceFund.getId());

        BigDecimal transferBalance = repository.sumNetAmountByFundId(
                organizationId,
                sourceFund.getId());

        BigDecimal currentBalance = sourceFund.getInitialBalance()
                .add(allocationBalance)
                .add(transferBalance);

        if (currentBalance.subtract(amount).compareTo(BigDecimal.ZERO) < 0) {
            throw new BusinessException(
                    "Insufficient source fund balance for this transfer");
        }
    }
}