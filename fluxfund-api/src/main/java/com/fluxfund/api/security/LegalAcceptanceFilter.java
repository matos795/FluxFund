package com.fluxfund.api.security;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.filter.OncePerRequestFilter;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fluxfund.api.domain.legal.service.LegalAcceptanceService;
import com.fluxfund.api.domain.legal.LegalAcceptanceStatus;
import com.fluxfund.api.shared.exception.ApiErrorResponse;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
public class LegalAcceptanceFilter extends OncePerRequestFilter {

    public static final String ERROR_NAME = "Legal Acceptance Required";

    private final LegalAcceptanceService legalAcceptanceService;

    private final ObjectMapper objectMapper;

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {

        String path = request.getRequestURI();

        return path.startsWith("/api/v1/legal/") || path.equals("/api/v1/auth/me");
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain)
            throws ServletException, IOException {

        Authentication authentication = SecurityContextHolder
                .getContext()
                .getAuthentication();

        if (!(authentication instanceof JwtAuthenticationToken jwtAuthentication)
                || !authentication.isAuthenticated()) {

            filterChain.doFilter(request, response);

            return;
        }

        UUID userId = UUID.fromString(
                jwtAuthentication
                        .getToken()
                        .getSubject());

        LegalAcceptanceStatus status = legalAcceptanceService.getStatus(userId);

        if (!status.acceptanceRequired()) {
            filterChain.doFilter(request, response);

            return;
        }

        ApiErrorResponse error = new ApiErrorResponse(
                LocalDateTime.now(),
                HttpStatus.FORBIDDEN.value(),
                ERROR_NAME,
                "You must accept the current Terms of Use "
                        + "and acknowledge the Privacy Notice "
                        + "before accessing FluxFund",
                request.getRequestURI());

        response.setStatus(HttpStatus.FORBIDDEN.value());

        response.setContentType(MediaType.APPLICATION_JSON_VALUE);

        objectMapper.writeValue(response.getOutputStream(), error);
    }
}