package com.fluxfund.api.domain.legal;

import java.time.OffsetDateTime;

import com.fluxfund.api.domain.user.AppUser;
import com.fluxfund.api.shared.BaseEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "user_legal_acceptance", uniqueConstraints = {
        @UniqueConstraint(name = "uk_user_legal_acceptance_versions", columnNames = {
                "user_id",
                "terms_version",
                "privacy_notice_version"
        })
})
@Getter
@Setter
@NoArgsConstructor
public class UserLegalAcceptance extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private AppUser user;

    @Column(name = "terms_version", nullable = false, length = 50)
    private String termsVersion;

    @Column(name = "terms_hash", nullable = false, length = 64)
    private String termsHash;

    @Column(name = "privacy_notice_version", nullable = false, length = 50)
    private String privacyNoticeVersion;

    @Column(name = "privacy_notice_hash", nullable = false, length = 64)
    private String privacyNoticeHash;

    @Column(name = "accepted_at", nullable = false)
    private OffsetDateTime acceptedAt;
}