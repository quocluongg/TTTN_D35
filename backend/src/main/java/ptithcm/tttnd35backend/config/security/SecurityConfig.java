package ptithcm.tttnd35backend.config.security;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.util.StringUtils;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import ptithcm.tttnd35backend.config.jwt.CustomAccessDeniedHandler;
import ptithcm.tttnd35backend.config.jwt.JwtAuthenticationEntryPoint;
import ptithcm.tttnd35backend.config.jwt.JwtAuthenticationFilter;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private static final String[] PUBLIC_ENDPOINTS = {
            "/auth/**",
            "/api/v1/auth/**",
            "/swagger-ui.html",
            "/swagger-ui/**",
            "/v3/api-docs/**",
            "/categories",
            "/categories/**",
            "/api/v1/categories",
            "/api/v1/categories/**",
            "/products",
            "/products/**",
            "/api/v1/products",
            "/api/v1/products/**",
            "/campaigns",
            "/campaigns/**",
            "/api/v1/campaigns/**",
            "/orders/guest",
            "/api/v1/orders/guest",
            "/payments/*/init",
            "/payments/vnpay/return",
            "/payments/vnpay/ipn",
            "/payments/stripe/webhook",
            "/api/v1/payments/**",
            "/news",
            "/news/**",
            "/api/v1/news",
            "/api/v1/news/**",
            "/home/**",
            "/api/v1/home/**",
            "/warranty/lookup",
            "/api/v1/warranty/lookup",
            "/system-configs/public",
            "/api/v1/system-configs/public"
    };

    @Value("${service.domain.frontend}")
    private String frontendDomains;

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final JwtAuthenticationEntryPoint jwtAuthenticationEntryPoint;
    private final CustomAccessDeniedHandler customAccessDeniedHandler;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(
            UserDetailsServiceCustom userDetailsService,
            PasswordEncoder passwordEncoder) {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder);
        return new org.springframework.security.authentication.ProviderManager(provider);
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();

        List<String> origins = StringUtils.hasText(frontendDomains)
                ? Arrays.asList(frontendDomains.split(","))
                : List.of("*");

        config.setAllowedOriginPatterns(origins);
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint(jwtAuthenticationEntryPoint)
                        .accessDeniedHandler(customAccessDeniedHandler))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(PUBLIC_ENDPOINTS).permitAll()
                        .requestMatchers(org.springframework.http.HttpMethod.GET,
                                "/products", "/products/**", "/api/v1/products", "/api/v1/products/**",
                                "/categories", "/categories/**", "/api/v1/categories", "/api/v1/categories/**",
                                "/news", "/news/**", "/api/v1/news", "/api/v1/news/**",
                                "/home", "/home/**", "/api/v1/home", "/api/v1/home/**",
                                "/warranty/lookup", "/api/v1/warranty/lookup",
                                "/system-configs/public", "/api/v1/system-configs/public"
                        ).permitAll()
                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
