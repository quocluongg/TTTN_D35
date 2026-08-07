package ptithcm.tttnd35backend;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
public class ApiIntegrationTest {

    @Autowired
    private WebApplicationContext context;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(context)
                .apply(SecurityMockMvcConfigurers.springSecurity())
                .build();
    }

    // --- PUBLIC APIS ---

    @Test
    @DisplayName("GET /categories - Public category tree")
    void testGetCategories() throws Exception {
        mockMvc.perform(get("/categories"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @DisplayName("GET /products - Public product list")
    void testGetProducts() throws Exception {
        mockMvc.perform(get("/products"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @DisplayName("GET /news - Public news list")
    void testGetNews() throws Exception {
        mockMvc.perform(get("/news"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @DisplayName("GET /news/recent - Recent news")
    void testGetRecentNews() throws Exception {
        mockMvc.perform(get("/news/recent"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @DisplayName("GET /home/banners - Home banners")
    void testGetHomeBanners() throws Exception {
        mockMvc.perform(get("/home/banners"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @DisplayName("GET /home/brands - Brand logos")
    void testGetHomeBrands() throws Exception {
        mockMvc.perform(get("/home/brands"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @DisplayName("GET /home/featured-categories - Featured categories")
    void testGetHomeFeaturedCategories() throws Exception {
        mockMvc.perform(get("/home/featured-categories"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @DisplayName("GET /system-configs/public - Public system configs")
    void testGetPublicSystemConfigs() throws Exception {
        mockMvc.perform(get("/system-configs/public"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    // --- ADMIN APIS (WITH MOCK USER) ---

    @Test
    @WithMockUser(authorities = "NEWS_MANAGE")
    @DisplayName("GET /admin/news - Admin news list")
    void testAdminGetNews() throws Exception {
        mockMvc.perform(get("/admin/news"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @WithMockUser(authorities = "HOMEPAGE_CMS_MANAGE")
    @DisplayName("GET /admin/home/banners - Admin banners")
    void testAdminGetBanners() throws Exception {
        mockMvc.perform(get("/admin/home/banners"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @WithMockUser(authorities = "USER_VIEW")
    @DisplayName("GET /admin/users - Admin user list")
    void testAdminGetUsers() throws Exception {
        mockMvc.perform(get("/admin/users"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @WithMockUser(authorities = "ROLE_MANAGE")
    @DisplayName("GET /admin/roles - Admin role list")
    void testAdminGetRoles() throws Exception {
        mockMvc.perform(get("/admin/roles"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @WithMockUser(authorities = "SYSTEM_CONFIG_MANAGE")
    @DisplayName("GET /admin/system-configs - Admin system configs")
    void testAdminGetSystemConfigs() throws Exception {
        mockMvc.perform(get("/admin/system-configs"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @WithMockUser(authorities = "AUDIT_LOG_VIEW")
    @DisplayName("GET /admin/audit-logs - Admin audit logs")
    void testAdminGetAuditLogs() throws Exception {
        mockMvc.perform(get("/admin/audit-logs"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @WithMockUser(authorities = "REPORT_VIEW")
    @DisplayName("GET /admin/reports/revenue - Revenue report")
    void testAdminGetRevenueReport() throws Exception {
        mockMvc.perform(get("/admin/reports/revenue"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @WithMockUser(authorities = "REPORT_VIEW")
    @DisplayName("GET /admin/reports/top-products - Top products report")
    void testAdminGetTopProductsReport() throws Exception {
        mockMvc.perform(get("/admin/reports/top-products"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @WithMockUser(authorities = "REPORT_VIEW")
    @DisplayName("GET /admin/reports/top-customers - Top customers report")
    void testAdminGetTopCustomersReport() throws Exception {
        mockMvc.perform(get("/admin/reports/top-customers"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @WithMockUser(authorities = "REPORT_VIEW")
    @DisplayName("GET /admin/reports/order-status-summary - Order status summary report")
    void testAdminGetOrderStatusSummaryReport() throws Exception {
        mockMvc.perform(get("/admin/reports/order-status-summary"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @WithMockUser(authorities = "REPORT_VIEW")
    @DisplayName("GET /admin/reports/inventory-low-stock - Inventory low stock report")
    void testAdminGetLowStockReport() throws Exception {
        mockMvc.perform(get("/admin/reports/inventory-low-stock"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @WithMockUser(authorities = "INVENTORY_MANAGE")
    @DisplayName("GET /admin/inventory - Inventory adjustments")
    void testAdminGetInventoryAdjustments() throws Exception {
        mockMvc.perform(get("/admin/inventory"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }
}
