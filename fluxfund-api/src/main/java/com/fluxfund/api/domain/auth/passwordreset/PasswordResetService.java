package com.fluxfund.api.domain.auth.passwordreset;

import java.time.Duration;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fluxfund.api.domain.auth.passwordreset.dto.RequestPasswordResetRequest;
import com.fluxfund.api.domain.auth.passwordreset.dto.ResetPasswordRequest;
import com.fluxfund.api.domain.securityevent.SecurityEventOutcome;
import com.fluxfund.api.domain.securityevent.SecurityEventService;
import com.fluxfund.api.domain.securityevent.SecurityEventType;
import com.fluxfund.api.domain.securityevent.SecurityRequestMetadata;
import com.fluxfund.api.domain.user.AppUser;
import com.fluxfund.api.domain.user.AppUserRepository;
import com.fluxfund.api.security.InvitationTokenService;
import com.fluxfund.api.shared.exception.BusinessException;
import com.fluxfund.api.shared.mail.ApplicationMailService;
import com.fluxfund.api.shared.util.EmailNormalizer;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class PasswordResetService {

    private final AppUserPasswordResetRepository passwordResetRepository;

    private final AppUserRepository appUserRepository;

    private final InvitationTokenService tokenService;

    private final PasswordEncoder passwordEncoder;

    private final ApplicationMailService applicationMailService;

    private final SecurityEventService securityEventService;

    @Value("${app.security.password-reset-expiration:PT30M}")
    private Duration passwordResetExpiration;

    @Value("${app.frontend.base-url:http://localhost:5173}")
    private String frontendBaseUrl;

    public void requestReset(
            RequestPasswordResetRequest request,
            SecurityRequestMetadata metadata) {

        String normalizedEmail = EmailNormalizer.normalize(
                request.email());

        AppUser user = appUserRepository
                .findByEmailIgnoreCaseAndActiveTrue(
                        normalizedEmail)
                .orElse(null);

        /*
         * Não informamos ao cliente se a conta
         * existe ou não.
         */
        if (user == null) {
            securityEventService.record(
                    null,
                    normalizedEmail,

                    SecurityEventType.PASSWORD_RESET_REQUEST,

                    SecurityEventOutcome.FAILURE,

                    metadata,

                    "Password reset request ignored "
                            + "because no active account "
                            + "was found");

            return;
        }

        OffsetDateTime now = OffsetDateTime.now();

        /*
         * Guardamos os links anteriores para
         * invalidá-los somente se o novo e-mail
         * realmente for enviado.
         */
        List<AppUserPasswordReset> previousUnusedTokens =

                passwordResetRepository
                        .findAllByUser_IdAndUsedAtIsNull(
                                user.getId());

        var generatedToken = tokenService.generate();

        AppUserPasswordReset passwordReset = new AppUserPasswordReset();

        passwordReset.setUser(user);

        passwordReset.setTokenHash(
                generatedToken.tokenHash());

        passwordReset.setExpiresAt(
                now.plus(
                        passwordResetExpiration));

        AppUserPasswordReset savedPasswordReset = passwordResetRepository
                .saveAndFlush(
                        passwordReset);

        String baseUrl = frontendBaseUrl.replaceAll(
                "/+$",
                "");

        String resetUrl = baseUrl
                + "/reset-password?token="
                + generatedToken.rawToken();

        boolean emailSent = applicationMailService
                .sendPasswordReset(
                        user.getName(),
                        user.getEmail(),
                        resetUrl,
                        savedPasswordReset
                                .getExpiresAt());

        if (!emailSent) {
            /*
             * O token não deve ficar válido quando
             * o usuário não recebeu o e-mail.
             */
            savedPasswordReset.setUsedAt(now);

            passwordResetRepository.save(
                    savedPasswordReset);

            securityEventService.record(
                    user.getId(),
                    user.getEmail(),

                    SecurityEventType.PASSWORD_RESET_REQUEST,

                    SecurityEventOutcome.FAILURE,

                    metadata,

                    "Password reset email could not be sent");

            return;
        }

        /*
         * O novo e-mail foi enviado. Agora todos os
         * links anteriores deixam de funcionar.
         */
        previousUnusedTokens.forEach(
                token -> token.setUsedAt(now));

        passwordResetRepository.saveAll(
                previousUnusedTokens);

        securityEventService.record(
                user.getId(),
                user.getEmail(),

                SecurityEventType.PASSWORD_RESET_REQUEST,

                SecurityEventOutcome.SUCCESS,

                metadata,

                "Password reset email sent");
    }

    public void resetPassword(
            ResetPasswordRequest request,
            SecurityRequestMetadata metadata) {

        String tokenHash;

        try {
            tokenHash = tokenService.hash(
                    request.token());

        } catch (IllegalArgumentException exception) {
            throw invalidTokenException(
                    metadata,
                    null,
                    null,

                    "Password reset rejected because "
                            + "the token format was invalid");
        }

        AppUserPasswordReset passwordReset = passwordResetRepository
                .findByTokenHash(
                        tokenHash)
                .orElseThrow(
                        () -> invalidTokenException(
                                metadata,
                                null,
                                null,

                                "Password reset rejected because "
                                        + "the token was not found"));

        AppUser user = passwordReset.getUser();

        OffsetDateTime now = OffsetDateTime.now();

        if (passwordReset.getUsedAt() != null
                || !passwordReset
                        .getExpiresAt()
                        .isAfter(now)) {

            throw invalidTokenException(
                    metadata,
                    user.getId(),
                    user.getEmail(),

                    "Password reset rejected because "
                            + "the token was expired "
                            + "or already used");
        }

        /*
         * Recuperar a senha não deve reativar
         * automaticamente uma conta desativada.
         */
        if (!user.isActive()) {
            throw invalidTokenException(
                    metadata,
                    user.getId(),
                    user.getEmail(),

                    "Password reset rejected because "
                            + "the account is inactive");
        }

        user.setPasswordHash(
                passwordEncoder.encode(
                        request.newPassword()));

        user.revokeSessions();

        appUserRepository.save(user);

        /*
         * Depois de trocar a senha, todos os links
         * ainda não utilizados desse usuário são
         * invalidados, incluindo o atual.
         */
        List<AppUserPasswordReset> unusedTokens =

                passwordResetRepository
                        .findAllByUser_IdAndUsedAtIsNull(
                                user.getId());

        unusedTokens.forEach(
                token -> token.setUsedAt(now));

        passwordResetRepository.saveAll(
                unusedTokens);

        securityEventService.record(
                user.getId(),
                user.getEmail(),

                SecurityEventType.PASSWORD_RESET_CONFIRMATION,

                SecurityEventOutcome.SUCCESS,

                metadata,

                "Password reset completed");
    }

    private BusinessException invalidTokenException(
            SecurityRequestMetadata metadata,
            UUID userId,
            String email,
            String description) {

        securityEventService.record(
                userId,
                email,

                SecurityEventType.PASSWORD_RESET_CONFIRMATION,

                SecurityEventOutcome.FAILURE,

                metadata,
                description);

        return new BusinessException(
                "Password reset token is invalid or expired");
    }
}