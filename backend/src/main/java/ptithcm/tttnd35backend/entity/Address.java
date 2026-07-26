package ptithcm.tttnd35backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "addresses")
public class Address extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "profile_id", nullable = false)
    private Profile profile;

    @Column(name = "recipient_name", nullable = false, length = 150)
    private String recipientName;

    @Column(nullable = false, length = 20)
    private String phone;

    @Column(nullable = false, length = 100)
    private String province;

    @Column(nullable = false, length = 100)
    private String district;

    @Column(nullable = false, length = 100)
    private String ward;

    @Column(name = "detail_address", nullable = false, length = 255)
    private String detailAddress;

    // Mỗi Profile chỉ có tối đa 1 địa chỉ is_default = true
    // (bỏ cờ default của địa chỉ cũ khi set địa chỉ mặc định mới).
    @Builder.Default
    @Column(name = "is_default", nullable = false)
    private boolean isDefault = false;

    @Column(length = 255)
    private String note;
}
