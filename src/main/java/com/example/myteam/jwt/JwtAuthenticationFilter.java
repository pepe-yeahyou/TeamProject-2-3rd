// src/main/java/com/example/myteam/jwt/JwtAuthenticationFilter.java
package com.example.myteam.jwt;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.converter.json.GsonBuilderUtils;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.GrantedAuthority;
import com.example.myteam.security.CustomUserDetails;

import java.io.IOException;
import java.util.Collections;

// @Component 대신 SecurityConfig에서 직접 생성하여 주입할 것이므로 @RequiredArgsConstructor만 사용합니다.
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider jwtTokenProvider;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        String token = resolveToken(request);

        if (token != null && jwtTokenProvider.validateToken(token)) {
            System.out.println("JWT 존재함");

            String username = jwtTokenProvider.getUsernameFromToken(token);
            Long userId = jwtTokenProvider.getUserIdFromToken(token);

            var authorities = Collections.singletonList(
                    new SimpleGrantedAuthority("ROLE_USER")
            );

            CustomUserDetails userDetails =
                    new CustomUserDetails(userId, username, authorities);

            Authentication authentication =
                    new UsernamePasswordAuthenticationToken(
                            userDetails,
                            null,
                            authorities
                    );

            SecurityContextHolder.getContext().setAuthentication(authentication);
        }

        filterChain.doFilter(request, response);
    }

    private String resolveToken(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7); // "Bearer " (7글자) 이후의 토큰 문자열 반환
        }
        return null;
    }
}