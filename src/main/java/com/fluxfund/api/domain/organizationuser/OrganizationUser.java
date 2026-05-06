package com.fluxfund.api.domain.organizationuser;

import com.fluxfund.api.domain.organization.Organization;
import com.fluxfund.api.domain.user.AppUser;

import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.MapsId;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "organization_user")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class OrganizationUser {

    @EmbeddedId
    private OrganizationUserId id;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("organizationId")
    @JoinColumn(name = "organization_id")
    private Organization organization;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("userId")
    @JoinColumn(name = "user_id")
    private AppUser user;

    private String role;
}
