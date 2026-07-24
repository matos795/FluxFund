package com.fluxfund.api.domain.auth.passwordreset;

import java.time.Duration;
import java.time.OffsetDateTime;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fluxfund.api.domain.auth.passwordreset.dto.RequestPasswordResetRequest;
import com.fluxfund.api.domain.auth.passwordreset.dto.ResetPasswordRequest;
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

    private final AppUserPasswordResetRepository
            passwordResetRepository;

    private final AppUserRepository
            appUserRepository;

    private final InvitationTokenService
            tokenService;

    private final PasswordEncoder
            passwordEncoder;

    private final ApplicationMailService
            applicationMailService;

    @Value(
            "${app.security.password-reset-expiration:PT30M}")
    private Duration passwordResetExpiration;

    @Value(
            "${app.frontend.base-url:http://localhost:5173}")
    private String frontendBaseUrl;

    public void requestReset(
            RequestPasswordResetRequest request) {

        String normalizedEmail =
                EmailNormalizer.normalize(
                        request.email());

        AppUser user =
                appUserRepository
                        .findByEmailIgnoreCaseAndActiveTrue(
                                normalizedEmail)
                        .orElse(null);

        /*
         * Não informamos ao cliente se a conta
         * existe ou não.
         */
        if (user == null) {
            return;
        }

        OffsetDateTime now =
                OffsetDateTime.now();

        /*
         * Guardamos os links anteriores para
         * invalidá-los somente se o novo e-mail
         * realmente for enviado.
         */
        List<AppUserPasswordReset>
                previousUnusedTokens =

                passwordResetRepository
                        .findAllByUser_IdAndUsedAtIsNull(
                                user.getId());

        var generatedToken =
                tokenService.generate();

        AppUserPasswordReset passwordReset =
                new AppUserPasswordReset();

        passwordReset.setUser(user);

        passwordReset.setTokenHash(
                generatedToken.tokenHash());

        passwordReset.setExpiresAt(
                now.plus(
                        passwordResetExpiration));

        AppUserPasswordReset savedPasswordReset =
                passwordResetRepository
                        .saveAndFlush(
                                passwordReset);

        String baseUrl =
                frontendBaseUrl.replaceAll(
                        "/+$",
                        "");

        String resetUrl =
                baseUrl
                        + "/reset-password?token="
                        + generatedToken.rawToken();

        boolean emailSent =
                applicationMailService
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

            return;
        }

        /*
         * O novo e-mail foi enviado. Agora todos os
         * links anteriores deixam de funcionar.
         */
        previousUnusedTokens.forEach(
                token ->
                        token.setUsedAt(now));

        passwordResetRepository.saveAll(
                previousUnusedTokens);
    }

    public void resetPassword(
            ResetPasswordRequest request) {

        String tokenHash;

        try {
            tokenHash =
                    tokenService.hash(
                            request.token());

        } catch (
                IllegalArgumentException exception
        ) {
            throw invalidTokenException();
        }

        AppUserPasswordReset passwordReset =
                passwordResetRepository
                        .findByTokenHash(
                                tokenHash)
                        .orElseThrow(
                                this
                                        ::invalidTokenException);

        OffsetDateTime now =
                OffsetDateTime.now();

        if (passwordReset.getUsedAt() != null
                || !passwordReset
                        .getExpiresAt()
                        .isAfter(now)) {

            throw invalidTokenException();
        }

        AppUser user =
                passwordReset.getUser();

        /*
         * Recuperar a senha não deve reativar
         * automaticamente uma conta desativada.
         */
        if (!user.isActive()) {
            throw invalidTokenException();
        }

        user.setPasswordHash(
                passwordEncoder.encode(
                        request.newPassword()));

        appUserRepository.save(user);

        /*
         * Depois de trocar a senha, todos os links
         * ainda não utilizados desse usuário são
         * invalidados, incluindo o atual.
         */
        List<AppUserPasswordReset>
                unusedTokens =

                passwordResetRepository
                        .findAllByUser_IdAndUsedAtIsNull(
                                user.getId());

        unusedTokens.forEach(
                token ->
                        token.setUsedAt(now));

        passwordResetRepository.saveAll(
                unusedTokens);
    }

    private BusinessException
            invalidTokenException() {

        return new BusinessException(
                "Password reset token is invalid or expired");
    }
}