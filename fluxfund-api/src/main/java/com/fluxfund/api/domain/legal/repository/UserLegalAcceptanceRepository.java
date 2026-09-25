package com.fluxfund.api.domain.legal.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.fluxfund.api.domain.legal.UserLegalAcceptance;

public interface UserLegalAcceptanceRepository extends JpaRepository<UserLegalAcceptance, UUID> {

    boolean existsByUser_IdAndTermsVersionAndTermsHashAndPrivacyNoticeVersionAndPrivacyNoticeHash(
            UUID userId,
            String termsVersion,
            String termsHash,
            String privacyNoticeVersion,
            String privacyNoticeHash);

    List<UserLegalAcceptance> findAllByUser_IdOrderByAcceptedAtDesc(UUID userId);

    Optional<UserLegalAcceptance> findFirstByUser_IdAndTermsVersionAndTermsHashAndPrivacyNoticeVersionAndPrivacyNoticeHashOrderByAcceptedAtDesc(
            UUID userId,
            String termsVersion,
            String termsHash,
            String privacyNoticeVersion,
            String privacyNoticeHash);
}