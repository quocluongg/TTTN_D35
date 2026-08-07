package ptithcm.tttnd35backend.repository.spec;

import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;
import ptithcm.tttnd35backend.entity.WarrantyCard;
import ptithcm.tttnd35backend.util.enums.WarrantyStatus;

public class WarrantySpecifications {

    public static Specification<WarrantyCard> withFilter(WarrantyStatus status, String search) {
        return (root, query, cb) -> {
            var predicate = cb.conjunction();

            if (status != null) {
                predicate = cb.and(predicate, cb.equal(root.get("status"), status));
            }

            if (StringUtils.hasText(search)) {
                String keyword = "%" + search.trim().toLowerCase() + "%";
                predicate = cb.and(predicate, cb.or(
                        cb.like(cb.lower(root.get("customerPhone")), keyword),
                        cb.like(cb.lower(root.get("serialNumber")), keyword),
                        cb.like(cb.lower(root.get("productName")), keyword),
                        cb.like(cb.lower(root.get("customerName")), keyword)
                ));
            }

            return predicate;
        };
    }
}
