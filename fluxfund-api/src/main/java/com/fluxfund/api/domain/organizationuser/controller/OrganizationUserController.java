package com.fluxfund.api.domain.organizationuser.controller;

import static com.fluxfund.api.security.TenantHeaders.ORGANIZATION_ID;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.fluxfund.api.domain.organizationuser.dto.CreateOrganizationUserRequest;
import com.fluxfund.api.domain.organizationuser.dto.OrganizationUserResponse;
import com.fluxfund.api.domain.organizationuser.dto.UpdateOrganizationUserRoleRequest;
import com.fluxfund.api.domain.organizationuser.dto.UpdateOrganizationUserStatusRequest;
import com.fluxfund.api.domain.organizationuser.invitation.OrganizationUserInvitationService;
import com.fluxfund.api.domain.organizationuser.invitation.dto.CreateOrganizationUserInvitationResponse;
import com.fluxfund.api.domain.organizationuser.service.OrganizationUserService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/organization-users")
@RequiredArgsConstructor
public class OrganizationUserController {

    private final OrganizationUserService service;

    @GetMapping
    public ResponseEntity<List<OrganizationUserResponse>> findAll(
            @RequestHeader(ORGANIZATION_ID) UUID organizationId) {

        return ResponseEntity.ok(service.findAll(organizationId));
    }

    @PostMapping
    public ResponseEntity<OrganizationUserResponse> create(
            @RequestHeader(ORGANIZATION_ID) UUID organizationId,
            @RequestBody @Valid CreateOrganizationUserRequest request) {

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(service.create(organizationId, request));
    }

    @PatchMapping("/{userId}/role")
    public ResponseEntity<OrganizationUserResponse> updateRole(
            @RequestHeader(ORGANIZATION_ID) UUID organizationId,
            @PathVariable UUID userId,
            @RequestBody @Valid UpdateOrganizationUserRoleRequest request) {

        return ResponseEntity.ok(
                service.updateRole(organizationId, userId, request));
    }

    @PatchMapping("/{userId}/status")
    public ResponseEntity<OrganizationUserResponse> updateStatus(
            @RequestHeader(ORGANIZATION_ID) UUID organizationId,
            @PathVariable UUID userId,
            @RequestBody @Valid UpdateOrganizationUserStatusRequest request) {

        return ResponseEntity.ok(
                service.updateStatus(organizationId, userId, request));
    }
}