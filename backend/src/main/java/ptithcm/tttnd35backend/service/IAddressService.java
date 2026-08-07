package ptithcm.tttnd35backend.service;

import ptithcm.tttnd35backend.dto.request.AddressRequest;
import ptithcm.tttnd35backend.dto.response.AddressResponse;

import java.util.List;
import java.util.UUID;

/** Quản lý sổ địa chỉ giao hàng của khách hàng đang đăng nhập. */
public interface IAddressService {

    List<AddressResponse> getMyAddresses(UUID profileId);

    /** Địa chỉ đầu tiên của 1 profile luôn tự động là mặc định, bất kể client gửi isDefault gì. */
    AddressResponse create(UUID profileId, AddressRequest request);

    AddressResponse update(UUID profileId, UUID addressId, AddressRequest request);

    void delete(UUID profileId, UUID addressId);

    AddressResponse setDefault(UUID profileId, UUID addressId);
}
