package ptithcm.tttnd35backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import ptithcm.tttnd35backend.entity.Address;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface IAddressRepository extends JpaRepository<Address, UUID> {

    List<Address> findAllByProfileIdOrderByIsDefaultDescCreatedAtDesc(UUID profileId);

    // Check: address phải vừa đúng id vừa thuộc đúng profile đang đăng nhập.
    Optional<Address> findByIdAndProfileId(UUID id, UUID profileId);

    long countByProfileId(UUID profileId);

    @Modifying
    @Query("UPDATE Address a SET a.isDefault = false WHERE a.profile.id = :profileId AND a.isDefault = true")
    void clearDefaultForProfile(@Param("profileId") UUID profileId);
}
