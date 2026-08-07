package ptithcm.tttnd35backend.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ptithcm.tttnd35backend.dto.request.AddressRequest;
import ptithcm.tttnd35backend.dto.response.AddressResponse;
import ptithcm.tttnd35backend.entity.Address;
import ptithcm.tttnd35backend.entity.Profile;
import ptithcm.tttnd35backend.exception.ResourceNotFoundException;
import ptithcm.tttnd35backend.mapper.AddressMapper;
import ptithcm.tttnd35backend.repository.IAddressRepository;
import ptithcm.tttnd35backend.service.IAddressService;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AddressServiceImpl implements IAddressService {

    private final IAddressRepository addressRepository;
    private final AddressMapper addressMapper;

    @Override
    public List<AddressResponse> getMyAddresses(UUID profileId) {
        return addressMapper.toResponseList(
                addressRepository.findAllByProfileIdOrderByIsDefaultDescCreatedAtDesc(profileId));
    }

    @Override
    @Transactional
    public AddressResponse create(UUID profileId, AddressRequest request) {
        boolean isFirstAddress = addressRepository.countByProfileId(profileId) == 0;
        boolean shouldBeDefault = isFirstAddress || request.isDefault();

        if (shouldBeDefault) {
            addressRepository.clearDefaultForProfile(profileId);
        }

        Address address = addressMapper.toEntity(request);
        address.setDefault(shouldBeDefault);
        address.setProfile(Profile.builder().id(profileId).build()); // proxy nhẹ, không cần load cả Profile

        return addressMapper.toResponse(addressRepository.save(address));
    }

    @Override
    @Transactional
    public AddressResponse update(UUID profileId, UUID addressId, AddressRequest request) {
        Address address = getOwnedAddress(profileId, addressId);

        if (request.isDefault() && !address.isDefault()) {
            addressRepository.clearDefaultForProfile(profileId);
        }

        addressMapper.updateEntityFromRequest(request, address);
        return addressMapper.toResponse(addressRepository.save(address));
    }

    @Override
    @Transactional
    public void delete(UUID profileId, UUID addressId) {
        Address address = getOwnedAddress(profileId, addressId);
        boolean wasDefault = address.isDefault();

        addressRepository.delete(address);

        if (wasDefault) {
            // Còn địa chỉ khác thì tự thăng địa chỉ tạo gần nhất lên làm mặc định,
            // tránh khách còn địa chỉ nhưng không có cái nào default.
            addressRepository.findAllByProfileIdOrderByIsDefaultDescCreatedAtDesc(profileId).stream()
                    .findFirst()
                    .ifPresent(next -> {
                        next.setDefault(true);
                        addressRepository.save(next);
                    });
        }
    }

    @Override
    @Transactional
    public AddressResponse setDefault(UUID profileId, UUID addressId) {
        Address address = getOwnedAddress(profileId, addressId);

        if (!address.isDefault()) {
            addressRepository.clearDefaultForProfile(profileId);
            address.setDefault(true);
            address = addressRepository.save(address);
        }

        return addressMapper.toResponse(address);
    }

    private Address getOwnedAddress(UUID profileId, UUID addressId) {
        return addressRepository.findByIdAndProfileId(addressId, profileId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy địa chỉ"));
    }
}
