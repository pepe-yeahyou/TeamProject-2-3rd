package com.example.myteam.jwt;

import io.jsonwebtoken.*;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Date;

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
        byte[] keyBytes = secretKey.getBytes(StandardCharsets.UTF_8);
        this.key = Keys.hmacShaKeyFor(keyBytes);
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
        //return true; //원본
        //수정본
        try {
            Jwts.parserBuilder().setSigningKey(key).build().parseClaimsJws(token);
            return true;
        } catch (ExpiredJwtException e) {
            // 토큰이 만료되었을 때 500 에러를 내지 않고 false만 리턴함
            return false;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }

    }

    // 토큰에서 사용자 이름을 추출하는 로직 (JwtAuthenticationFilter에서 사용됨)
    public String getUsernameFromToken(String token) {
        return Jwts.parserBuilder().setSigningKey(key).build()
                .parseClaimsJws(token).getBody().getSubject();
    }
}
