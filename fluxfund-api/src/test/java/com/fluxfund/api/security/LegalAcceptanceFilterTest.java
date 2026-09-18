package com.fluxfund.api.security;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fluxfund.api.domain.legal.service.LegalAcceptanceService;
import com.fluxfund.api.domain.legal.LegalAcceptanceStatus;

import jakarta.servlet.FilterChain;

class LegalAcceptanceFilterTest {

    private final LegalAcceptanceService legalAcceptanceService = Mockito.mock(
            LegalAcceptanceService.class);

    private final ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();

    private final LegalAcceptanceFilter filter = new LegalAcceptanceFilter(
            legalAcceptanceService,
            objectMapper);

    @AfterEach
    void clearSecurityContext() {

        SecurityContextHolder.clearContext();
    }

    @Test
    void shouldBlockProtectedRequestWhenAcceptanceIsRequired() throws Exception {

        UUID userId = UUID.randomUUID();

        authenticate(userId);

        when(legalAcceptanceService.getStatus(userId))
                .thenReturn(new LegalAcceptanceStatus(
                        true,
                        "2026-09",
                        "terms-hash",
                        "2026-09",
                        "privacy-hash"));

        MockHttpServletRequest request = new MockHttpServletRequest(
                "GET",
                "/api/v1/accounts");

        MockHttpServletResponse response = new MockHttpServletResponse();

        FilterChain filterChain = Mockito.mock(
                FilterChain.class);

        filter.doFilter(
                request,
                response,
                filterChain);

        assertThat(response.getStatus())
                .isEqualTo(403);

        assertThat(response.getContentAsString())
                .contains(LegalAcceptanceFilter.ERROR_NAME);

        verify(
                filterChain,
                never())
                .doFilter(
                        request,
                        response);
    }

    @Test
    void shouldAllowProtectedRequestWhenCurrentDocumentsWereAccepted() throws Exception {

        UUID userId = UUID.randomUUID();

        authenticate(userId);

        when(legalAcceptanceService.getStatus(userId))
                .thenReturn(new LegalAcceptanceStatus(
                        false,
                        "2026-09",
                        "terms-hash",
                        "2026-09",
                        "privacy-hash"));

        MockHttpServletRequest request = new MockHttpServletRequest(
                "GET",
                "/api/v1/accounts");

        MockHttpServletResponse response = new MockHttpServletResponse();

        FilterChain filterChain = Mockito.mock(
                FilterChain.class);

        filter.doFilter(
                request,
                response,
                filterChain);

        verify(filterChain)
                .doFilter(
                        request,
                        response);
    }

    @Test
    void shouldAllowLegalEndpointsWhileAcceptanceIsPending()
            throws Exception {

        UUID userId = UUID.randomUUID();

        authenticate(userId);

        MockHttpServletRequest request = new MockHttpServletRequest(
                "GET",
                "/api/v1/legal/documents");

        MockHttpServletResponse response = new MockHttpServletResponse();

        FilterChain filterChain = Mockito.mock(
                FilterChain.class);

        filter.doFilter(
                request,
                response,
                filterChain);

        verify(filterChain)
                .doFilter(
                        request,
                        response);

        verify(
                legalAcceptanceService,
                never())
                .getStatus(userId);
    }

    @Test
    void shouldAllowAuthMeWhileAcceptanceIsPending()
            throws Exception {

        UUID userId = UUID.randomUUID();

        authenticate(userId);

        MockHttpServletRequest request = new MockHttpServletRequest(
                "GET",
                "/api/v1/auth/me");

        MockHttpServletResponse response = new MockHttpServletResponse();

        FilterChain filterChain = Mockito.mock(
                FilterChain.class);

        filter.doFilter(
                request,
                response,
                filterChain);

        verify(filterChain)
                .doFilter(
                        request,
                        response);

        verify(
                legalAcceptanceService,
                never())
                .getStatus(userId);
    }

    private void authenticate(
            UUID userId) {

        Instant now = Instant.now();

        Jwt jwt = Jwt.withTokenValue("token")
                .header("alg", "HS256")
                .subject(userId.toString())
                .issuedAt(now)
                .expiresAt(now.plusSeconds(3600))
                .build();

        JwtAuthenticationToken authentication = new JwtAuthenticationToken(jwt, List.of());

        SecurityContextHolder.getContext().setAuthentication(authentication);
    }
}