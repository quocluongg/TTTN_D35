package ptithcm.tttnd35backend.repository.spec;

import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;
import ptithcm.tttnd35backend.entity.Profile;

public class UserSpecifications {

    public static Specification<Profile> withFilter(String roleName, Boolean isActive, String search) {
        return (root, query, cb) -> {
            var predicate = cb.conjunction();

            if (StringUtils.hasText(roleName)) {
                predicate = cb.and(predicate, cb.equal(cb.lower(root.get("role").get("name")), roleName.trim().toLowerCase()));
            }

            if (isActive != null) {
                predicate = cb.and(predicate, cb.equal(root.get("isActive"), isActive));
            }

            if (StringUtils.hasText(search)) {
                String keyword = "%" + search.trim().toLowerCase() + "%";
                predicate = cb.and(predicate, cb.or(
                        cb.like(cb.lower(root.get("email")), keyword),
                        cb.like(cb.lower(root.get("fullName")), keyword),
                        cb.like(cb.lower(root.get("phoneNumber")), keyword)
                ));
            }

            return predicate;
        };
    }
}
