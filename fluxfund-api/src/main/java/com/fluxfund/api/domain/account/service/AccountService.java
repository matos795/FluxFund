package com.fluxfund.api.domain.account.service;

import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fluxfund.api.domain.account.Account;
import com.fluxfund.api.domain.account.dto.AccountResponse;
import com.fluxfund.api.domain.account.dto.CreateAccountRequest;
import com.fluxfund.api.domain.account.dto.UpdateAccountRequest;
import com.fluxfund.api.domain.account.mapper.AccountMapper;
import com.fluxfund.api.domain.account.repository.AccountRepository;
import com.fluxfund.api.domain.organization.Organization;
import com.fluxfund.api.domain.organization.OrganizationRepository;
import com.fluxfund.api.security.OrganizationAccessService;
import com.fluxfund.api.shared.dto.OptionResponse;
import com.fluxfund.api.shared.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AccountService {

    private final AccountRepository accountRepository;
    private final OrganizationRepository organizationRepository;
    private final AccountMapper mapper;
    private final OrganizationAccessService organizationAccessService;

    public AccountResponse create(CreateAccountRequest request, UUID organizationId) {
        organizationAccessService.requireAdminAccess(organizationId);

        Organization organization = organizationRepository.findByIdAndActiveTrue(organizationId)
                .orElseThrow(() -> new ResourceNotFoundException("Organization not found"));

        Account account = mapper.createEntity(request, organization);

        accountRepository.save(account);

        return mapper.toResponse(account);
    }

    public Page<AccountResponse> findAll(
            UUID organizationId,
            Pageable pageable) {
        organizationAccessService.requireReadAccess(organizationId);

        return accountRepository
                .findAllByOrganizationIdAndActiveTrue(organizationId, pageable)
                .map(mapper::toResponse);
    }

    public AccountResponse findById(UUID id, UUID organizationId) {
        organizationAccessService.requireReadAccess(organizationId);

        Account account = accountRepository.findByIdAndOrganizationIdAndActiveTrue(id, organizationId)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found"));

        return mapper.toResponse(account);
    }

    public AccountResponse update(
            UUID id,
            UUID organizationId,
            UpdateAccountRequest request) {
        organizationAccessService.requireAdminAccess(organizationId);

        Account account = accountRepository.findByIdAndOrganizationIdAndActiveTrue(id, organizationId)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found"));

        mapper.updateEntity(account, request);
        accountRepository.save(account);

        return mapper.toResponse(account);
    }

    public void delete(UUID id, UUID organizationId) {
        organizationAccessService.requireAdminAccess(organizationId);

        Account account = accountRepository.findByIdAndOrganizationIdAndActiveTrue(id, organizationId)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found"));

        account.setActive(false);
        accountRepository.save(account);
    }

    @Transactional(readOnly = true)
    public List<OptionResponse> findOptions(UUID organizationId) {
        organizationAccessService.requireReadAccess(organizationId);

        return accountRepository.findByOrganizationIdAndActiveTrueOrderByNameAsc(organizationId)
                .stream()
                .map(account -> new OptionResponse(
                        account.getId(),
                        account.getName()))
                .toList();
    }
}