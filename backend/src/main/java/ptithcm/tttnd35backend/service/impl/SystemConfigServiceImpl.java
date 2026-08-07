package ptithcm.tttnd35backend.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ptithcm.tttnd35backend.dto.request.SystemConfigRequest;
import ptithcm.tttnd35backend.dto.response.SystemConfigResponse;
import ptithcm.tttnd35backend.entity.Profile;
import ptithcm.tttnd35backend.entity.SystemConfig;
import ptithcm.tttnd35backend.exception.ResourceNotFoundException;
import ptithcm.tttnd35backend.mapper.ISystemConfigMapper;
import ptithcm.tttnd35backend.repository.IProfileRepository;
import ptithcm.tttnd35backend.repository.ISystemConfigRepository;
import ptithcm.tttnd35backend.service.ISystemConfigService;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class SystemConfigServiceImpl implements ISystemConfigService {

    private final ISystemConfigRepository configRepository;
    private final IProfileRepository profileRepository;
    private final ISystemConfigMapper configMapper;

    @Override
    @Transactional(readOnly = true)
    public List<SystemConfigResponse> getPublicConfigs() {
        return configMapper.toResponseList(configRepository.findByIsPublicTrue());
    }

    @Override
    @Transactional(readOnly = true)
    public List<SystemConfigResponse> getAllConfigs() {
        return configMapper.toResponseList(configRepository.findAll());
    }

    @Override
    @Transactional(readOnly = true)
    public SystemConfigResponse getConfigByKey(String key) {
        SystemConfig config = configRepository.findById(key)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy cấu hình với key: " + key));
        return configMapper.toResponse(config);
    }

    @Override
    @CacheEvict(value = "sysconfig", key = "#key")
    public SystemConfigResponse updateConfig(String key, SystemConfigRequest request, UUID currentUserId) {
        SystemConfig config = configRepository.findById(key)
                .orElseGet(() -> SystemConfig.builder().key(key).build());

        config.setValue(request.value());
        if (request.description() != null) config.setDescription(request.description());
        if (request.isPublic() != null) config.setPublic(request.isPublic());

        if (currentUserId != null) {
            Profile updater = profileRepository.findById(currentUserId).orElse(null);
            config.setUpdatedBy(updater);
        }
        config.setUpdatedAt(LocalDateTime.now());

        SystemConfig saved = configRepository.save(config);
        log.info("Updated system config key={}, isPublic={}", key, saved.isPublic());
        return configMapper.toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = "sysconfig", key = "#key", unless = "#result == null")
    public BigDecimal getAsBigDecimal(String key, BigDecimal defaultValue) {
        return configRepository.findById(key)
                .map(SystemConfig::getValue)
                .map(this::parseBigDecimal)
                .orElse(defaultValue);
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = "sysconfig", key = "#key", unless = "#result == null")
    public Boolean getAsBoolean(String key, Boolean defaultValue) {
        return configRepository.findById(key)
                .map(SystemConfig::getValue)
                .map(JsonNode::asBoolean)
                .orElse(defaultValue);
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = "sysconfig", key = "#key", unless = "#result == null")
    public String getAsString(String key, String defaultValue) {
        return configRepository.findById(key)
                .map(SystemConfig::getValue)
                .map(JsonNode::asText)
                .orElse(defaultValue);
    }

    private BigDecimal parseBigDecimal(JsonNode node) {
        if (node == null) return null;
        if (node.isNumber()) return node.decimalValue();
        if (node.isTextual()) {
            try {
                return new BigDecimal(node.asText());
            } catch (Exception e) {
                return null;
            }
        }
        return null;
    }
}
