package com.fluxfund.api.domain.account.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.fluxfund.api.domain.account.dto.AccountResponse;
import com.fluxfund.api.domain.account.dto.CreateAccountRequest;
import com.fluxfund.api.domain.account.dto.UpdateAccountRequest;
import com.fluxfund.api.domain.account.service.AccountService;
import com.fluxfund.api.shared.dto.OptionResponse;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import static com.fluxfund.api.security.TenantHeaders.ORGANIZATION_ID;

@RestController
@RequestMapping("/api/v1/accounts")
@RequiredArgsConstructor
public class AccountController {

    private final AccountService service;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public AccountResponse create(
            @RequestHeader(ORGANIZATION_ID) UUID organizationId,
            @Valid @RequestBody CreateAccountRequest request) {
        return service.create(request, organizationId);
    }

    @GetMapping
    public Page<AccountResponse> findAll(
            @RequestHeader(ORGANIZATION_ID) UUID organizationId,
            Pageable pageable) {
        return service.findAll(organizationId, pageable);
    }

    @GetMapping("/{id}")
    public AccountResponse findById(
            @RequestHeader(ORGANIZATION_ID) UUID organizationId,
            @PathVariable UUID id) {
        return service.findById(id, organizationId);
    }

    @PutMapping("/{id}")
    public AccountResponse update(
            @PathVariable UUID id,
            @RequestHeader(ORGANIZATION_ID) UUID organizationId,
            @Valid @RequestBody UpdateAccountRequest request) {
        return service.update(id, organizationId, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(
            @PathVariable UUID id,
            @RequestHeader(ORGANIZATION_ID) UUID organizationId) {
        service.delete(id, organizationId);
    }

    @GetMapping("/options")
    public List<OptionResponse> findOptions(
            @RequestHeader(ORGANIZATION_ID) UUID organizationId) {
        return service.findOptions(organizationId);
    }
}