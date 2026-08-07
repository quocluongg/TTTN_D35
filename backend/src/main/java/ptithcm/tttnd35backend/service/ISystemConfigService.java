package ptithcm.tttnd35backend.service;

import ptithcm.tttnd35backend.dto.request.SystemConfigRequest;
import ptithcm.tttnd35backend.dto.response.SystemConfigResponse;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public interface ISystemConfigService {

    List<SystemConfigResponse> getPublicConfigs();

    List<SystemConfigResponse> getAllConfigs();

    SystemConfigResponse getConfigByKey(String key);

    SystemConfigResponse updateConfig(String key, SystemConfigRequest request, UUID currentUserId);

    BigDecimal getAsBigDecimal(String key, BigDecimal defaultValue);

    Boolean getAsBoolean(String key, Boolean defaultValue);

    String getAsString(String key, String defaultValue);
}
