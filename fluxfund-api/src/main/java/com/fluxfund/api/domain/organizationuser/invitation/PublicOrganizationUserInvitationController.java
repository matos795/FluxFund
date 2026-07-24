package com.fluxfund.api.domain.organizationuser.invitation;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.fluxfund.api.domain.organizationuser.invitation.dto.AcceptOrganizationUserInvitationRequest;
import com.fluxfund.api.domain.organizationuser.invitation.dto.AcceptOrganizationUserInvitationResponse;
import com.fluxfund.api.domain.organizationuser.invitation.dto.OrganizationUserInvitationDetailsResponse;
import com.fluxfund.api.domain.securityevent.RequestRateLimiterService;
import com.fluxfund.api.domain.securityevent.SecurityRequestMetadataResolver;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/public/organization-user-invitations")
@RequiredArgsConstructor
public class PublicOrganizationUserInvitationController {

    private final OrganizationUserInvitationService service;
    private final SecurityRequestMetadataResolver metadataResolver;
    private final RequestRateLimiterService rateLimiterService;

    @GetMapping("/{token}")
    public OrganizationUserInvitationDetailsResponse findDetails(

            @PathVariable String token,

            HttpServletRequest httpRequest) {

        var metadata = metadataResolver.resolve(
                httpRequest);

        rateLimiterService
                .checkInvitationDetails(
                        metadata);

        return service.findDetails(
                token);
    }

    @PostMapping("/{token}/accept")
    public AcceptOrganizationUserInvitationResponse accept(

            @PathVariable String token,

            @RequestBody @Valid AcceptOrganizationUserInvitationRequest request,

            HttpServletRequest httpRequest) {

        var metadata = metadataResolver.resolve(
                httpRequest);

        rateLimiterService
                .checkInvitationAcceptance(
                        metadata);

        return service.accept(
                token,
                request);
    }
}