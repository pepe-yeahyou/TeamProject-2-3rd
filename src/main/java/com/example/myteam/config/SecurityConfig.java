package com.example.myteam.config;

import com.example.myteam.jwt.JwtAuthenticationFilter;
import com.example.myteam.jwt.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
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
import java.util.List;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtTokenProvider jwtTokenProvider;

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authenticationConfiguration) throws Exception {
        return authenticationConfiguration.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(csrf -> csrf.disable())
                // H2 콘솔 프레임 허용
                .headers(headers -> headers.frameOptions(f -> f.sameOrigin()))
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // 1. 보안과 무관한 공통 리소스 및 API 허용
                        .requestMatchers("/login", "/register", "/h2-console/**", "/favicon.ico", "/api/chat/**").permitAll()

                        // 2. 프로젝트 관련 API (반드시 authenticated()가 적용되어야 함)
                        // antMatchers 방식처럼 더 명확하게 "/api/projects" 자체와 하위 경로를 모두 포함
                        .requestMatchers("/api/projects", "/api/projects/**").authenticated()

                        // 3. 기타 페이지 접근 권한
                        .requestMatchers("/dashboard/**", "/detail/**", "/summery").authenticated()

                        .requestMatchers(org.springframework.web.cors.CorsUtils::isPreFlightRequest).permitAll()

                        // 4. 나머지 모든 요청
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

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of("http://localhost:3000","http://172.30.1.57:3000"));
        //config.setAllowedOriginPatterns(List.of("*"));
        config.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}