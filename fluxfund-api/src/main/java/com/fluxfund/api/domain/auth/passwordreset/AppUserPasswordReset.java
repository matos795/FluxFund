package com.fluxfund.api.domain.auth.passwordreset;

import java.time.OffsetDateTime;

import com.fluxfund.api.domain.user.AppUser;
import com.fluxfund.api.shared.BaseEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "app_user_password_reset")
@Getter
@Setter
@NoArgsConstructor
public class AppUserPasswordReset
        extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "user_id",
            nullable = false)
    private AppUser user;

    @Column(
            name = "token_hash",
            nullable = false,
            unique = true,
            length = 64)
    private String tokenHash;

    @Column(
            name = "expires_at",
            nullable = false)
    private OffsetDateTime expiresAt;

    @Column(name = "used_at")
    private OffsetDateTime usedAt;
}