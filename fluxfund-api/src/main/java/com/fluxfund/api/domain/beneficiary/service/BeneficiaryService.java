package com.fluxfund.api.domain.beneficiary.service;

import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fluxfund.api.domain.audit.AuditAction;
import com.fluxfund.api.domain.audit.AuditEntityType;
import com.fluxfund.api.domain.audit.service.AuditLogService;
import com.fluxfund.api.domain.beneficiary.Beneficiary;
import com.fluxfund.api.domain.beneficiary.BeneficiaryType;
import com.fluxfund.api.domain.beneficiary.FinancialPartyRole;
import com.fluxfund.api.domain.beneficiary.FinancialPartyType;
import com.fluxfund.api.domain.beneficiary.dto.BeneficiaryResponse;
import com.fluxfund.api.domain.beneficiary.dto.CreateBeneficiaryRequest;
import com.fluxfund.api.domain.beneficiary.dto.FinancialPartyOptionResponse;
import com.fluxfund.api.domain.beneficiary.dto.UpdateBeneficiaryRequest;
import com.fluxfund.api.domain.beneficiary.mapper.BeneficiaryMapper;
import com.fluxfund.api.domain.beneficiary.repository.BeneficiaryRepository;
import com.fluxfund.api.domain.beneficiary.specification.BeneficiarySpecification;
import com.fluxfund.api.domain.organization.Organization;
import com.fluxfund.api.domain.organization.repository.OrganizationRepository;
import com.fluxfund.api.security.OrganizationAccessService;
import com.fluxfund.api.shared.dto.OptionResponse;
import com.fluxfund.api.shared.exception.BusinessException;
import com.fluxfund.api.shared.exception.ResourceNotFoundException;
import com.fluxfund.api.shared.util.DocumentNormalizer;
import com.fluxfund.api.shared.util.StringNormalizer;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class BeneficiaryService {

    private final BeneficiaryRepository repository;

    private final OrganizationRepository organizationRepository;

    private final OrganizationAccessService organizationAccessService;

    private final AuditLogService auditLogService;

    public BeneficiaryResponse create(CreateBeneficiaryRequest request, UUID organizationId) {

        organizationAccessService.requireFinanceWriteAccess(organizationId);

        Organization organization = organizationRepository.findByIdAndActiveTrue(organizationId)

                .orElseThrow(() -> new ResourceNotFoundException("Organization not found"));

        validateBeneficiaryName(request.name());
        validateBeneficiaryDocument(organizationId, request.document(), null);

        Beneficiary beneficiary = BeneficiaryMapper.createEntity(request, organization);

        validateFinancialParty(beneficiary);

        Beneficiary savedBeneficiary = repository.saveAndFlush(beneficiary);

        auditLogService.record(organizationId,
                AuditEntityType.FINANCIAL_PARTY,
                savedBeneficiary.getId(),
                AuditAction.CREATE,
                "Financial party created: " + savedBeneficiary.getName());

        return BeneficiaryMapper.toResponse(savedBeneficiary);
    }

    /*
     * Compatibilidade com o controller antigo.
     *
     * /beneficiaries representa apenas contatos
     * que podem receber pagamentos.
     */
    @Transactional(readOnly = true)
    public Page<BeneficiaryResponse> findAll(
            UUID organizationId,
            Pageable pageable) {

        return findAllFinancialParties(
                organizationId,
                null,
                null,
                null,
                FinancialPartyRole.PAYMENT_RECIPIENT,
                true,
                pageable);
    }

    /*
     * Consulta completa para a nova API
     * /financial-parties.
     */
    @Transactional(readOnly = true)
    public Page<BeneficiaryResponse> findAllFinancialParties(
            UUID organizationId,
            String search,
            FinancialPartyType partyType,
            BeneficiaryType classification,
            FinancialPartyRole role,
            Boolean active,
            Pageable pageable) {

        organizationAccessService.requireReadAccess(organizationId);

        Boolean resolvedActive = active != null ? active : Boolean.TRUE;

        return repository.findAll(BeneficiarySpecification
                .withFilters(
                        organizationId,
                        search,
                        partyType,
                        classification,
                        role,
                        resolvedActive),
                pageable)
                .map(BeneficiaryMapper::toResponse);
    }

    /*
     * Compatibilidade com o endpoint antigo.
     *
     * Contatos inativos continuam indisponíveis.
     */
    @Transactional(readOnly = true)
    public BeneficiaryResponse findById(UUID id, UUID organizationId) {

        organizationAccessService.requireReadAccess(organizationId);

        Beneficiary beneficiary = findActiveBeneficiaryById(id, organizationId);

        return BeneficiaryMapper.toResponse(beneficiary);
    }


    @Transactional(readOnly = true)
    public BeneficiaryResponse findFinancialPartyById(UUID id, UUID organizationId) {

        organizationAccessService.requireReadAccess(organizationId);

        Beneficiary beneficiary = findBeneficiaryById(id, organizationId);

        return BeneficiaryMapper.toResponse(beneficiary);
    }

    public BeneficiaryResponse update(UUID organizationId, UUID id, UpdateBeneficiaryRequest request) {

        organizationAccessService.requireFinanceWriteAccess(organizationId);

        Beneficiary beneficiary = findActiveBeneficiaryById(id, organizationId);

        if (request.name() != null) {
            validateBeneficiaryName(request.name());
        }

        if (request.document() != null) {
            validateBeneficiaryDocument(organizationId, request.document(), beneficiary.getId());
        }

        BeneficiaryMapper.updateEntity(beneficiary, request);

        validateFinancialParty(beneficiary);

        Beneficiary savedBeneficiary = repository.saveAndFlush(beneficiary);

        auditLogService.record(
                organizationId,
                AuditEntityType.FINANCIAL_PARTY,
                savedBeneficiary.getId(),
                AuditAction.UPDATE,
                "Financial party updated: " + savedBeneficiary.getName());

        return BeneficiaryMapper.toResponse(savedBeneficiary);
    }

    public void delete(UUID id, UUID organizationId) {

        organizationAccessService.requireFinanceWriteAccess(organizationId);

        Beneficiary beneficiary = findActiveBeneficiaryById(id, organizationId);

        beneficiary.setActive(false);

        repository.saveAndFlush(beneficiary);

        auditLogService.record(
                organizationId,
                AuditEntityType.FINANCIAL_PARTY,
                beneficiary.getId(),
                AuditAction.DEACTIVATE,
                "Financial party deactivated: " + beneficiary.getName());
    }

    public BeneficiaryResponse activate(UUID organizationId, UUID id) {

        organizationAccessService.requireFinanceWriteAccess(organizationId);

        Beneficiary beneficiary = findBeneficiaryById(id, organizationId);

        /*
         * Operação idempotente:
         * ativar algo já ativo não cria novo log.
         */
        if (beneficiary.isActive()) {
            return BeneficiaryMapper.toResponse(beneficiary);
        }

        beneficiary.setActive(true);

        Beneficiary savedBeneficiary = repository.saveAndFlush(beneficiary);

        auditLogService.record(organizationId,
                AuditEntityType.FINANCIAL_PARTY,
                savedBeneficiary.getId(),
                AuditAction.ACTIVATE,
                "Financial party activated: " + savedBeneficiary.getName());

        return BeneficiaryMapper.toResponse(savedBeneficiary);
    }

    /*
     * Endpoint legado:
     *
     * continua retornando o formato simples
     * usado pelo combobox atual de favorecidos.
     */
    @Transactional(readOnly = true)
    public List<OptionResponse> findOptions(UUID organizationId) {

        organizationAccessService.requireReadAccess(organizationId);

        return findActiveParties(organizationId, FinancialPartyRole.PAYMENT_RECIPIENT)
                .stream()
                .map(beneficiary -> new OptionResponse(beneficiary.getId(), beneficiary.getName()))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<FinancialPartyOptionResponse> findFinancialPartyOptions(UUID organizationId, FinancialPartyRole role) {

        organizationAccessService.requireReadAccess(organizationId);

        return findActiveParties(organizationId, role)
                .stream()
                .map(BeneficiaryMapper::toFinancialPartyOptionResponse)
                .toList();
    }

    private List<Beneficiary> findActiveParties(UUID organizationId, FinancialPartyRole role) {

        return repository.findAll(
                BeneficiarySpecification
                        .withFilters(
                                organizationId,
                                null,
                                null,
                                null,
                                role,
                                true),

                Sort.by(Sort.Direction.ASC, "name"));
    }

    private Beneficiary findActiveBeneficiaryById(UUID id, UUID organizationId) {

        return repository
                .findByIdAndOrganizationIdAndActiveTrue(id, organizationId)
                .orElseThrow(() -> new ResourceNotFoundException("Financial party not found"));
    }

    private Beneficiary findBeneficiaryById(UUID id, UUID organizationId) {

        return repository
                .findByIdAndOrganizationId(id, organizationId)
                .orElseThrow(() -> new ResourceNotFoundException("Financial party not found"));
    }

    private void validateBeneficiaryName(String name) {

        String normalizedName = StringNormalizer.normalize(name);

        if (normalizedName == null) {
            throw new BusinessException("Financial party name cannot be blank");
        }
    }

    private void validateBeneficiaryDocument(
            UUID organizationId,
            String document,
            UUID currentBeneficiaryId) {

        String normalizedDocument = DocumentNormalizer.normalize(document);

        if (normalizedDocument == null) {
            return;
        }

        boolean exists = currentBeneficiaryId == null

                ? repository
                        .existsByOrganizationIdAndDocument(
                                organizationId,
                                normalizedDocument)

                : repository
                        .existsByOrganizationIdAndDocumentAndIdNot(
                                organizationId,
                                normalizedDocument,
                                currentBeneficiaryId);

        if (exists) {
            throw new BusinessException("Financial party document already exists");
        }
    }

    private void validateFinancialParty(Beneficiary beneficiary) {

        if (beneficiary.getPartyType() == null) {
            throw new BusinessException("Financial party type is required");
        }

        if (beneficiary.getRoles() == null || beneficiary.getRoles().isEmpty()) {
            throw new BusinessException("At least one financial role is required");
        }

        if (beneficiary.getState() != null && beneficiary.getState().length() != 2) {
            throw new BusinessException("State must contain two characters");
        }

        if (beneficiary.getZipCode() != null && beneficiary.getZipCode().length() != 8) {
            throw new BusinessException("Zip code must contain eight digits");
        }
    }
}