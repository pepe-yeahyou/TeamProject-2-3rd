// src/main/java/com/example/myteam/config/SecurityConfig.java (최종 구현)

package com.example.myteam.config;

import com.example.myteam.jwt.JwtAuthenticationFilter;
import com.example.myteam.jwt.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtTokenProvider jwtTokenProvider;
    // 🚨 JwtAuthenticationFilter는 Bean으로 등록하여 주입받거나, 여기서 직접 생성해야 합니다.
    // 여기서는 편의상 JWTProvider를 이용해 필터를 직접 생성합니다.

    // 1. PasswordEncoder Bean 등록 (UserServiceImpl의 빨간불 해소)
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    // 2. 핵심 보안 필터 체인 설정
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                // CORS 설정 (프론트엔드와 백엔드 포트 다를 때 필수)
                .cors(cors -> {}) // @Bean CorsConfigurationSource 구현이 필요할 수 있으나 일단 활성화

                // CSRF 비활성화 (JWT를 사용하므로 세션리스 방식에서 필요 없음)
                .csrf(csrf -> csrf.disable())

                // 세션 미사용 (JWT 기반 인증)
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                // HTTP 요청 인가 규칙 설정
                .authorizeHttpRequests(authorize -> authorize
                        // 인증 관련 경로는 모두 허용 (회원가입, 로그인)
                        .requestMatchers("/api/auth/**", "/h2-console/**").permitAll()
                        // 나머지 모든 요청은 인증 필요
                        .anyRequest().authenticated()
                );

        // 3. JWT 인증 필터 적용
        // UsernamePasswordAuthenticationFilter 이전에 커스텀 필터 실행
        http.addFilterBefore(
                new JwtAuthenticationFilter(jwtTokenProvider), // 🚨 다음 단계에서 구현할 필터
                UsernamePasswordAuthenticationFilter.class
        );

        // H2 Console 사용을 위한 프레임 옵션 비활성화
        http.headers(headers -> headers.frameOptions(frameOptions -> frameOptions.sameOrigin()));

        return http.build();
    }
}