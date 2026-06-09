package com.fluxfund.api.domain.organizationsettings;

import com.fluxfund.api.domain.fund.Fund;
import com.fluxfund.api.domain.organization.Organization;
import com.fluxfund.api.shared.BaseEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "organization_settings", uniqueConstraints = {
                @UniqueConstraint(name = "uk_organization_settings_organization", columnNames = "organization_id")
})
@Getter
@Setter
@NoArgsConstructor
public class OrganizationSettings extends BaseEntity {

        @OneToOne(fetch = FetchType.LAZY)
        @JoinColumn(name = "organization_id", nullable = false)
        private Organization organization;

        @ManyToOne(fetch = FetchType.LAZY)
        @JoinColumn(name = "default_fund_id")
        private Fund defaultFund;

        @Column(name = "allow_negative_funds", nullable = false)
        private boolean allowNegativeFunds = true;

        @Column(name = "suggest_default_fund_reallocation", nullable = false)
        private boolean suggestDefaultFundReallocation = false;
}
