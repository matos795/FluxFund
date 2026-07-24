package com.fluxfund.api.domain.organizationuser.invitation;

import static com.fluxfund.api.security.TenantHeaders.ORGANIZATION_ID;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.fluxfund.api.domain.organizationuser.invitation.dto.CreateOrganizationUserInvitationRequest;
import com.fluxfund.api.domain.organizationuser.invitation.dto.CreateOrganizationUserInvitationResponse;
import com.fluxfund.api.domain.organizationuser.invitation.dto.OrganizationUserInvitationResponse;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/organization-user-invitations")
@RequiredArgsConstructor
public class OrganizationUserInvitationController {

        private final OrganizationUserInvitationService service;

        @GetMapping
        public List<OrganizationUserInvitationResponse> findAll(
                        @RequestHeader(ORGANIZATION_ID) UUID organizationId) {

                return service.findAll(organizationId);
        }

        @PostMapping
        @ResponseStatus(HttpStatus.CREATED)
        public CreateOrganizationUserInvitationResponse create(
                        @RequestHeader(ORGANIZATION_ID) UUID organizationId,

                        @RequestBody @Valid CreateOrganizationUserInvitationRequest request) {

                return service.create(
                                organizationId,
                                request);
        }

        @PostMapping("/{invitationId}/regenerate-link")
        public CreateOrganizationUserInvitationResponse regenerateLink(
                        @RequestHeader(ORGANIZATION_ID) UUID organizationId,
                        @PathVariable UUID invitationId) {

                return service.regenerateLink(organizationId, invitationId);
        }

        @DeleteMapping("/{invitationId}")
        @ResponseStatus(HttpStatus.NO_CONTENT)
        public void cancel(
                        @RequestHeader(ORGANIZATION_ID) UUID organizationId,

                        @PathVariable UUID invitationId) {

                service.cancel(
                                organizationId,
                                invitationId);
        }
}