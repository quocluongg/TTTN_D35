package ptithcm.tttnd35backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import ptithcm.tttnd35backend.entity.OtpVerification;
import ptithcm.tttnd35backend.util.enums.OtpPurpose;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface IOtpVerificationRepository extends JpaRepository<OtpVerification, UUID> {
    Optional<OtpVerification> findFirstByProfileIdAndPurposeAndVerifiedFalseOrderByCreatedAtDesc(
            UUID profileId, OtpPurpose purpose);
}
