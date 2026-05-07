package com.fluxfund.api.domain.account.service;

import java.util.Objects;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import com.fluxfund.api.domain.account.Account;
import com.fluxfund.api.domain.account.dto.AccountResponse;
import com.fluxfund.api.domain.account.dto.CreateAccountRequest;
import com.fluxfund.api.domain.account.dto.UpdateAccountRequest;
import com.fluxfund.api.domain.account.mapper.AccountMapper;
import com.fluxfund.api.domain.account.repository.AccountRepository;
import com.fluxfund.api.domain.organization.Organization;
import com.fluxfund.api.domain.organization.OrganizationRepository;
import com.fluxfund.api.shared.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AccountService {

    private final AccountRepository accountRepository;
    private final OrganizationRepository organizationRepository;
    private final AccountMapper mapper;

    public AccountResponse create(CreateAccountRequest request) {

        UUID organizationId = Objects.requireNonNull(request.organizationId(), "Organization id is required");

        Organization organization = organizationRepository.findById(organizationId)
                .orElseThrow(() -> new ResourceNotFoundException("Organization not found"));

        Account account = mapper.createEntity(request, organization);

        accountRepository.save(account);

        return mapper.toResponse(account);
    }

    public Page<AccountResponse> findAll(
            UUID organizationId,
            Pageable pageable) {

        return accountRepository
                .findAllByOrganizationId(organizationId, pageable)
                .map(mapper::toResponse);
    }

    public AccountResponse findById(UUID id) {

        Account account = accountRepository.findById(Objects.requireNonNull(id))
                .orElseThrow(() -> new ResourceNotFoundException("Account not found"));

        return mapper.toResponse(account);
    }

    public AccountResponse update(
            UUID id,
            UpdateAccountRequest request) {

        Account account = accountRepository.findById(Objects.requireNonNull(id))
                .orElseThrow(() -> new ResourceNotFoundException("Account not found"));

        mapper.updateEntity(account, request);
        accountRepository.save(account);

        return mapper.toResponse(account);
    }

    public void delete(UUID id) {

        Account account = accountRepository.findById(Objects.requireNonNull(id))
                .orElseThrow(() -> new ResourceNotFoundException("Account not found"));

        account.setActive(false);
        accountRepository.save(account);
    }
}