package com.fluxfund.api.domain.bankstatementdocument.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.fluxfund.api.domain.bankstatementdocument.BankStatementDocument;

public interface BankStatementDocumentRepository
    extends JpaRepository<BankStatementDocument, UUID> {

  Optional<BankStatementDocument> findByIdAndOrganizationId(
      UUID id,
      UUID organizationId);

  @Query("""
      select document
      from BankStatementDocument document
      join fetch document.account account
      where document.organization.id = :organizationId
        and account.id = :accountId
        and document.periodStartDate <= :periodEndDate
        and document.periodEndDate >= :periodStartDate
      order by document.uploadedAt desc
      """)
  List<BankStatementDocument> findAllForAccountAndOverlappingPeriod(
      @Param("organizationId") UUID organizationId,
      @Param("accountId") UUID accountId,
      @Param("periodStartDate") LocalDate periodStartDate,
      @Param("periodEndDate") LocalDate periodEndDate);

  @Query("""
      select document
      from BankStatementDocument document
      join fetch document.account account
      where document.organization.id = :organizationId
        and account.id in :accountIds
        and document.periodStartDate <= :periodEndDate
        and document.periodEndDate >= :periodStartDate
      order by account.name asc, document.uploadedAt desc
      """)
  List<BankStatementDocument> findAllForAccountsAndOverlappingPeriod(
      @Param("organizationId") UUID organizationId,
      @Param("accountIds") List<UUID> accountIds,
      @Param("periodStartDate") LocalDate periodStartDate,
      @Param("periodEndDate") LocalDate periodEndDate);

  @Query(value = """
      select document
      from BankStatementDocument document
      join fetch document.account account
      where document.organization.id = :organizationId
        and (:accountId is null or account.id = :accountId)
        and (
              :periodStartDate is null
              or document.periodEndDate >= :periodStartDate
            )
        and (
              :periodEndDate is null
              or document.periodStartDate <= :periodEndDate
            )
        and (
              :filename is null
              or lower(document.originalFilename)
                  like lower(concat('%', :filename, '%'))
            )
      """, countQuery = """
      select count(document)
      from BankStatementDocument document
      join document.account account
      where document.organization.id = :organizationId
        and (:accountId is null or account.id = :accountId)
        and (
              :periodStartDate is null
              or document.periodEndDate >= :periodStartDate
            )
        and (
              :periodEndDate is null
              or document.periodStartDate <= :periodEndDate
            )
        and (
              :filename is null
              or lower(document.originalFilename)
                  like lower(concat('%', :filename, '%'))
            )
      """)
  Page<BankStatementDocument> findAllForLibrary(
      @Param("organizationId") UUID organizationId,
      @Param("accountId") UUID accountId,
      @Param("periodStartDate") LocalDate periodStartDate,
      @Param("periodEndDate") LocalDate periodEndDate,
      @Param("filename") String filename,
      Pageable pageable);
}