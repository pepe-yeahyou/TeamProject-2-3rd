package com.example.myteam.controller;

import com.example.myteam.command.AuthVO;
import com.example.myteam.command.LoginVO;
import com.example.myteam.command.RegisterVO;
import com.example.myteam.command.UserVO;
import com.example.myteam.user.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.example.myteam.jwt.JwtTokenProvider;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;
    private final JwtTokenProvider jwtTokenProvider;

    // POST /api/auth/register (회원가입)
    @PostMapping("/register")
    public ResponseEntity<String> register(@RequestBody RegisterVO request) {
        try {
            userService.registerUser(
                    request.getUsername(),
                    request.getPassword(),
                    request.getDisplayName()
            );
            return ResponseEntity.ok("회원가입이 성공적으로 완료되었습니다.");
        } catch (RuntimeException e) {
            // 아이디 중복 등 비즈니스 로직 오류 시 400 Bad Request 반환
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // POST /api/auth/login (로그인 및 토큰 발급)
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginVO request) {
        try {
            UserVO user = userService.authenticate(request.getUsername(), request.getPassword());

            // 인증 성공 시, JWT 토큰 생성
            String token = jwtTokenProvider.createToken(user.getUsername(), user.getUserId());

            // 토큰과 사용자 표시 이름을 응답
            return ResponseEntity.ok(new AuthVO(token, user.getDisplayName()));
        } catch (RuntimeException e) {
            // 인증 실패 시 (ID 없거나 PW 불일치), 401 Unauthorized 또는 400 Bad Request 사용
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new AuthVO(null, "로그인 실패: " + e.getMessage()));
        }
    }

    // POST /api/auth/logout (로그아웃)
    @PostMapping("/logout")
    public ResponseEntity<String> logout() {
        // 서버에서는 JWT 무효화(블랙리스트) 처리 대신, 클라이언트에게 토큰 삭제를 지시
        return ResponseEntity.ok("로그아웃 성공");
    }

}
