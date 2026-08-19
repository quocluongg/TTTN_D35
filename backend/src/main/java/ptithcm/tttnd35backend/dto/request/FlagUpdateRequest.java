package ptithcm.tttnd35backend.dto.request;

import jakarta.validation.constraints.NotNull;
import ptithcm.tttnd35backend.util.enums.MessageFlagStatus;

public record FlagUpdateRequest(
        @NotNull(message = "Trạng thái cờ không được trống") MessageFlagStatus flagStatus,
        String note
) {}