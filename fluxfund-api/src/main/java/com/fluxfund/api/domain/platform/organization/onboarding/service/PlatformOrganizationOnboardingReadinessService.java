package com.fluxfund.api.domain.platform.organization.onboarding.service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fluxfund.api.domain.account.Account;
import com.fluxfund.api.domain.account.AccountType;
import com.fluxfund.api.domain.account.repository.AccountRepository;
import com.fluxfund.api.domain.category.CategoryType;
import com.fluxfund.api.domain.category.repository.CategoryRepository;
import com.fluxfund.api.domain.fund.Fund;
import com.fluxfund.api.domain.fund.repository.FundRepository;
import com.fluxfund.api.domain.organization.Organization;
import com.fluxfund.api.domain.organizationsettings.OrganizationSettings;
import com.fluxfund.api.domain.organizationsettings.repository.OrganizationSettingsRepository;
import com.fluxfund.api.domain.organizationuser.OrganizationRole;
import com.fluxfund.api.domain.organizationuser.OrganizationUserRepository;
import com.fluxfund.api.domain.platform.organization.onboarding.PlatformOrganizationOnboardingRequirementKey;
import com.fluxfund.api.domain.platform.organization.onboarding.dto.PlatformOrganizationOnboardingReadinessResponse;
import com.fluxfund.api.domain.platform.organization.onboarding.dto.PlatformOrganizationOnboardingRequirementResponse;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PlatformOrganizationOnboardingReadinessService {

    private final AccountRepository
            accountRepository;

    private final FundRepository
            fundRepository;

    private final CategoryRepository
            categoryRepository;

    private final OrganizationSettingsRepository
            organizationSettingsRepository;

    private final OrganizationUserRepository
            organizationUserRepository;

    public PlatformOrganizationOnboardingReadinessResponse
            evaluate(

                    Organization organization) {

        var organizationId =
                organization.getId();

        LocalDate today =
                LocalDate.now();

        List<Account> operationalAccounts =
                accountRepository
                        .findByOrganizationIdAndActiveTrueOrderByNameAsc(
                                organizationId)
                        .stream()
                        .filter(
                                account ->
                                        account.getType()
                                                != AccountType.CREDIT_CARD)
                        .toList();

        List<Fund> activeFunds =
                fundRepository
                        .findByOrganizationIdAndActiveTrueOrderByNameAsc(
                                organizationId);

        OrganizationSettings settings =
                organizationSettingsRepository
                        .findByOrganizationId(
                                organizationId)
                        .orElse(null);

        boolean hasActiveOwner =
                organizationUserRepository
                        .findAllByOrganization_IdOrderByUser_NameAsc(
                                organizationId)
                        .stream()
                        .anyMatch(
                                membership ->
                                        membership.isActive()

                                                && membership.getRole()
                                                == OrganizationRole.OWNER

                                                && membership
                                                        .getUser()
                                                        .isActive());

        boolean minimumProfileCompleted =
                hasText(
                        organization.getLegalName())

                        && hasText(
                                organization.getCnpj())

                        && organization
                                .getCnpj()
                                .length()
                        == 14

                        && hasText(
                                organization.getContactEmail());

        long invalidAccountDates =
                operationalAccounts
                        .stream()
                        .filter(
                                account ->
                                        account
                                                .getInitialBalanceDate()
                                        == null

                                                || account
                                                        .getInitialBalanceDate()
                                                        .isAfter(today))
                        .count();

        boolean accountDatesCompleted =
                !operationalAccounts.isEmpty()
                        && invalidAccountDates == 0;

        long invalidFundDates =
                activeFunds
                        .stream()
                        .filter(
                                fund ->
                                        fund
                                                .getInitialBalanceDate()
                                        == null

                                                || fund
                                                        .getInitialBalanceDate()
                                                        .isAfter(today))
                        .count();

        boolean fundDatesCompleted =
                !activeFunds.isEmpty()
                        && invalidFundDates == 0;

        boolean activeDefaultFundConfigured =
                settings != null

                        && settings.getDefaultFund()
                        != null

                        && settings
                                .getDefaultFund()
                                .isActive();

        boolean historyStartDateConfigured =
                settings != null

                        && settings
                                .getAccountabilityHistoryStartDate()
                        != null

                        && !settings
                                .getAccountabilityHistoryStartDate()
                                .isAfter(today);

        boolean hasIncomeCategory =
                !categoryRepository
                        .findByOrganizationIdAndActiveTrueAndType(
                                organizationId,
                                CategoryType.INCOME)
                        .isEmpty();

        boolean hasExpenseCategory =
                !categoryRepository
                        .findByOrganizationIdAndActiveTrueAndType(
                                organizationId,
                                CategoryType.EXPENSE)
                        .isEmpty();

        List<PlatformOrganizationOnboardingRequirementResponse>
                requirements = new ArrayList<>();

        requirements.add(
                requirement(
                        PlatformOrganizationOnboardingRequirementKey
                                .ORGANIZATION_ACTIVE,

                        "Organização liberada para acesso",

                        organization.isActive(),

                        "A organização está ativa.",

                        "Reative a organização no backoffice antes de colocá-la em produção."));

        requirements.add(
                requirement(
                        PlatformOrganizationOnboardingRequirementKey
                                .ACTIVE_OWNER,

                        "Proprietário ativo",

                        hasActiveOwner,

                        "Existe um proprietário com acesso ativo.",

                        "O primeiro proprietário precisa aceitar o convite e permanecer ativo."));

        requirements.add(
                requirement(
                        PlatformOrganizationOnboardingRequirementKey
                                .MINIMUM_PROFILE,

                        "Perfil institucional mínimo",

                        minimumProfileCompleted,

                        "Razão social, CNPJ e e-mail estão preenchidos.",

                        "Preencha razão social, CNPJ e e-mail em Configurações > Organização."));

        requirements.add(
                requirement(
                        PlatformOrganizationOnboardingRequirementKey
                                .ACTIVE_OPERATIONAL_ACCOUNT,

                        "Conta operacional cadastrada",

                        !operationalAccounts.isEmpty(),

                        operationalAccounts.size()
                                + " conta(s) operacional(is) ativa(s).",

                        "Cadastre ao menos uma conta bancária, caixa ou carteira digital."));

        requirements.add(
                requirement(
                        PlatformOrganizationOnboardingRequirementKey
                                .ACCOUNT_INITIAL_DATES,

                        "Datas iniciais das contas",

                        accountDatesCompleted,

                        "Todas as contas operacionais possuem data inicial válida.",

                        operationalAccounts.isEmpty()
                                ? "Cadastre uma conta operacional antes de validar as datas iniciais."

                                : invalidAccountDates
                                        + " conta(s) estão sem data inicial ou possuem data futura."));

        requirements.add(
                requirement(
                        PlatformOrganizationOnboardingRequirementKey
                                .ACTIVE_FUND,

                        "Fundo cadastrado",

                        !activeFunds.isEmpty(),

                        activeFunds.size()
                                + " fundo(s) ativo(s).",

                        "Cadastre ao menos um fundo para receber as alocações."));

        requirements.add(
                requirement(
                        PlatformOrganizationOnboardingRequirementKey
                                .FUND_INITIAL_DATES,

                        "Datas iniciais dos fundos",

                        fundDatesCompleted,

                        "Todos os fundos ativos possuem data inicial válida.",

                        activeFunds.isEmpty()
                                ? "Cadastre um fundo antes de validar as datas iniciais."

                                : invalidFundDates
                                        + " fundo(s) estão sem data inicial ou possuem data futura."));

        requirements.add(
                requirement(
                        PlatformOrganizationOnboardingRequirementKey
                                .ACTIVE_DEFAULT_FUND,

                        "Fundo padrão configurado",

                        activeDefaultFundConfigured,

                        "Existe um fundo padrão ativo.",

                        "Defina um fundo padrão ativo em Configurações > Financeiro."));

        requirements.add(
                requirement(
                        PlatformOrganizationOnboardingRequirementKey
                                .ACCOUNTABILITY_HISTORY_START_DATE,

                        "Início do histórico de sustento",

                        historyStartDateConfigured,

                        "A data inicial do histórico confiável está configurada.",

                        "Informe uma data válida em Configurações > Financeiro > Início do histórico confiável de sustento."));

        requirements.add(
                requirement(
                        PlatformOrganizationOnboardingRequirementKey
                                .ACTIVE_INCOME_CATEGORY,

                        "Categoria de receita",

                        hasIncomeCategory,

                        "Existe ao menos uma categoria ativa de receita.",

                        "Cadastre ao menos uma categoria de receita."));

        requirements.add(
                requirement(
                        PlatformOrganizationOnboardingRequirementKey
                                .ACTIVE_EXPENSE_CATEGORY,

                        "Categoria de despesa",

                        hasExpenseCategory,

                        "Existe ao menos uma categoria ativa de despesa.",

                        "Cadastre ao menos uma categoria de despesa."));

        int totalBlockingRequirements =
                (int) requirements
                        .stream()
                        .filter(
                                PlatformOrganizationOnboardingRequirementResponse
                                        ::blocking)
                        .count();

        int completedBlockingRequirements =
                (int) requirements
                        .stream()
                        .filter(
                                PlatformOrganizationOnboardingRequirementResponse
                                        ::blocking)
                        .filter(
                                PlatformOrganizationOnboardingRequirementResponse
                                        ::completed)
                        .count();

        boolean readyForLaunch =
                totalBlockingRequirements
                        == completedBlockingRequirements;

        return new PlatformOrganizationOnboardingReadinessResponse(
                readyForLaunch,
                completedBlockingRequirements,
                totalBlockingRequirements,
                List.copyOf(
                        requirements));
    }

    private PlatformOrganizationOnboardingRequirementResponse
            requirement(

                    PlatformOrganizationOnboardingRequirementKey key,

                    String title,

                    boolean completed,

                    String completedDetail,

                    String pendingDetail) {

        return new PlatformOrganizationOnboardingRequirementResponse(
                key,
                title,
                completed,
                true,

                completed
                        ? completedDetail
                        : pendingDetail);
    }

    private boolean hasText(
            String value) {

        return value != null
                && !value.isBlank();
    }
}