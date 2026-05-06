package com.fluxfund.api.domain.organization;

import com.fluxfund.api.domain.organization.dto.CreateOrganizationRequest;
import com.fluxfund.api.domain.organization.dto.OrganizationResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/organizations")
@RequiredArgsConstructor
public class OrganizationController {

    private final OrganizationService organizationService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public OrganizationResponse create(@RequestBody @Valid CreateOrganizationRequest request) {
        return organizationService.create(request);
    }

    @GetMapping
    public List<OrganizationResponse> findAll() {
        return organizationService.findAll();
    }

    @GetMapping("/{id}")
    public OrganizationResponse findById(@PathVariable UUID id) {
        return organizationService.findById(id);
    }

    @PutMapping("/{id}")
    public OrganizationResponse update(
            @PathVariable UUID id,
            @RequestBody @Valid CreateOrganizationRequest request
    ) {
        return organizationService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id) {
        organizationService.delete(id);
    }
}