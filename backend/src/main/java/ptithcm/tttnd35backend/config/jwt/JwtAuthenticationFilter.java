package ptithcm.tttnd35backend.config.jwt;

import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.UnsupportedJwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;
import ptithcm.tttnd35backend.config.security.UserDetailsServiceCustom;
import ptithcm.tttnd35backend.service.ITokenBlacklistService;

import java.io.IOException;

@Component
@RequiredArgsConstructor
@Slf4j
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final UserDetailsServiceCustom userDetailServiceCustom;
    private final JwtProvider jwtProvider;
    private final ITokenBlacklistService tokenBlacklistService;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        String token = getJwtFromRequest(request);

        if (token != null) {
            try {
                String jti = jwtProvider.extractJti(token);

                if (jti != null && tokenBlacklistService.isBlacklisted(jti)) {
                    log.warn("Token bị từ chối vì đã nằm trong blacklist (jti={})", jti);
                    request.setAttribute("exception", "TOKEN_REVOKED");
                    filterChain.doFilter(request, response);
                    return;
                }

                String username = jwtProvider.extractUserName(token);

                //  Log khi username null
                if (username == null) {
                    log.warn("Không thể extract username từ token");
                    filterChain.doFilter(request, response);
                    return;
                }

                if (SecurityContextHolder.getContext().getAuthentication() == null) {
                    try {
                        UserDetails userDetails = userDetailServiceCustom.loadUserByUsername(username);

                        if (jwtProvider.validateToken(token, userDetails)) {
                            UsernamePasswordAuthenticationToken authToken =
                                    new UsernamePasswordAuthenticationToken(
                                            userDetails, null, userDetails.getAuthorities());
                            authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                            SecurityContextHolder.getContext().setAuthentication(authToken);

                            // Log khi authentication thành công
                            log.debug("Token validated successfully for user: {}", username);
                        } else {
                            //  Log khi validateToken() trả false
                            log.warn("Token validation failed for user: {}", username);
                        }
                    } catch (Exception e) {
                        // Log khi loadUserByUsername() hoặc các exception khác trong try
                        log.error("Lỗi khi tải thông tin user [{}]: {}", username, e.getMessage(), e);
                    }
                }
            } catch (MalformedJwtException e) {
                log.warn("Invalid token: {}", e.getMessage());
                request.setAttribute("exception", "MALFORMED_TOKEN");
            } catch (UnsupportedJwtException e) {
                log.warn("Unsupported token: {}", e.getMessage());
                request.setAttribute("exception", "UNSUPPORTED_TOKEN");
            } catch (ExpiredJwtException e) {
                log.warn("Expired token: {}", e.getMessage());
                request.setAttribute("exception", "EXPIRED_TOKEN");
            } catch (IllegalArgumentException e) {
                log.warn("Jwt key string invalid: {}", e.getMessage());
                request.setAttribute("exception", "ILLEGAL_ARGUMENT_TOKEN");
            } catch (Exception e) {
                log.error("Lỗi không xác định khi xác thực Token", e);
                request.setAttribute("exception", "UNKNOWN_ERROR");
            }
        }

        filterChain.doFilter(request, response);
    }

    private String getJwtFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}
