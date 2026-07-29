package ptithcm.tttnd35backend.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ptithcm.tttnd35backend.dto.request.VoucherRequest;
import ptithcm.tttnd35backend.dto.request.VoucherValidateRequest;
import ptithcm.tttnd35backend.dto.response.VoucherResponse;
import ptithcm.tttnd35backend.dto.response.VoucherValidateResponse;
import ptithcm.tttnd35backend.entity.Voucher;
import ptithcm.tttnd35backend.exception.BadRequestException;
import ptithcm.tttnd35backend.exception.DuplicateResourceException;
import ptithcm.tttnd35backend.exception.ResourceNotFoundException;
import ptithcm.tttnd35backend.mapper.VoucherMapper;
import ptithcm.tttnd35backend.repository.IVoucherRepository;
import ptithcm.tttnd35backend.repository.IVoucherUsageRepository;
import ptithcm.tttnd35backend.service.IVoucherService;
import ptithcm.tttnd35backend.service.VoucherResolution;
import ptithcm.tttnd35backend.util.enums.DiscountType;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class VoucherServiceImpl implements IVoucherService {

    private final IVoucherRepository voucherRepository;
    private final IVoucherUsageRepository voucherUsageRepository;
    private final VoucherMapper voucherMapper;

    @Override
    @Transactional(readOnly = true)
    public List<VoucherResponse> getAll() {
        return voucherRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::toResponseWithRunningFlag)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public VoucherResponse getById(UUID id) {
        return toResponseWithRunningFlag(loadVoucher(id));
    }

    @Override
    @Transactional
    public VoucherResponse create(VoucherRequest request) {
        validate(request, null);

        Voucher voucher = voucherMapper.toEntity(request);
        voucher.setCode(voucher.getCode().toUpperCase());
        return toResponseWithRunningFlag(voucherRepository.save(voucher));
    }

    @Override
    @Transactional
    public VoucherResponse update(UUID id, VoucherRequest request) {
        validate(request, id);

        Voucher voucher = loadVoucher(id);
        voucherMapper.updateEntityFromRequest(request, voucher);
        voucher.setCode(voucher.getCode().toUpperCase());
        return toResponseWithRunningFlag(voucherRepository.save(voucher));
    }

    @Override
    @Transactional
    public VoucherResponse setActive(UUID id, boolean active) {
        Voucher voucher = loadVoucher(id);
        voucher.setActive(active);
        return toResponseWithRunningFlag(voucherRepository.save(voucher));
    }

    @Override
    @Transactional(readOnly = true)
    public VoucherValidateResponse validate(VoucherValidateRequest request) {
        Voucher voucher = voucherRepository.findByCodeIgnoreCase(request.getCode().trim())
                .orElseThrow(() -> new BadRequestException("Mã voucher không tồn tại"));

        checkUsable(voucher, request.getEligibleAmount());

        BigDecimal discountAmount = computeDiscountAmount(voucher, request.getEligibleAmount());
        return VoucherValidateResponse.builder()
                .code(voucher.getCode())
                .discountAmount(discountAmount)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public VoucherResolution resolveForOrder(String code, UUID profileId, BigDecimal eligibleAmount) {
        Voucher voucher = voucherRepository.findByCodeIgnoreCase(code.trim())
                .orElseThrow(() -> new BadRequestException("Mã voucher không tồn tại"));

        checkUsable(voucher, eligibleAmount);

        if (profileId != null) {
            long usedByProfile = voucherUsageRepository.countByVoucherIdAndProfileId(voucher.getId(), profileId);
            if (usedByProfile >= voucher.getMaxUsagePerUser()) {
                throw new BadRequestException("Bạn đã dùng hết lượt cho voucher này");
            }
        }

        return new VoucherResolution(voucher, computeDiscountAmount(voucher, eligibleAmount));
    }

    // ===== Helper =====

    // Check chung cho cả validate() (preview) lẫn resolveForOrder() (lúc thật sự đặt hàng) - trừ
    // max_usage_per_user (chỉ resolveForOrder mới có profileId để check).
    private void checkUsable(Voucher voucher, BigDecimal eligibleAmount) {
        LocalDateTime now = LocalDateTime.now();
        if (!voucher.isActive()) {
            throw new BadRequestException("Voucher hiện không khả dụng");
        }
        if (now.isBefore(voucher.getStartTime()) || now.isAfter(voucher.getEndTime())) {
            throw new BadRequestException("Voucher không còn trong thời gian áp dụng");
        }
        if (voucher.getMaxUsage() != null && voucher.getUsedCount() >= voucher.getMaxUsage()) {
            throw new BadRequestException("Voucher đã hết lượt sử dụng");
        }
        if (eligibleAmount.compareTo(voucher.getMinOrderValue()) < 0) {
            throw new BadRequestException(
                    "Đơn hàng cần tối thiểu " + voucher.getMinOrderValue() + " để áp dụng voucher này");
        }
    }

    private Voucher loadVoucher(UUID id) {
        return voucherRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy voucher"));
    }

    private void validate(VoucherRequest request, UUID excludeId) {
        if (!request.getEndTime().isAfter(request.getStartTime())) {
            throw new BadRequestException("Thời gian kết thúc phải sau thời gian bắt đầu");
        }
        if (request.getDiscountType() == DiscountType.PERCENT
                && request.getDiscountValue().compareTo(BigDecimal.valueOf(100)) > 0) {
            throw new BadRequestException("Giảm theo % không được vượt quá 100");
        }

        String code = request.getCode().trim().toUpperCase();
        boolean exists = excludeId == null
                ? voucherRepository.existsByCodeIgnoreCase(code)
                : voucherRepository.existsByCodeIgnoreCaseAndIdNot(code, excludeId);
        if (exists) {
            throw new DuplicateResourceException("Mã voucher '" + code + "' đã tồn tại");
        }
    }

    private BigDecimal computeDiscountAmount(Voucher voucher, BigDecimal eligibleAmount) {
        BigDecimal discount = voucher.getDiscountType() == DiscountType.PERCENT
                ? eligibleAmount.multiply(voucher.getDiscountValue())
                        .divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP)
                : voucher.getDiscountValue();

        if (voucher.getDiscountType() == DiscountType.PERCENT && voucher.getMaxDiscountAmount() != null) {
            discount = discount.min(voucher.getMaxDiscountAmount());
        }
        // Không bao giờ giảm nhiều hơn chính giá trị đơn hàng đang xét.
        return discount.min(eligibleAmount).setScale(2, RoundingMode.HALF_UP);
    }

    private VoucherResponse toResponseWithRunningFlag(Voucher voucher) {
        VoucherResponse response = voucherMapper.toResponse(voucher);
        LocalDateTime now = LocalDateTime.now();
        response.setCurrentlyRunning(voucher.isActive()
                && !now.isBefore(voucher.getStartTime()) && !now.isAfter(voucher.getEndTime()));
        return response;
    }
}
