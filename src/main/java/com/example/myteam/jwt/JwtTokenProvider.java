package com.example.myteam.jwt;

import io.jsonwebtoken.*;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Date;

@Slf4j
@Component
public class JwtTokenProvider {

    // application.properties에서 설정된 JWT Secret Key를 주입받음
    @Value("${jwt.secret}")
    private String secretKey;

    // application.properties에서 설정된 토큰 만료 시간을 주입받음
    @Value("${jwt.expiration-time}")
    private long tokenValidityInMilliseconds;

    private Key key;

    // Secret Key를 Base64 디코딩하여 HMAC SHA Key로 변환 (컴포넌트 초기화 시 실행)
    @PostConstruct
    public void init() {
        // 1. 키가 제대로 읽히는지 로그로 확인
        log.info("로딩된 Secret Key: {}", secretKey);

        // 2. 충분한 길이를 가진 문자열이므로 그대로 바이트 배열로 변환
        byte[] keyBytes = secretKey.getBytes(StandardCharsets.UTF_8);
        this.key = Keys.hmacShaKeyFor(keyBytes);

        log.info("JWT 키 생성 완료 (길이: {} bytes)", keyBytes.length);
    }

    public String createToken(String username, Long userId) {
        Claims claims = Jwts.claims().setSubject(username);
        claims.put("userId", userId);

        Date now = new Date();
        Date validity = new Date(now.getTime() + tokenValidityInMilliseconds);

        return Jwts.builder()
                .setClaims(claims)
                .setIssuedAt(now)
                .setExpiration(validity)
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    // 토큰 검증 로직 (JwtAuthenticationFilter에서 사용됨)
    public boolean validateToken(String token) {
        try {
            Jwts.parserBuilder().setSigningKey(key).build().parseClaimsJws(token);
            return true;
        } catch (io.jsonwebtoken.security.SecurityException | MalformedJwtException e) {
            log.info("잘못된 JWT 서명입니다.");
        } catch (ExpiredJwtException e) {
            log.info("만료된 JWT 토큰입니다.");
        } catch (UnsupportedJwtException e) {
            log.info("지원되지 않는 JWT 토큰입니다.");
        } catch (IllegalArgumentException e) {
            log.info("JWT 토큰이 잘못되었습니다.");
        }
        return false; // 검증 실패 시 false 반환
    }

    // 토큰에서 사용자 이름을 추출하는 로직 (JwtAuthenticationFilter에서 사용됨)
    public String getUsernameFromToken(String token) {
        return Jwts.parserBuilder().setSigningKey(key).build()
                .parseClaimsJws(token).getBody().getSubject();
    }

    public Long getUserIdFromToken(String token) {
        Claims claims = Jwts.parserBuilder()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token)
                .getBody();

        Object userId = claims.get("userId");

        if (userId instanceof Integer) {
            return ((Integer) userId).longValue();
        } else if (userId instanceof Long) {
            return (Long) userId;
        }

        return null;
    }

}
