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
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtTokenProvider jwtTokenProvider;

    // 1. PasswordEncoder Bean 등록
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        // 프론트엔드 출처 명시 (3000번 포트)
        configuration.setAllowedOrigins(Arrays.asList("http://localhost:3000"));

        // 허용할 HTTP 메서드
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));

        // 요청 헤더 모두 허용
        configuration.setAllowedHeaders(Arrays.asList("*"));

        // 인증 정보 (토큰 등) 허용
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        // 모든 API 경로에 대해 위의 CORS 설정을 적용
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    // 2. 핵심 보안 필터 체인 설정
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                // CORS 설정 (프론트엔드와 백엔드 포트 다를 때 필수)
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))

                // CSRF 비활성화 (JWT를 사용하므로 세션리스 방식에서 필요 없음)
                .csrf(csrf -> csrf.disable())

                // 세션 미사용 (JWT 기반 인증)
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                // HTTP 요청 인가 규칙 설정
                .authorizeHttpRequests(authorize -> authorize
                        // 1. 회원가입, 로그인 경로는 모두 허용 (명세서 일치)
                        .requestMatchers("/register", "/login", "/h2-console/**").permitAll()

                        // 2. 메인화면/프로젝트 관련 (명세서 경로 반영)
                        // 명세서에 /summery, /projects, /detail/** 등이 있으므로 이 주소들을 허용하거나 인증 설정
                        .requestMatchers("/summery", "/projects/**", "/detail/**", "/api/projects/**").authenticated()

                        // 3. 나머지 모든 요청은 인증 필요
                        .anyRequest().authenticated()
                );

        // 3. JWT 인증 필터 적용
        // UsernamePasswordAuthenticationFilter 이전에 커스텀 필터 실행
        http.addFilterBefore(
                new JwtAuthenticationFilter(jwtTokenProvider),
                UsernamePasswordAuthenticationFilter.class
        );

        // H2 Console 사용을 위한 프레임 옵션 비활성화
        http.headers(headers -> headers.frameOptions(frameOptions -> frameOptions.sameOrigin()));

        return http.build();
    }
}