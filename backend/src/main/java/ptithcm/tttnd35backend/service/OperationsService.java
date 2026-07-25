package ptithcm.tttnd35backend.service;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.namedparam.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ptithcm.tttnd35backend.dto.request.*;
import ptithcm.tttnd35backend.entity.Profile;
import ptithcm.tttnd35backend.exception.BadRequestException;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

@Service @RequiredArgsConstructor
public class OperationsService {
  private static final Set<String> ORDER_STATUSES = Set.of("PENDING","CONFIRMED","PROCESSING","SHIPPING","DELIVERED","CANCELLED","RETURN_REQUESTED","RETURNED","REFUNDED");
  private final NamedParameterJdbcTemplate jdbc;
  private final AdminService admin;
  public List<Map<String,Object>> inventory() { return jdbc.queryForList("select pv.id variantId,pv.sku,p.name productName,pv.stock,pv.price from product_variant pv join product p on p.id=pv.product_id order by p.name,pv.id", new MapSqlParameterSource()); }
  @Transactional public void adjustInventory(long variantId, InventoryAdjustmentRequest r, Profile actor) {
    MapSqlParameterSource p = new MapSqlParameterSource("id",variantId);
    Integer stock = jdbc.queryForObject("select stock from product_variant where id=:id for update",p,Integer.class);
    if(stock==null) throw new BadRequestException("Không tìm thấy biến thể sản phẩm");
    int after=stock+r.quantityDelta(); if(after<0) throw new BadRequestException("Tồn kho không đủ để điều chỉnh");
    jdbc.update("update product_variant set stock=:stock where id=:id",new MapSqlParameterSource().addValue("stock",after).addValue("id",variantId));
    jdbc.update("insert into inventory_movements(variant_id,movement_type,quantity_delta,quantity_after,reason,actor_id) values(:id,:type,:delta,:after,:reason,:actor)",new MapSqlParameterSource().addValue("id",variantId).addValue("type",r.quantityDelta()>=0?"ADJUSTMENT_IN":"ADJUSTMENT_OUT").addValue("delta",r.quantityDelta()).addValue("after",after).addValue("reason",r.reason()).addValue("actor",actor.getId()));
    admin.audit(actor,"INVENTORY_UPDATE","PRODUCT_VARIANT",Long.toString(variantId),"Điều chỉnh tồn kho: "+r.quantityDelta());
  }
  public List<Map<String,Object>> orders(String status) { return jdbc.queryForList("select o.id,o.order_code orderCode,o.status,o.payment_status paymentStatus,o.total_amount totalAmount,o.created_at createdAt,p.full_name customerName from customer_orders o join profiles p on p.id=o.customer_id where (:status is null or o.status=:status) order by o.created_at desc limit 200",new MapSqlParameterSource("status",status)); }
  @Transactional public void updateOrder(UUID id, OrderStatusRequest r, Profile actor) {
    String target=r.status().trim().toUpperCase(); if(!ORDER_STATUSES.contains(target)) throw new BadRequestException("Trạng thái đơn hàng không hợp lệ");
    MapSqlParameterSource p=new MapSqlParameterSource("id",id); String old=jdbc.queryForObject("select status from customer_orders where id=:id for update",p,String.class); if(old==null) throw new BadRequestException("Không tìm thấy đơn hàng");
    if(Set.of("DELIVERED","CANCELLED","REFUNDED").contains(old)) throw new BadRequestException("Đơn hàng đã kết thúc, không thể chuyển trạng thái");
    jdbc.update("update customer_orders set status=:status,updated_at=now() where id=:id",new MapSqlParameterSource().addValue("status",target).addValue("id",id));
    jdbc.update("insert into order_status_history(order_id,from_status,to_status,note,actor_id) values(:id,:from,:to,:note,:actor)",new MapSqlParameterSource().addValue("id",id).addValue("from",old).addValue("to",target).addValue("note",r.note()).addValue("actor",actor.getId()));
    admin.audit(actor,"ORDER_UPDATE_STATUS","ORDER",id.toString(),old+" → "+target);
  }
  public List<Map<String,Object>> promotions(){return jdbc.queryForList("select * from promotions order by created_at desc",new MapSqlParameterSource());}
  @Transactional public UUID savePromotion(UUID id, PromotionRequest r, Profile actor) {
    if(!r.endsAt().isAfter(r.startsAt())) throw new BadRequestException("Thời gian kết thúc phải sau thời gian bắt đầu"); if("PERCENT".equals(r.discountType())&&r.discountValue().compareTo(BigDecimal.valueOf(100))>0) throw new BadRequestException("Phần trăm giảm tối đa là 100");
    MapSqlParameterSource p=params(r).addValue("actor",actor.getId()); UUID result=id==null?UUID.randomUUID():id; p.addValue("id",result);
    if(id==null) jdbc.update("insert into promotions(id,code,name,discount_type,discount_value,max_discount_amount,minimum_order_amount,usage_limit,starts_at,ends_at,active,created_by) values(:id,:code,:name,:type,:value,:max,:min,:limit,:start,:end,:active,:actor)",p);
    else jdbc.update("update promotions set code=:code,name=:name,discount_type=:type,discount_value=:value,max_discount_amount=:max,minimum_order_amount=:min,usage_limit=:limit,starts_at=:start,ends_at=:end,active=:active,updated_at=now() where id=:id",p);
    admin.audit(actor,id==null?"PROMOTION_CREATE":"PROMOTION_UPDATE","PROMOTION",result.toString(),"Lưu khuyến mãi "+r.code()); return result;
  }
  public List<Map<String,Object>> warranties(String status){return jdbc.queryForList("select w.id,w.warranty_code warrantyCode,w.status,w.expires_at expiresAt,p.full_name customerName from warranty_cards w join profiles p on p.id=w.customer_id where (:status is null or w.status=:status) order by w.created_at desc",new MapSqlParameterSource("status",status));}
  @Transactional public void updateWarranty(UUID id, WarrantyUpdateRequest r, Profile actor){jdbc.update("update warranty_cards set status=:status,updated_at=now() where id=:id",new MapSqlParameterSource().addValue("id",id).addValue("status",r.status().toUpperCase()));int n=jdbc.update("insert into warranty_histories(warranty_card_id,status,description,resolution,extra_cost,expected_return_at,actor_id) values(:id,:status,:description,:resolution,:cost,:returnAt,:actor)",new MapSqlParameterSource().addValue("id",id).addValue("status",r.status().toUpperCase()).addValue("description",r.description()).addValue("resolution",r.resolution()).addValue("cost",Optional.ofNullable(r.extraCost()).orElse(BigDecimal.ZERO)).addValue("returnAt",r.expectedReturnAt()).addValue("actor",actor.getId()));if(n==0)throw new BadRequestException("Không tìm thấy phiếu bảo hành");admin.audit(actor,"WARRANTY_UPDATE","WARRANTY",id.toString(),"Cập nhật bảo hành");}
  public List<Map<String,Object>> news(String status){return jdbc.queryForList("select id,title,slug,status,published_at publishedAt,created_at createdAt from news where (:status is null or status=:status) order by created_at desc",new MapSqlParameterSource("status",status));}
  @Transactional public UUID saveNews(UUID id,NewsRequest r,Profile actor){UUID result=id==null?UUID.randomUUID():id;LocalDateTime published="PUBLISHED".equals(r.status())?Optional.ofNullable(r.publishedAt()).orElse(LocalDateTime.now()):r.publishedAt();MapSqlParameterSource p=new MapSqlParameterSource().addValue("id",result).addValue("title",r.title()).addValue("slug",r.slug()).addValue("excerpt",r.excerpt()).addValue("content",r.content()).addValue("thumbnail",r.thumbnail()).addValue("status",r.status()).addValue("published",published).addValue("seoTitle",r.seoTitle()).addValue("seoDescription",r.seoDescription()).addValue("actor",actor.getId());if(id==null)jdbc.update("insert into news(id,title,slug,excerpt,content,thumbnail,status,published_at,seo_title,seo_description,author_id) values(:id,:title,:slug,:excerpt,:content,:thumbnail,:status,:published,:seoTitle,:seoDescription,:actor)",p);else jdbc.update("update news set title=:title,slug=:slug,excerpt=:excerpt,content=:content,thumbnail=:thumbnail,status=:status,published_at=:published,seo_title=:seoTitle,seo_description=:seoDescription,updated_at=now() where id=:id",p);admin.audit(actor,id==null?"NEWS_CREATE":"NEWS_UPDATE","NEWS",result.toString(),"Lưu bài viết "+r.slug());return result;}
  private MapSqlParameterSource params(PromotionRequest r){return new MapSqlParameterSource().addValue("code",r.code().trim().toUpperCase()).addValue("name",r.name()).addValue("type",r.discountType()).addValue("value",r.discountValue()).addValue("max",r.maxDiscountAmount()).addValue("min",Optional.ofNullable(r.minimumOrderAmount()).orElse(BigDecimal.ZERO)).addValue("limit",r.usageLimit()).addValue("start",r.startsAt()).addValue("end",r.endsAt()).addValue("active",!Boolean.FALSE.equals(r.active()));}
}
