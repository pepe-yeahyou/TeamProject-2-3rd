// src/main/java/com/example/myteam/jwt/JwtAuthenticationFilter.java
package com.example.myteam.jwt;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.ArrayList; // 권한이 없을 경우 빈 리스트를 사용

// @Component 대신 SecurityConfig에서 직접 생성하여 주입할 것이므로 @RequiredArgsConstructor만 사용합니다.
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider jwtTokenProvider;

    /**
     * 요청당 한 번만 필터링을 수행합니다.
     */
    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        // 1. HTTP 헤더에서 토큰 추출
        String token = resolveToken(request);

        // 2. 토큰 유효성 검사 및 인증 처리
        if (token != null && jwtTokenProvider.validateToken(token)) {

            // 토큰에서 사용자 이름(Username) 추출
            String username = jwtTokenProvider.getUsernameFromToken(token);

            // UserDetails 객체 생성 (권한은 현재 구현하지 않았으므로 빈 리스트 사용)
            UserDetails userDetails = new User(username, "", new ArrayList<>());

            // Spring Security 인증 객체 생성
            Authentication authentication = new UsernamePasswordAuthenticationToken(
                    userDetails, // 사용자 정보 (Principal)
                    "",          // 자격 증명 (Credentials, 여기서는 필요 없음)
                    userDetails.getAuthorities() // 권한
            );

            // 3. Security Context에 인증 객체 저장
            // 이로써 해당 요청은 인증된 상태로 간주됩니다.
            SecurityContextHolder.getContext().setAuthentication(authentication);
        }

        // 다음 필터 또는 서블릿으로 요청 전달
        filterChain.doFilter(request, response);
    }

    /**
     * Request Header에서 JWT 토큰 정보를 추출합니다.
     * 토큰은 보통 "Bearer {TOKEN}" 형태로 전송됩니다.
     */
    private String resolveToken(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7); // "Bearer " (7글자) 이후의 토큰 문자열 반환
        }
        return null;
    }
}