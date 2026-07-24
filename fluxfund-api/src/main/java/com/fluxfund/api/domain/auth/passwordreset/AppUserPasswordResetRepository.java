package com.fluxfund.api.domain.auth.passwordreset;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface AppUserPasswordResetRepository
        extends JpaRepository<
                AppUserPasswordReset,
                UUID> {

    Optional<AppUserPasswordReset>
            findByTokenHash(
                    String tokenHash);

    List<AppUserPasswordReset>
            findAllByUser_IdAndUsedAtIsNull(
                    UUID userId);
}