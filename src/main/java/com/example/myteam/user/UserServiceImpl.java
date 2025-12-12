package com.example.myteam.user;

import com.example.myteam.command.UserVO;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service("userService") // Spring Bean으로 등록하며, 이름 지정 가능
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    // 주입: Mapper와 PasswordEncoder
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;

    // 1. 회원가입 로직 구현
    @Override
    @Transactional
    public UserVO registerUser(String username, String password, String displayName) {
        if (userMapper.existsByUsername(username)) {
            throw new RuntimeException("이미 존재하는 사용자 이름입니다: " + username);
        }
        UserVO user = new UserVO();
        user.setUsername(username);
        //비밀번호 암호화 처리
        user.setPasswordHash(passwordEncoder.encode(password));
        user.setDisplayName(displayName);
        userMapper.insertUser(user);
        return user;
    }

    // 2. 로그인 인증 로직 구현
    @Override
    public UserVO authenticate(String username, String password) {
        UserVO user = userMapper.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("아이디를 찾을 수 없습니다."));

        //비밀번호 일치 확인 (암호화된 값 비교)
        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            throw new RuntimeException("비밀번호가 일치하지 않습니다.");
        }
        return user;
    }

    // 3. 사용자 ID 조회 로직 구현
    @Override
    public Long getUserIdByUsername(String username) {
        return userMapper.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("사용자 ID를 찾을 수 없습니다."))
                .getUserId();
    }
}