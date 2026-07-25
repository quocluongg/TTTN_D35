package ptithcm.tttnd35backend.service;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import java.time.*;
import java.util.*;

@Service
@RequiredArgsConstructor
public class ReportingService {
    private final NamedParameterJdbcTemplate jdbc;

    public Map<String, Object> dashboard(LocalDate from, LocalDate to) {
        MapSqlParameterSource p = period(from, to);
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("period", Map.of("from", p.getValue("from"), "to", p.getValue("to")));
        result.put("revenue", one("""
                select coalesce(sum(total_amount),0) value from customer_orders
                where status='DELIVERED' and created_at >= :from and created_at < :to""", p));
        result.put("orders", one("""
                select count(*) value from customer_orders
                where created_at >= :from and created_at < :to""", p));
        result.put("newCustomers", one("""
                select count(*) value from profiles
                where created_at >= :from and created_at < :to""", p));
        result.put("lowStock", one("select count(*) value from product_variant where stock <= 5", p));
        result.put("ordersByStatus", jdbc.queryForList("""
                select status, count(*) count from customer_orders
                where created_at >= :from and created_at < :to group by status order by count desc""", p));
        result.put("topProducts", jdbc.queryForList("""
                select oi.product_name productName, sum(oi.quantity) quantity,
                sum(oi.line_total) revenue from order_items oi join customer_orders o on o.id=oi.order_id
                where o.status='DELIVERED' and o.created_at >= :from and o.created_at < :to
                group by oi.product_name order by quantity desc, revenue desc limit 5""", p));
        return result;
    }

    public Map<String, Object> users(LocalDate from, LocalDate to) {
        MapSqlParameterSource p = period(from, to);
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("summary", jdbc.queryForMap("""
                select count(*) total, count(*) filter (where is_active) active,
                count(*) filter (where not is_active) locked, count(*) filter (where not email_verified) unverified
                from profiles""", p));
        result.put("newUsers", jdbc.queryForList("""
                select date(created_at) date, count(*) count from profiles
                where created_at >= :from and created_at < :to group by date(created_at) order by date""", p));
        result.put("roles", jdbc.queryForList("""
                select r.name role, count(p.id) count from roles r left join profiles p on p.role_id=r.id
                group by r.name order by count desc""", p));
        result.put("topCustomers", jdbc.queryForList("""
                select p.id, p.full_name fullName, p.email, count(o.id) completedOrders,
                coalesce(sum(o.total_amount),0) revenue, coalesce(avg(o.total_amount),0) averageOrderValue, max(o.created_at) lastPurchaseAt
                from profiles p join customer_orders o on o.customer_id=p.id and o.status='DELIVERED'
                where o.created_at >= :from and o.created_at < :to group by p.id, p.full_name, p.email order by revenue desc limit 20""", p));
        return result;
    }

    public Map<String, Object> business(LocalDate from, LocalDate to) {
        MapSqlParameterSource p = period(from, to);
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("summary", jdbc.queryForMap("""
                select coalesce(sum(total_amount) filter (where status='DELIVERED'),0) netRevenue,
                coalesce(sum(subtotal) filter (where status='DELIVERED'),0) grossSales,
                coalesce(sum(discount_amount) filter (where status='DELIVERED'),0) discounts,
                coalesce(avg(total_amount) filter (where status='DELIVERED'),0) averageOrderValue,
                count(*) filter (where status='CANCELLED') cancelledOrders, count(*) totalOrders
                from customer_orders where created_at >= :from and created_at < :to""", p));
        result.put("revenueSeries", jdbc.queryForList("""
                select date(created_at) date, sum(total_amount) revenue, count(*) orders
                from customer_orders where status='DELIVERED' and created_at >= :from and created_at < :to
                group by date(created_at) order by date""", p));
        result.put("topProducts", jdbc.queryForList("""
                select oi.product_name productName, oi.sku, sum(oi.quantity) quantity,
                sum(oi.line_total) revenue from order_items oi join customer_orders o on o.id=oi.order_id
                where o.status='DELIVERED' and o.created_at >= :from and o.created_at < :to
                group by oi.product_name, oi.sku order by revenue desc limit 20""", p));
        result.put("inventory", jdbc.queryForList("""
                select pv.id variantId, pv.sku, p.name productName, pv.stock,
                pv.price * pv.stock inventoryValue from product_variant pv join product p on p.id=pv.product_id
                order by pv.stock asc limit 100""", p));
        result.put("promotions", jdbc.queryForList("""
                select coalesce(promotion_code,'NONE') code, count(*) orders,
                coalesce(sum(discount_amount),0) discount from customer_orders
                where created_at >= :from and created_at < :to group by promotion_code order by discount desc""", p));
        return result;
    }

    public String exportUsersCsv(LocalDate from, LocalDate to) {
        Map<String, Object> data = users(from, to);
        StringBuilder csv = new StringBuilder("Full Name,Email,Completed Orders,Revenue (VND),AOV (VND),Last Purchase\n");
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> topCustomers = (List<Map<String, Object>>) data.get("topCustomers");
        if (topCustomers != null) {
            for (Map<String, Object> c : topCustomers) {
                csv.append(String.format("\"%s\",\"%s\",%s,%s,%s,\"%s\"\n",
                        c.getOrDefault("fullName", ""),
                        c.getOrDefault("email", ""),
                        c.getOrDefault("completedOrders", 0),
                        c.getOrDefault("revenue", 0),
                        c.getOrDefault("averageOrderValue", 0),
                        c.getOrDefault("lastPurchaseAt", "")));
            }
        }
        return csv.toString();
    }

    public String exportBusinessCsv(LocalDate from, LocalDate to) {
        Map<String, Object> data = business(from, to);
        StringBuilder csv = new StringBuilder("Product Name,SKU,Quantity Sold,Revenue (VND)\n");
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> topProducts = (List<Map<String, Object>>) data.get("topProducts");
        if (topProducts != null) {
            for (Map<String, Object> p : topProducts) {
                csv.append(String.format("\"%s\",\"%s\",%s,%s\n",
                        p.getOrDefault("productName", ""),
                        p.getOrDefault("sku", ""),
                        p.getOrDefault("quantity", 0),
                        p.getOrDefault("revenue", 0)));
            }
        }
        return csv.toString();
    }

    private MapSqlParameterSource period(LocalDate from, LocalDate to) {
        LocalDate end = to == null ? LocalDate.now(ZoneId.of("Asia/Ho_Chi_Minh")) : to;
        LocalDate start = from == null ? end.minusDays(29) : from;
        if (start.isAfter(end)) throw new IllegalArgumentException("from không thể sau to");
        return new MapSqlParameterSource().addValue("from", start.atStartOfDay()).addValue("to", end.plusDays(1).atStartOfDay());
    }
    private Object one(String sql, MapSqlParameterSource p) { return jdbc.queryForObject(sql, p, Object.class); }
}
