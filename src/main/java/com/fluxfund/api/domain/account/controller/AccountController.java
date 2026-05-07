package com.fluxfund.api.domain.account.controller;

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
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.fluxfund.api.domain.account.dto.AccountResponse;
import com.fluxfund.api.domain.account.dto.CreateAccountRequest;
import com.fluxfund.api.domain.account.dto.UpdateAccountRequest;
import com.fluxfund.api.domain.account.service.AccountService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/accounts")
@RequiredArgsConstructor
public class AccountController {

    private final AccountService service;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public AccountResponse create(
            @Valid @RequestBody CreateAccountRequest request
    ) {
        return service.create(request);
    }

    @GetMapping
    public Page<AccountResponse> findAll(
            @RequestParam UUID organizationId,
            Pageable pageable
    ) {
        return service.findAll(organizationId, pageable);
    }

    @GetMapping("/{id}")
    public AccountResponse findById(
            @PathVariable UUID id
    ) {
        return service.findById(id);
    }

    @PutMapping("/{id}")
    public AccountResponse update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateAccountRequest request
    ) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id}")
    public void delete(
            @PathVariable UUID id
    ) {
        service.delete(id);
    }
}