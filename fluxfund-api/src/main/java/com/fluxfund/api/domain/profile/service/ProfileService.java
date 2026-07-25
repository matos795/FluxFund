package com.fluxfund.api.domain.profile.service;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fluxfund.api.domain.profile.dto.ChangePasswordRequest;
import com.fluxfund.api.domain.profile.dto.ProfileResponse;
import com.fluxfund.api.domain.profile.dto.UpdateProfileRequest;
import com.fluxfund.api.domain.user.AppUser;
import com.fluxfund.api.domain.user.AppUserRepository;
import com.fluxfund.api.security.CurrentUserService;
import com.fluxfund.api.shared.exception.BusinessException;
import com.fluxfund.api.shared.exception.ResourceNotFoundException;
import com.fluxfund.api.shared.util.StringNormalizer;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class ProfileService {

    private final CurrentUserService currentUserService;
    private final AppUserRepository appUserRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional(readOnly = true)
    public ProfileResponse findCurrent() {
        AppUser user = findCurrentUser();

        return toResponse(user);
    }

    public ProfileResponse update(UpdateProfileRequest request) {
        AppUser user = findCurrentUser();

        user.setName(StringNormalizer.normalize(request.name()));

        return toResponse(appUserRepository.save(user));
    }

    public void changePassword(ChangePasswordRequest request) {
        AppUser user = findCurrentUser();

        if (!passwordEncoder.matches(
                request.currentPassword(),
                user.getPasswordHash())) {
            throw new BusinessException("Current password is incorrect");
        }

        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));

        user.revokeSessions();

        appUserRepository.save(user);
    }

    private AppUser findCurrentUser() {
        return appUserRepository
                .findByIdAndActiveTrue(currentUserService.requireUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private ProfileResponse toResponse(AppUser user) {
        return new ProfileResponse(
                user.getId(),
                user.getName(),
                user.getEmail());
    }
}